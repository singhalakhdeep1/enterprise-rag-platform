from __future__ import annotations

import json
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

from app.models.schemas import (
    AnalyticsSnapshot,
    AnswerCitation,
    AnswerRequest,
    AnswerResponse,
    DocumentCatalogResponse,
    DocumentChunk,
    DocumentRecord,
    DocumentUploadRequest,
    EvaluationMetric,
    EvaluationRecord,
    EvaluationRequest,
    ResetTenantResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    TenantCatalogResponse,
    TenantExportResponse,
    TenantProfile,
)


class DocumentService:
    def __init__(self) -> None:
        self._documents: Dict[str, DocumentRecord] = {}
        self._contents: Dict[str, str] = {}
        self._chunks: Dict[str, List[DocumentChunk]] = {}
        self._evaluations: List[EvaluationRecord] = []
        self._queries_run = 0
        self._search_terms: Dict[str, int] = {}
        self._store_path = Path(__file__).resolve().parents[2] / "data" / "store.json"
        self._store_path.parent.mkdir(parents=True, exist_ok=True)
        self._load()
        if not self._documents:
            self._seed_demo_documents()

    def upload(self, payload: DocumentUploadRequest) -> DocumentRecord:
        document_id = str(uuid4())
        chunks = self._build_chunks(document_id=document_id, payload=payload)
        record = DocumentRecord(
            id=document_id,
            title=payload.title,
            tenant_id=payload.tenant_id,
            source_type=payload.source_type,
            content_preview=payload.content[:180],
            chunk_count=len(chunks),
            created_at=datetime.now(UTC),
        )
        self._documents[document_id] = record
        self._contents[document_id] = payload.content
        self._chunks[document_id] = chunks
        self._persist()
        return record

    def list_documents(self, tenant_id: str | None = None) -> DocumentCatalogResponse:
        documents = list(self._documents.values())
        if tenant_id:
            documents = [document for document in documents if document.tenant_id == tenant_id]
        documents.sort(key=lambda document: document.created_at, reverse=True)
        return DocumentCatalogResponse(documents=documents)

    def search(self, payload: SearchRequest) -> SearchResponse:
        query_terms = [term.lower() for term in payload.query.split() if len(term) > 2]
        ranked_results: List[SearchResult] = []

        self._queries_run += 1
        for term in query_terms:
            self._search_terms[term] = self._search_terms.get(term, 0) + 1

        for document_id, record in self._documents.items():
            if record.tenant_id != payload.tenant_id:
                continue

            for chunk in self._chunks.get(document_id, []):
                content = chunk.content.lower()
                matched_terms = [term for term in query_terms if term in content]
                if not matched_terms:
                    continue

                density_bonus = min(0.18, len(content) / 3000)
                score = round(min(0.99, 0.45 + (0.1 * len(set(matched_terms))) + density_bonus), 2)
                ranked_results.append(
                    SearchResult(
                        document_id=document_id,
                        chunk_id=chunk.id,
                        title=record.title,
                        excerpt=chunk.content[:220],
                        citation=f"{record.title} · chunk {chunk.order + 1}",
                        score=score,
                        matched_terms=sorted(set(matched_terms)),
                    )
                )

        ranked_results.sort(key=lambda item: item.score, reverse=True)
        self._persist()
        return SearchResponse(query=payload.query, results=ranked_results[: payload.top_k])

    def answer(self, payload: AnswerRequest) -> AnswerResponse:
        search_results = self.search(
            SearchRequest(tenant_id=payload.tenant_id, query=payload.question, top_k=payload.top_k)
        )
        citations = [
            AnswerCitation(
                document_id=result.document_id,
                chunk_id=result.chunk_id,
                title=result.title,
                quote=result.excerpt,
                citation=result.citation,
            )
            for result in search_results.results
        ]

        if not citations:
            return AnswerResponse(
                question=payload.question,
                answer=(
                    "No grounded answer is available yet because no indexed chunk matched the question. "
                    "Upload more tenant documents or adjust the query phrasing."
                ),
                confidence=0.12,
                citations=[],
                retrieved_chunks=0,
            )

        summary_lines = []
        for citation in citations[:3]:
            snippet = citation.quote.replace("\n", " ").strip()
            summary_lines.append(f"{citation.title}: {snippet}")

        answer_text = (
            "Grounded synthesis based on indexed tenant knowledge: "
            + " ".join(summary_lines)
            + " Review the cited chunks before using this in a production response flow."
        )
        avg_score = sum(result.score for result in search_results.results) / len(search_results.results)
        confidence = round(min(0.96, max(0.25, avg_score)), 2)
        return AnswerResponse(
            question=payload.question,
            answer=answer_text,
            confidence=confidence,
            citations=citations,
            retrieved_chunks=len(citations),
        )

    def evaluate(self, payload: EvaluationRequest) -> EvaluationRecord:
        answer = self.answer(AnswerRequest(tenant_id=payload.tenant_id, question=payload.question))
        normalized_keywords = [keyword.lower() for keyword in payload.expected_keywords if keyword.strip()]
        answer_lower = answer.answer.lower()
        matched_keywords = [keyword for keyword in normalized_keywords if keyword in answer_lower]
        keyword_score = 1.0 if not normalized_keywords else len(matched_keywords) / len(normalized_keywords)
        groundedness_score = min(1.0, len(answer.citations) / 3)
        confidence_score = answer.confidence
        metrics = [
            EvaluationMetric(
                name="groundedness",
                score=round(groundedness_score, 2),
                passed=groundedness_score >= 0.66,
                details=f"{len(answer.citations)} citations retrieved for the answer.",
            ),
            EvaluationMetric(
                name="keyword_coverage",
                score=round(keyword_score, 2),
                passed=keyword_score >= 0.5,
                details=(
                    "No expected keywords supplied."
                    if not normalized_keywords
                    else f"Matched {len(matched_keywords)} of {len(normalized_keywords)} expected keywords."
                ),
            ),
            EvaluationMetric(
                name="answer_confidence",
                score=round(confidence_score, 2),
                passed=confidence_score >= 0.5,
                details="Derived from the top retrieved chunk scores.",
            ),
        ]
        evaluation = EvaluationRecord(
            id=str(uuid4()),
            tenant_id=payload.tenant_id,
            question=payload.question,
            created_at=datetime.now(UTC),
            answer_confidence=answer.confidence,
            metrics=metrics,
        )
        self._evaluations.append(evaluation)
        self._persist()
        return evaluation

    def analytics(self, tenant_id: str) -> AnalyticsSnapshot:
        tenant_documents = [document for document in self._documents.values() if document.tenant_id == tenant_id]
        total_chunks = sum(document.chunk_count for document in tenant_documents)
        last_ingested_at = max((document.created_at for document in tenant_documents), default=None)
        top_terms = sorted(self._search_terms, key=self._search_terms.get, reverse=True)[:5]
        evaluations_run = len([evaluation for evaluation in self._evaluations if evaluation.tenant_id == tenant_id])
        return AnalyticsSnapshot(
            tenant_id=tenant_id,
            total_documents=len(tenant_documents),
            total_chunks=total_chunks,
            queries_run=self._queries_run,
            evaluations_run=evaluations_run,
            last_ingested_at=last_ingested_at,
            top_terms=top_terms,
        )

    def list_tenants(self) -> TenantCatalogResponse:
        tenant_ids = sorted({document.tenant_id for document in self._documents.values()})
        tenants: List[TenantProfile] = []
        for tenant_id in tenant_ids:
            tenant_documents = [document for document in self._documents.values() if document.tenant_id == tenant_id]
            tenants.append(
                TenantProfile(
                    tenant_id=tenant_id,
                    document_count=len(tenant_documents),
                    chunk_count=sum(document.chunk_count for document in tenant_documents),
                    latest_activity_at=max((document.created_at for document in tenant_documents), default=None),
                )
            )
        return TenantCatalogResponse(tenants=tenants)

    def export_tenant(self, tenant_id: str) -> TenantExportResponse:
        documents = [document for document in self._documents.values() if document.tenant_id == tenant_id]
        chunks = [
            chunk
            for document_chunks in self._chunks.values()
            for chunk in document_chunks
            if chunk.tenant_id == tenant_id
        ]
        evaluations = [evaluation for evaluation in self._evaluations if evaluation.tenant_id == tenant_id]
        return TenantExportResponse(
            tenant_id=tenant_id,
            exported_at=datetime.now(UTC),
            documents=sorted(documents, key=lambda document: document.created_at, reverse=True),
            chunks=sorted(chunks, key=lambda chunk: (chunk.title, chunk.order)),
            evaluations=sorted(evaluations, key=lambda evaluation: evaluation.created_at, reverse=True),
            analytics=self.analytics(tenant_id),
        )

    def reset_tenant(self, tenant_id: str) -> ResetTenantResponse:
        tenant_document_ids = [
            document_id for document_id, document in self._documents.items() if document.tenant_id == tenant_id
        ]
        removed_evaluations = len([evaluation for evaluation in self._evaluations if evaluation.tenant_id == tenant_id])
        self._evaluations = [evaluation for evaluation in self._evaluations if evaluation.tenant_id != tenant_id]
        for document_id in tenant_document_ids:
            self._documents.pop(document_id, None)
            self._contents.pop(document_id, None)
            self._chunks.pop(document_id, None)
        self._persist()
        return ResetTenantResponse(
            tenant_id=tenant_id,
            removed_documents=len(tenant_document_ids),
            removed_evaluations=removed_evaluations,
        )

    def _build_chunks(self, document_id: str, payload: DocumentUploadRequest) -> List[DocumentChunk]:
        paragraphs = [paragraph.strip() for paragraph in payload.content.split("\n") if paragraph.strip()]
        if not paragraphs:
            paragraphs = [payload.content.strip()]

        combined_chunks: List[str] = []
        current = ""
        for paragraph in paragraphs:
            proposed = f"{current}\n{paragraph}".strip() if current else paragraph
            if len(proposed) <= 420:
                current = proposed
                continue

            if current:
                combined_chunks.append(current)
            current = paragraph

        if current:
            combined_chunks.append(current)

        chunks: List[DocumentChunk] = []
        for index, chunk_content in enumerate(combined_chunks):
            chunks.append(
                DocumentChunk(
                    id=str(uuid4()),
                    document_id=document_id,
                    title=payload.title,
                    tenant_id=payload.tenant_id,
                    order=index,
                    content=chunk_content,
                    token_estimate=max(1, len(chunk_content.split())),
                )
            )
        return chunks

    def _seed_demo_documents(self) -> None:
        demo_documents = [
            DocumentUploadRequest(
                title="Security Policy Handbook",
                tenant_id="demo-team",
                source_type="policy",
                content=(
                    "All production systems require MFA for admin access. Security incidents must be "
                    "reported within 30 minutes and audited in the incident register. Customer PII "
                    "must remain encrypted at rest and in transit."
                ),
            ),
            DocumentUploadRequest(
                title="Customer Support Runbook",
                tenant_id="demo-team",
                source_type="runbook",
                content=(
                    "Support agents triage high severity cases first. Refund requests require order "
                    "validation, payment gateway status, and a customer communication update before "
                    "resolution. Escalations older than 24 hours trigger manager review."
                ),
            ),
            DocumentUploadRequest(
                title="HR Leave Policy",
                tenant_id="people-ops",
                source_type="policy",
                content=(
                    "Employees can apply for annual leave through the HRIS portal. Manager approval "
                    "is required for leave exceeding three consecutive business days. Carry forward "
                    "limits reset at the end of the fiscal year."
                ),
            ),
        ]

        for payload in demo_documents:
            self.upload(payload)

    def _persist(self) -> None:
        payload = {
            "documents": [document.model_dump(mode="json") for document in self._documents.values()],
            "contents": self._contents,
            "chunks": {
                document_id: [chunk.model_dump(mode="json") for chunk in chunks]
                for document_id, chunks in self._chunks.items()
            },
            "evaluations": [evaluation.model_dump(mode="json") for evaluation in self._evaluations],
            "queries_run": self._queries_run,
            "search_terms": self._search_terms,
        }
        self._store_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _load(self) -> None:
        if not self._store_path.exists():
            return

        raw_payload = json.loads(self._store_path.read_text(encoding="utf-8"))
        self._documents = {
            document["id"]: DocumentRecord.model_validate(document)
            for document in raw_payload.get("documents", [])
        }
        self._contents = dict(raw_payload.get("contents", {}))
        self._chunks = {
            document_id: [DocumentChunk.model_validate(chunk) for chunk in chunks]
            for document_id, chunks in raw_payload.get("chunks", {}).items()
        }
        self._evaluations = [
            EvaluationRecord.model_validate(evaluation)
            for evaluation in raw_payload.get("evaluations", [])
        ]
        self._queries_run = int(raw_payload.get("queries_run", 0))
        self._search_terms = {
            key: int(value) for key, value in raw_payload.get("search_terms", {}).items()
        }


document_service = DocumentService()
