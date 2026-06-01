"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

type DocumentRecord = {
    id: string;
    title: string;
    tenant_id: string;
    source_type: string;
    content_preview: string;
    chunk_count: number;
    created_at: string;
};

type SearchResult = {
    document_id: string;
    chunk_id: string;
    title: string;
    excerpt: string;
    citation: string;
    score: number;
    matched_terms: string[];
};

type AnswerCitation = {
    document_id: string;
    chunk_id: string;
    title: string;
    quote: string;
    citation: string;
};

type AnswerResponse = {
    question: string;
    answer: string;
    confidence: number;
    citations: AnswerCitation[];
    retrieved_chunks: number;
};

type EvaluationMetric = {
    name: string;
    score: number;
    passed: boolean;
    details: string;
};

type EvaluationRecord = {
    id: string;
    tenant_id: string;
    question: string;
    created_at: string;
    answer_confidence: number;
    metrics: EvaluationMetric[];
};

type AnalyticsSnapshot = {
    tenant_id: string;
    total_documents: number;
    total_chunks: number;
    queries_run: number;
    evaluations_run: number;
    last_ingested_at: string | null;
    top_terms: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function SearchPlayground() {
    const [tenantId, setTenantId] = useState("demo-team");
    const [query, setQuery] = useState("security policy");
    const [question, setQuestion] = useState("What does the security policy require for admin access?");
    const [uploadTitle, setUploadTitle] = useState("Incident Response Playbook");
    const [uploadContent, setUploadContent] = useState(
        "Priority 1 incidents require immediate triage, stakeholder notification, and written updates every 30 minutes until containment is complete.",
    );
    const [results, setResults] = useState<SearchResult[]>([]);
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [answer, setAnswer] = useState<AnswerResponse | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationRecord | null>(null);
    const [message, setMessage] = useState("Demo tenant documents are pre-seeded. Upload more content or search immediately.");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        void refreshWorkspace("demo-team");
    }, []);

    const refreshWorkspace = async (tenant: string) => {
        try {
            const [documentsResponse, analyticsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/documents?tenant_id=${encodeURIComponent(tenant)}`),
                fetch(`${API_BASE_URL}/api/v1/documents/analytics/${encodeURIComponent(tenant)}`),
            ]);

            if (documentsResponse.ok) {
                const documentsPayload = (await documentsResponse.json()) as { documents: DocumentRecord[] };
                setDocuments(documentsPayload.documents);
            }

            if (analyticsResponse.ok) {
                const analyticsPayload = (await analyticsResponse.json()) as AnalyticsSnapshot;
                setAnalytics(analyticsPayload);
            }
        } catch {
            setAnalytics(null);
        }
    };

    const handleUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: uploadTitle,
                        tenant_id: tenantId,
                        source_type: "manual",
                        content: uploadContent,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`);
                }

                setMessage("Document ingested and chunked successfully.");
                await refreshWorkspace(tenantId);
            } catch (error) {
                const details = error instanceof Error ? error.message : "Unknown error";
                setMessage(`Upload failed: ${details}`);
            }
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/documents/search`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ tenant_id: tenantId, query, top_k: 5 }),
                });

                if (!response.ok) {
                    throw new Error(`Search failed with status ${response.status}`);
                }

                const payload = (await response.json()) as { results: SearchResult[] };
                setResults(payload.results);
                setMessage(
                    payload.results.length
                        ? `Found ${payload.results.length} relevant document matches.`
                        : "No matches yet. Upload sample content that contains your query terms.",
                );
                await refreshWorkspace(tenantId);
            } catch (error) {
                const details = error instanceof Error ? error.message : "Unknown error";
                setResults([]);
                setMessage(`API unavailable: ${details}`);
            }
        });
    };

    const handleAnswer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/documents/answer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ tenant_id: tenantId, question, top_k: 4 }),
                });

                if (!response.ok) {
                    throw new Error(`Answer request failed with status ${response.status}`);
                }

                const payload = (await response.json()) as AnswerResponse;
                setAnswer(payload);
                setMessage(`Generated grounded answer with ${payload.citations.length} citations.`);
                await refreshWorkspace(tenantId);
            } catch (error) {
                const details = error instanceof Error ? error.message : "Unknown error";
                setAnswer(null);
                setMessage(`Answer generation failed: ${details}`);
            }
        });
    };

    const handleEvaluate = async () => {
        startTransition(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/documents/evaluate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tenant_id: tenantId,
                        question,
                        expected_keywords: ["admin", "MFA", "security"],
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Evaluation failed with status ${response.status}`);
                }

                const payload = (await response.json()) as EvaluationRecord;
                setEvaluation(payload);
                setMessage("Evaluation completed with groundedness and keyword coverage metrics.");
                await refreshWorkspace(tenantId);
            } catch (error) {
                const details = error instanceof Error ? error.message : "Unknown error";
                setEvaluation(null);
                setMessage(`Evaluation failed: ${details}`);
            }
        });
    };

    return (
        <section className="console-grid">
            <section className="card console-card console-card-wide">
                <p className="label">Workspace controls</p>
                <h2>Tenant-aware ingestion and retrieval</h2>
                <form className="playground-form" onSubmit={handleUpload}>
                    <label>
                        Tenant ID
                        <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
                    </label>
                    <label>
                        Document title
                        <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} />
                    </label>
                    <label>
                        Document content
                        <textarea value={uploadContent} onChange={(event) => setUploadContent(event.target.value)} rows={5} />
                    </label>
                    <div className="button-row">
                        <button type="submit" disabled={isPending}>
                            {isPending ? "Working..." : "Upload document"}
                        </button>
                        <button type="button" className="secondary" onClick={() => void refreshWorkspace(tenantId)}>
                            Refresh analytics
                        </button>
                    </div>
                </form>
                <p className="status">{message}</p>
            </section>

            <section className="card console-card">
                <p className="label">Semantic search</p>
                <h2>Retrieve relevant chunks</h2>
                <form className="playground-form" onSubmit={handleSubmit}>
                    <label>
                        Query
                        <input value={query} onChange={(event) => setQuery(event.target.value)} />
                    </label>
                    <button type="submit" disabled={isPending}>
                        {isPending ? "Searching..." : "Run semantic search"}
                    </button>
                </form>
                <div className="result-list">
                    {results.map((result) => (
                        <article className="result-item" key={result.chunk_id}>
                            <div className="result-headline">
                                <strong>{result.title}</strong>
                                <span>{result.score.toFixed(2)}</span>
                            </div>
                            <p>{result.excerpt}</p>
                            <p className="result-meta">{result.citation}</p>
                            <p className="result-meta">Matched: {result.matched_terms.join(", ")}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="card console-card">
                <p className="label">Grounded answer synthesis</p>
                <h2>Generate answer with citations</h2>
                <form className="playground-form" onSubmit={handleAnswer}>
                    <label>
                        Question
                        <input value={question} onChange={(event) => setQuestion(event.target.value)} />
                    </label>
                    <div className="button-row">
                        <button type="submit" disabled={isPending}>
                            {isPending ? "Generating..." : "Generate answer"}
                        </button>
                        <button type="button" className="secondary" disabled={isPending} onClick={() => void handleEvaluate()}>
                            Run evaluation
                        </button>
                    </div>
                </form>
                {answer ? (
                    <div className="answer-box">
                        <p className="result-meta">Confidence {answer.confidence.toFixed(2)}</p>
                        <p>{answer.answer}</p>
                        <div className="result-list">
                            {answer.citations.map((citation) => (
                                <article className="result-item" key={citation.chunk_id}>
                                    <strong>{citation.title}</strong>
                                    <p>{citation.quote}</p>
                                    <p className="result-meta">{citation.citation}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>

            <section className="card console-card">
                <p className="label">Project analytics</p>
                <h2>Operational snapshot</h2>
                {analytics ? (
                    <div className="analytics-grid">
                        <div>
                            <span className="stat-label">Documents</span>
                            <strong>{analytics.total_documents}</strong>
                        </div>
                        <div>
                            <span className="stat-label">Chunks</span>
                            <strong>{analytics.total_chunks}</strong>
                        </div>
                        <div>
                            <span className="stat-label">Queries</span>
                            <strong>{analytics.queries_run}</strong>
                        </div>
                        <div>
                            <span className="stat-label">Evaluations</span>
                            <strong>{analytics.evaluations_run}</strong>
                        </div>
                        <div className="stat-wide">
                            <span className="stat-label">Top search terms</span>
                            <strong>{analytics.top_terms.length ? analytics.top_terms.join(", ") : "None yet"}</strong>
                        </div>
                    </div>
                ) : (
                    <p className="status">Analytics will appear once the API is available.</p>
                )}
            </section>

            <section className="card console-card console-card-wide">
                <p className="label">Indexed documents</p>
                <h2>Tenant document catalog</h2>
                <div className="result-list">
                    {documents.map((document) => (
                        <article className="result-item" key={document.id}>
                            <div className="result-headline">
                                <strong>{document.title}</strong>
                                <span>{document.chunk_count} chunks</span>
                            </div>
                            <p>{document.content_preview}</p>
                            <p className="result-meta">
                                {document.source_type} · {new Date(document.created_at).toLocaleString()}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="card console-card">
                <p className="label">Evaluation harness</p>
                <h2>Quality checks</h2>
                {evaluation ? (
                    <div className="result-list">
                        {evaluation.metrics.map((metric) => (
                            <article className="result-item" key={metric.name}>
                                <div className="result-headline">
                                    <strong>{metric.name}</strong>
                                    <span>{metric.score.toFixed(2)}</span>
                                </div>
                                <p>{metric.details}</p>
                                <p className="result-meta">{metric.passed ? "Passed" : "Needs work"}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="status">Run an evaluation after answer generation to inspect groundedness metrics.</p>
                )}
            </section>
        </section>
    );
}
