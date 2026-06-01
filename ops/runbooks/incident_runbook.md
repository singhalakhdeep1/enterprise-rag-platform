# Incident Runbook - Enterprise RAG Platform

## Triggers

- High 5xx error rate
- Search latency SLO breach
- Tenant export failures

## Immediate Steps

1. Confirm impact scope (tenants, endpoints, regions).
2. Check service health and recent deployment changes.
3. Roll back to previous stable release if error rate is rising.
4. Disable non-critical background operations if saturation is high.

## Recovery Steps

1. Restore healthy API response for `/health`, search, and answer paths.
2. Verify smoke flow using `apps/api/scripts/run_rag_smoke.py`.
3. Confirm alerts are cleared and SLOs return to target.

## Post-Incident

1. Document root cause and timeline.
2. Add regression test and alert improvements.
3. Update readiness and release checklist notes.
