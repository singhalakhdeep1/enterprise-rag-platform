import { DashboardCard } from "../components/dashboard-card";
import { SearchPlayground } from "../components/search-playground";

const ingestionSteps = [
    "Upload PDFs, DOCX, policies, and support docs into tenant-scoped workspaces.",
    "Parse and chunk documents before async indexing into pgvector and BM25 catalogs.",
    "Track ingestion latency, OCR fallback rates, and document freshness in one control plane.",
];

const searchCapabilities = [
    "Hybrid retrieval with reranking and citation-ready answer composition.",
    "Search analytics for top intents, zero-result queries, and groundedness trends.",
    "Guardrails for prompt regression, PII checks, and tenant-safe retrieval boundaries.",
];

export default function HomePage() {
    return (
        <main className="page">
            <section className="hero">
                <span className="eyebrow">Enterprise RAG MVP</span>
                <h1 className="headline">Knowledge retrieval built for real company data.</h1>
                <p className="subhead">
                    This starter focuses on the first production slice: document ingestion, tenant-aware
                    semantic search, and the platform surfaces needed for observability, evaluation, and
                    future answer generation.
                </p>
            </section>

            <section className="grid" aria-label="platform overview">
                <DashboardCard title="Ingestion pipeline" subtitle="Source readiness">
                    <p className="metric">3 stages</p>
                    <ul className="list">
                        {ingestionSteps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ul>
                </DashboardCard>

                <DashboardCard title="Search and retrieval" subtitle="Query plane">
                    <p className="metric">Hybrid</p>
                    <ul className="list">
                        {searchCapabilities.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </DashboardCard>

                <DashboardCard title="Next implementation slice" subtitle="Roadmap">
                    <p className="metric">Persistent demo core</p>
                    <ul className="list">
                        <li>Persistent document catalog, chunk store, analytics snapshot, and evaluation records.</li>
                        <li>Grounded answer endpoint with citation surfaces for later LLM integration.</li>
                        <li>Frontend control plane for ingestion, retrieval, answer generation, and QA metrics.</li>
                    </ul>
                </DashboardCard>
            </section>

            <SearchPlayground />
        </main>
    );
}