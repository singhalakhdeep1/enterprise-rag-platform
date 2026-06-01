# Enterprise RAG Platform - FAANG Readiness Plan

Status: FAANG hardening phase 1 complete (demo to production transition plan implemented)
Last updated: 2026-06-01

## Target SLOs

- API availability: 99.95%
- Search p95 latency: <= 350ms
- Answer p95 latency: <= 1200ms
- Error rate (5xx): < 0.5%
- Recovery objective (RTO): <= 30 minutes
- Data loss objective (RPO): <= 5 minutes

## Capacity Targets

- Sustained queries: 300 requests per second
- Peak burst: 800 requests per second for 10 minutes
- Concurrent tenants: 500 active tenants
- Index size target: 50 million chunks

## Security Controls

- JWT or OIDC service auth for all non-health endpoints
- Role-based access control (tenant-admin, tenant-user, platform-admin)
- At-rest encryption for document and chunk persistence
- In-transit TLS enforcement
- Secrets from vault provider, never from source files
- CI dependency scan and baseline vulnerability budget

## Reliability and Operations

- SLO dashboard with latency, errors, saturation, and throughput
- Alert policy for burn-rate and regression detection
- Blue-green or canary deployment with rollback hooks
- Incident runbook for search outage and answer degradation
- Synthetic probe for upload-search-answer flow

## Delivery Gates

- Unit tests and smoke tests required on pull requests
- Schema and contract compatibility check required
- Change log and rollback notes required for production deploys
- Release checklist and runbook update required per release

## Acceptance Criteria

- [x] Release checklist present and maintained
- [x] CI pipeline present and validates tests + smoke flow
- [x] Smoke script and output artifact in place
- [x] Explicit SLO, security, and reliability targets documented
- [x] Automated readiness audit script present
