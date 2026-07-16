from prometheus_client import Counter, Histogram, Gauge, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST
from fastapi import Response
from typing import Dict
import time


class MonitoringService:
    def __init__(self):
        # Query metrics
        self.query_counter = Counter(
            'rag_queries_total',
            'Total number of RAG queries',
            ['tenant_id', 'status']
        )
        self.query_duration = Histogram(
            'rag_query_duration_seconds',
            'RAG query duration in seconds',
            ['tenant_id'],
            buckets=[0.1, 0.5, 1, 2, 5, 10]
        )
        
        # Document metrics
        self.document_counter = Counter(
            'rag_documents_total',
            'Total number of documents',
            ['tenant_id', 'status']
        )
        self.document_index_duration = Histogram(
            'rag_document_index_duration_seconds',
            'Document indexing duration',
            ['tenant_id']
        )
        
        # Vector search metrics
        self.vector_search_duration = Histogram(
            'rag_vector_search_duration_seconds',
            'Vector search duration',
            ['tenant_id']
        )
        self.vector_search_results = Gauge(
            'rag_vector_search_results_count',
            'Number of vector search results',
            ['tenant_id']
        )
        
        # LLM metrics
        self.llm_request_counter = Counter(
            'rag_llm_requests_total',
            'Total LLM requests',
            ['tenant_id', 'model']
        )
        self.llm_token_usage = Counter(
            'rag_llm_tokens_total',
            'Total LLM tokens used',
            ['tenant_id', 'type']  # type: input, output
        )
        self.llm_request_duration = Histogram(
            'rag_llm_request_duration_seconds',
            'LLM request duration',
            ['tenant_id', 'model']
        )
        
        # System metrics
        self.active_connections = Gauge(
            'rag_active_connections',
            'Number of active connections'
        )
        self.cache_hit_rate = Gauge(
            'rag_cache_hit_rate',
            'Cache hit rate',
            ['cache_type']
        )
    
    def record_query(self, tenant_id: str, status: str, duration: float):
        """Record a query"""
        self.query_counter.labels(tenant_id=tenant_id, status=status).inc()
        self.query_duration.labels(tenant_id=tenant_id).observe(duration)
    
    def record_document_index(self, tenant_id: str, status: str, duration: float):
        """Record document indexing"""
        self.document_counter.labels(tenant_id=tenant_id, status=status).inc()
        self.document_index_duration.labels(tenant_id=tenant_id).observe(duration)
    
    def record_vector_search(self, tenant_id: str, duration: float, result_count: int):
        """Record vector search"""
        self.vector_search_duration.labels(tenant_id=tenant_id).observe(duration)
        self.vector_search_results.labels(tenant_id=tenant_id).set(result_count)
    
    def record_llm_request(
        self,
        tenant_id: str,
        model: str,
        duration: float,
        input_tokens: int,
        output_tokens: int
    ):
        """Record LLM request"""
        self.llm_request_counter.labels(tenant_id=tenant_id, model=model).inc()
        self.llm_token_usage.labels(tenant_id=tenant_id, type='input').inc(input_tokens)
        self.llm_token_usage.labels(tenant_id=tenant_id, type='output').inc(output_tokens)
        self.llm_request_duration.labels(tenant_id=tenant_id, model=model).observe(duration)
    
    def update_active_connections(self, count: int):
        """Update active connections count"""
        self.active_connections.set(count)
    
    def update_cache_hit_rate(self, cache_type: str, rate: float):
        """Update cache hit rate"""
        self.cache_hit_rate.labels(cache_type=cache_type).set(rate)
    
    def get_metrics(self) -> Response:
        """Get Prometheus metrics"""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )


# Singleton instance
monitoring_service = MonitoringService()


def track_query(tenant_id: str):
    """Decorator to track query metrics"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = "error"
                raise e
            finally:
                duration = time.time() - start_time
                monitoring_service.record_query(tenant_id, status, duration)
        return wrapper
    return decorator
