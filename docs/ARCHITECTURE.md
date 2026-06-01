# Architecture — Enterprise RAG Platform

## Overview

The Enterprise RAG (Retrieval-Augmented Generation) Knowledge Platform is a FastAPI service that enables multi-tenant document Q&A. Clients upload documents, which are chunked and indexed in a JSON-backed store. Search and answer endpoints retrieve relevant chunks and synthesise answers with citations.

## Component Diagram

```mermaid
flowchart TD
    Client["API Client\n(curl / frontend)"]

    subgraph API["FastAPI Service  :8000"]
        Routes["routes/documents.py\n(POST /upload, GET /search,\nPOST /answer, POST /evaluate)"]
        Service["services/document_service.py\nDocumentService\n- upload / chunk\n- keyword search\n- answer + citation\n- evaluation scoring\n- analytics snapshot"]
        Schemas["models/schemas.py\nPydantic v2 schemas"]
    end

    subgraph Store["Persistence Layer"]
        JSON["apps/api/data/store.json\nJSON-file store\n(upload / eval records)"]
    end

    subgraph Ops["Ops Pipeline"]
        Smoke["scripts/run_rag_smoke.py"]
        LoadTest["ops/loadtest/run_load_test.py"]
        SLO["ops/perf/validate_slo.py"]
        Alerts["ops/alerts/alert_rules.yaml\n(Prometheus)"]
        DepScan["ops/security/dependency_scan.py"]
    end

    subgraph K8s["Kubernetes"]
        Staging["staging namespace\n2 replicas"]
        Prod["prod namespace\n3 replicas + HPA"]
        Canary["canary namespace\n1 replica"]
    end

    Client --> Routes
    Routes --> Service
    Service --> Schemas
    Service --> JSON
    Smoke --> Service
    LoadTest --> Routes
    LoadTest --> SLO
    Alerts -.->|"alert on high error rate\nor p95 latency"| Prod
    DepScan --> JSON
    API --> Staging
    API --> Prod
    API --> Canary
```

## Data Flow

1. **Upload** — Client POSTs document text → `DocumentService.upload()` → chunks into `DocumentChunk` records → persists to `store.json`
2. **Search** — Client GETs query → keyword scan over chunks → returns `SearchResult` list with scores
3. **Answer** — Client POSTs question → retrieves top chunks → builds `AnswerResponse` with `AnswerCitation` list
4. **Evaluate** — Client POSTs eval request → scores answer quality → stores `EvaluationRecord`
5. **Analytics** — Client GETs snapshot → aggregates query counts, top terms, eval metrics

## Key Design Decisions

| Decision                    | Rationale                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| JSON file store             | Zero-dependency portability; swap for pgvector/Weaviate in prod                  |
| Pydantic v2 schemas         | Full input validation at API boundary; prevents injection via malformed payloads |
| Multi-tenant by `tenant_id` | All store operations filter by tenant; prevents cross-tenant data leakage        |
| Seed demo docs on first run | Enables zero-config demo without a separate data setup step                      |
| Chunking strategy           | Fixed-window chunking simulates real vector-store chunking for demo fidelity     |

## Production Architecture (Target)

```mermaid
flowchart LR
    LB["Cloud Load Balancer"] --> API
    API["FastAPI Pods\n(3 replicas)"] --> VectorDB["pgvector / Weaviate"]
    API --> Cache["Redis\n(query cache)"]
    API --> AuthSvc["Auth Service\n(OAuth2 / JWT)"]
    CI["GitHub Actions CI"] -->|"image push"| Registry["ghcr.io"]
    Registry -->|"k8s rolling update"| API
    Prometheus --> API
    Grafana --> Prometheus
```

## Directory Map

```
enterprise-rag-platform/
├── apps/api/
│   ├── app/
│   │   ├── main.py              # FastAPI app, /health
│   │   ├── routes/documents.py  # HTTP layer
│   │   ├── services/            # Business logic
│   │   └── models/schemas.py    # Pydantic models
│   ├── scripts/                 # Smoke scripts
│   └── tests/                   # unittest suite
├── deploy/k8s/
│   ├── staging/                 # 2 replicas
│   ├── prod/                    # 3 replicas + resource limits
│   └── canary/                  # 1 replica, canary track
├── ops/
│   ├── alerts/                  # Prometheus rules
│   ├── loadtest/                # Load test + SLO validation
│   ├── perf/                    # SLO targets + validator
│   ├── runbooks/                # Incident response
│   └── security/                # Dep scan + SBOM
└── .github/workflows/ci.yml
```
