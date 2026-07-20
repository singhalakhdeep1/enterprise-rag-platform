# Enterprise RAG Knowledge Platform

A multi-tenant document intelligence platform with a FastAPI backend and Next.js frontend. This portfolio-grade local build demonstrates ingestion, chunking, retrieval, grounded answer synthesis, evaluation, analytics, tenant exports, and admin reset flows without requiring managed cloud dependencies.

## Tech Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: FastAPI, Python 3.12
- Async jobs: Celery + Redis
- Storage: PostgreSQL + pgvector, S3/MinIO
- Observability: OpenTelemetry, Prometheus, Grafana

## Implementation

- FastAPI API with persistent JSON-backed document catalog, chunk store, search, answer, evaluation, and analytics endpoints
- Seeded demo tenants for immediate interaction after startup
- Next.js control plane for ingestion, semantic search, grounded answer generation, indexed document browsing, and evaluation metrics
- Tenant catalog, tenant export, and reset flows for local admin workflows
- Deterministic backend tests covering upload, retrieval, answer generation, evaluation, export, and reset
- Monorepo structure ready for pgvector, Celery, object storage, and observability upgrades

## Local Development

### Backend

```bash
cd apps/api
python -m uvicorn app.main:app --reload
```

### Backend tests

```bash
cd apps/api
python -m unittest discover -s tests -p "test_*.py"
```

### Backend smoke run

```bash
cd apps/api
python scripts/run_rag_smoke.py
```

Generated artifact:

- `apps/api/data/rag_smoke_result.json`

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Seed and test

Use `POST /api/v1/documents/upload` to add a document, then query `POST /api/v1/documents/search`.

Available endpoints:

- `GET /health`
- `GET /api/v1/documents/tenants`
- `GET /api/v1/documents?tenant_id=demo-team`
- `POST /api/v1/documents/upload`
- `POST /api/v1/documents/search`
- `POST /api/v1/documents/answer`
- `POST /api/v1/documents/evaluate`
- `GET /api/v1/documents/analytics/{tenant_id}`
- `GET /api/v1/documents/export/{tenant_id}`
- `DELETE /api/v1/documents/{tenant_id}`

### Example local flow

```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Security Operations Guide",
    "tenant_id": "demo-team",
    "source_type": "manual",
    "content": "Admin users must use MFA for production access and incident updates are required every 30 minutes."
  }'

curl -X POST http://localhost:8000/api/v1/documents/search \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "demo-team", "query": "MFA production access", "top_k": 3}'

curl -X POST http://localhost:8000/api/v1/documents/answer \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "demo-team", "question": "What is required for production access?"}'
```

## Structure

```text
enterprise-rag-platform/
  apps/
    api/
      app/
      tests/
    web/
  docker-compose.yml
```

## Architecture notes

1. Ingestion stores document metadata, full content, and chunked slices in a JSON-backed repository so the system remains runnable without external services.
2. Retrieval uses lexical term matching over chunk content, producing scored result sets and chunk-level citations.
3. Answer generation builds grounded synthesis strictly from retrieved chunks, preserving explainability for demo use.
4. Evaluation computes groundedness, keyword coverage, and answer confidence, then stores historical records for inspection.
5. Tenant export packages documents, chunks, evaluation history, and analytics into one response for downstream processing.

## Next steps

1. Replace the in-memory registry with PostgreSQL + pgvector persistence.
2. Add async ingestion with Celery and Redis.
3. Integrate object storage, OCR, hybrid retrieval, and answer generation.

---

## 📝 License

Proprietary - All rights reserved.
