from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.documents import router as documents_router

app = FastAPI(
    title="Enterprise RAG Knowledge Platform API",
    version="0.1.0",
    description="Backend API for ingestion, search, and future retrieval workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "enterprise-rag-api", "mode": "demo-persistent"}


app.include_router(documents_router, prefix="/api/v1")
