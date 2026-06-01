# Security Policy — Enterprise RAG Platform

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues to: **security@alakhdeepsingh.dev**

Include in your report:

- Description of the vulnerability and its impact
- Steps to reproduce or proof-of-concept
- Affected component (API, data store, CI pipeline)
- Suggested remediation if known

We acknowledge reports within **48 hours** and aim to provide a resolution timeline within **7 days**.

## Security Controls

### Dependency Management

- All Python dependencies are pinned to minimum safe versions in `apps/api/pyproject.toml`
- `ops/security/dependency_scan.py` runs on every CI push and pull request
- SBOM is maintained at `ops/security/sbom.txt` (SPDX 2.3 format)

### Container Security

- Container images are built from `python:3.12-slim` (minimal attack surface)
- No secrets are baked into images; environment variables are injected at runtime via Kubernetes secrets
- Images are scanned for CVEs before deployment to production

### API Security

- All endpoints validate input via Pydantic v2 schemas
- No authentication tokens, API keys, or PII are logged
- Rate limiting is enforced at the ingress layer in production

### Data Security

- Tenant data is isolated by `tenant_id` throughout the document service
- Data store files (`apps/api/data/`) are excluded from version control via `.gitignore`
- No real customer data is used in demos or tests

### Kubernetes Security

- Production pods run as non-root (`runAsNonRoot: true`)
- Resource limits are enforced to prevent DoS via resource exhaustion
- Network policies restrict inter-namespace communication

## Known Limitations (Demo Scope)

This project uses JSON-file-backed storage for portability. In a production deployment:

- Replace with a proper vector database (pgvector, Weaviate, Pinecone)
- Add mTLS between services
- Integrate with a secrets manager (Vault, AWS Secrets Manager)

## Security Changelog

| Date       | Change                                        |
| ---------- | --------------------------------------------- |
| 2025-06-01 | Initial security policy published             |
| 2025-06-01 | Dependency scan and SBOM added to CI pipeline |
