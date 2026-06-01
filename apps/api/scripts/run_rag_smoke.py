import json
from pathlib import Path

from app.models.schemas import AnswerRequest, DocumentUploadRequest, EvaluationRequest, SearchRequest
from app.services.document_service import DocumentService


def run_smoke() -> dict:
    service = DocumentService()

    uploaded = service.upload(
        DocumentUploadRequest(
            title="Platform Operations Policy",
            tenant_id="smoke-tenant",
            source_type="policy",
            content=(
                "Production access requires MFA and ticket approval. "
                "Incident updates must be posted every 30 minutes."
            ),
        )
    )

    search = service.search(SearchRequest(tenant_id="smoke-tenant", query="MFA production access", top_k=3))
    answer = service.answer(AnswerRequest(tenant_id="smoke-tenant", question="What is required for production access?"))
    evaluation = service.evaluate(
        EvaluationRequest(
            tenant_id="smoke-tenant",
            question="What is required for production access?",
            expected_keywords=["MFA", "production", "access"],
        )
    )

    result = {
        "document_id": uploaded.id,
        "search_results": len(search.results),
        "answer_confidence": answer.confidence,
        "evaluation_id": evaluation.id,
        "evaluation_metrics": {metric.name: metric.score for metric in evaluation.metrics},
    }

    out_path = Path(__file__).resolve().parents[1] / "data" / "rag_smoke_result.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


if __name__ == "__main__":
    print(json.dumps(run_smoke(), indent=2))
