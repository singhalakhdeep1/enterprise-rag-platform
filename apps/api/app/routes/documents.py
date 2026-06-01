from fastapi import APIRouter

from app.models.schemas import (
    AnalyticsSnapshot,
    AnswerRequest,
    AnswerResponse,
    DocumentCatalogResponse,
    DocumentRecord,
    DocumentUploadRequest,
    EvaluationRecord,
    EvaluationRequest,
    ResetTenantResponse,
    SearchRequest,
    SearchResponse,
    TenantCatalogResponse,
    TenantExportResponse,
)
from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/tenants", response_model=TenantCatalogResponse)
def list_tenants() -> TenantCatalogResponse:
    return document_service.list_tenants()


@router.get("", response_model=DocumentCatalogResponse)
def list_documents(tenant_id: str | None = None) -> DocumentCatalogResponse:
    return document_service.list_documents(tenant_id=tenant_id)


@router.post("/upload", response_model=DocumentRecord)
def upload_document(payload: DocumentUploadRequest) -> DocumentRecord:
    return document_service.upload(payload)


@router.post("/search", response_model=SearchResponse)
def search_documents(payload: SearchRequest) -> SearchResponse:
    return document_service.search(payload)


@router.post("/answer", response_model=AnswerResponse)
def answer_question(payload: AnswerRequest) -> AnswerResponse:
    return document_service.answer(payload)


@router.post("/evaluate", response_model=EvaluationRecord)
def evaluate_answer(payload: EvaluationRequest) -> EvaluationRecord:
    return document_service.evaluate(payload)


@router.get("/analytics/{tenant_id}", response_model=AnalyticsSnapshot)
def get_analytics(tenant_id: str) -> AnalyticsSnapshot:
    return document_service.analytics(tenant_id)


@router.get("/export/{tenant_id}", response_model=TenantExportResponse)
def export_tenant(tenant_id: str) -> TenantExportResponse:
    return document_service.export_tenant(tenant_id)


@router.delete("/{tenant_id}", response_model=ResetTenantResponse)
def reset_tenant(tenant_id: str) -> ResetTenantResponse:
    return document_service.reset_tenant(tenant_id)
