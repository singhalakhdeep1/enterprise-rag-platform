# Enterprise RAG Platform - Release Checklist

Release status: Production-demo ready
Last updated: 2026-06-01

## Acceptance Criteria

- [x] API boots locally via `python -m uvicorn app.main:app --reload`
- [x] Core flows implemented: upload, search, answer, evaluate, analytics, export, tenant reset
- [x] Backend tests pass: `python -m unittest discover -s tests -p "test_*.py"`
- [x] Smoke flow script exists and runs: `python scripts/run_rag_smoke.py`
- [x] Smoke artifact is generated: `apps/api/data/rag_smoke_result.json`
- [x] API contract documented in README with runnable examples
- [x] CI workflow exists and runs tests + smoke flow: `.github/workflows/ci.yml`

## Production-Demo Sign-Off

- [x] Ready for recruiter demo
- [x] Ready for portfolio showcase
- [x] Ready for interview walk-through

## Notes

Current persistence is JSON-backed local storage by design for no-infra demo portability.
