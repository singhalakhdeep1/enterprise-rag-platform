from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class DocumentUploadRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    tenant_id: str = Field(min_length=2, max_length=60)
    source_type: str = Field(default="manual", min_length=2, max_length=40)
    content: str = Field(min_length=20)


class DocumentRecord(BaseModel):
    id: str
    title: str
    tenant_id: str
    source_type: str
    content_preview: str
    chunk_count: int
    created_at: datetime


class DocumentCatalogResponse(BaseModel):
    documents: List[DocumentRecord]


class DocumentChunk(BaseModel):
    id: str
    document_id: str
    title: str
    tenant_id: str
    order: int
    content: str
    token_estimate: int


class SearchRequest(BaseModel):
    tenant_id: str = Field(min_length=2, max_length=60)
    query: str = Field(min_length=3, max_length=500)
    top_k: int = Field(default=5, ge=1, le=10)


class SearchResult(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    excerpt: str
    citation: str
    score: float
    matched_terms: List[str]


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


class AnswerRequest(BaseModel):
    tenant_id: str = Field(min_length=2, max_length=60)
    question: str = Field(min_length=5, max_length=500)
    top_k: int = Field(default=4, ge=1, le=8)


class AnswerCitation(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    quote: str
    citation: str


class AnswerResponse(BaseModel):
    question: str
    answer: str
    confidence: float
    citations: List[AnswerCitation]
    retrieved_chunks: int


class EvaluationRequest(BaseModel):
    tenant_id: str = Field(min_length=2, max_length=60)
    question: str = Field(min_length=5, max_length=500)
    expected_keywords: List[str] = Field(default_factory=list, max_length=12)


class EvaluationMetric(BaseModel):
    name: str
    score: float
    passed: bool
    details: str


class EvaluationRecord(BaseModel):
    id: str
    tenant_id: str
    question: str
    created_at: datetime
    answer_confidence: float
    metrics: List[EvaluationMetric]


class AnalyticsSnapshot(BaseModel):
    tenant_id: str
    total_documents: int
    total_chunks: int
    queries_run: int
    evaluations_run: int
    last_ingested_at: datetime | None
    top_terms: List[str]


class TenantProfile(BaseModel):
    tenant_id: str
    document_count: int
    chunk_count: int
    latest_activity_at: datetime | None


class TenantCatalogResponse(BaseModel):
    tenants: List[TenantProfile]


class TenantExportResponse(BaseModel):
    tenant_id: str
    exported_at: datetime
    documents: List[DocumentRecord]
    chunks: List[DocumentChunk]
    evaluations: List[EvaluationRecord]
    analytics: AnalyticsSnapshot


class ResetTenantResponse(BaseModel):
    tenant_id: str
    removed_documents: int
    removed_evaluations: int
