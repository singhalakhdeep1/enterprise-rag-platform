# Enterprise RAG Platform - Implementation

## Overview
This document describes the RAG, ML, infrastructure, and monitoring integrations added to the Enterprise RAG Platform.

## Technologies Added

### 1. LangChain
- RAG pipeline with vector store
- Document indexing
- Query with context retrieval
- Similarity search

### 2. LlamaIndex
- Vector store integration
- Hybrid retrieval
- Tree summarization
- Document management

### 3. Qdrant
- Collection management
- Vector upsert
- Similarity search
- Point operations

### 4. Weaviate
- Schema management
- Data object operations
- Near-text search
- Class management

### 5. ChromaDB
- Collection operations
- Document addition
- Query with embeddings
- Document deletion

### 6. Promptfoo
- Prompt evaluation
- RAG evaluation
- Model comparison
- Report generation

### 7. Hugging Face
- Text generation
- Text embeddings
- Question answering
- Summarization
- Text/image classification

### 8. MLflow
- Experiment tracking
- Run logging
- Model registry
- Model loading

### 9. Kubernetes
- API deployment
- Service configuration
- Resource management

### 10. Terraform
- AWS VPC and subnets
- EKS cluster
- ElastiCache Redis
- OpenSearch/Elasticsearch

### 11. Istio (Service Mesh)
- Gateway configuration
- VirtualService routing
- Circuit breaking
- Load balancing

### 12. Grafana/Prometheus
- Prometheus monitoring
- Grafana visualization
- Kubernetes service discovery

### 13. GraphQL
- Document schema
- Query and mutation resolvers
- RAG query integration

## Files Created

### RAG Services
- `apps/api/src/langchain/rag.ts` - LangChain RAG service
- `apps/api/src/llamaindex/rag.ts` - LlamaIndex RAG service
- `apps/api/src/qdrant/client.ts` - Qdrant client
- `apps/api/src/weaviate/client.ts` - Weaviate client
- `apps/api/src/chromadb/client.ts` - ChromaDB client

### ML & Evaluation
- `apps/api/src/promptfoo/evaluator.ts` - Promptfoo evaluator
- `apps/api/src/huggingface/client.ts` - Hugging Face client
- `apps/api/src/mlflow/client.ts` - MLflow client

### Kubernetes
- `kubernetes/deployment.yaml` - API deployment
- `kubernetes/istio-gateway.yaml` - Istio gateway
- `kubernetes/grafana.yaml` - Grafana deployment
- `kubernetes/prometheus.yaml` - Prometheus deployment

### Terraform
- `terraform/main.tf` - AWS infrastructure

### GraphQL
- `apps/api/src/graphql/schema.graphql` - GraphQL schema
- `apps/api/src/graphql/resolvers.ts` - GraphQL resolvers

## Features

### LangChain RAG Service
- Vector store integration with Pinecone
- Query with context retrieval
- Document addition and deletion
- Similarity search with scores

### LlamaIndex RAG Service
- Hybrid retrieval mode
- Tree summarization response
- Document management
- Similarity search

### Qdrant Service
- Collection creation with vector size
- Point upsert operations
- Vector similarity search
- Collection management

### Weaviate Service
- Class creation with vectorizer
- Data object operations
- Near-text search
- Schema management

### ChromaDB Service
- Collection operations
- Document addition with metadata
- Query with embeddings
- Document deletion

### Promptfoo Evaluator
- Prompt evaluation with test cases
- RAG-specific evaluation
- Model comparison
- Report generation

### Hugging Face Service
- Text generation with parameters
- Text embeddings
- Question answering with context
- Summarization
- Text and image classification

### MLflow Service
- Experiment creation
- Run logging with params/metrics
- Run retrieval and search
- Model registration and loading

### Kubernetes
- 3-replica deployment
- LoadBalancer service
- Resource requests/limits
- Environment variables

### Terraform
- VPC with public subnets
- EKS cluster with node group
- ElastiCache Redis
- OpenSearch/Elasticsearch domain

### Istio
- Gateway for external access
- VirtualService for routing
- Circuit breaking configuration
- Round-robin load balancing

### Grafana/Prometheus
- Prometheus with Kubernetes discovery
- Grafana with Prometheus datasource
- Service exposure

### GraphQL
- Document CRUD operations
- Search with query
- RAG query integration
- Bulk document operations

## Installation Required

Add to `apps/api/package.json`:
```json
{
  "dependencies": {
    "@langchain/openai": "^0.0.20",
    "@langchain/pinecone": "^0.0.5",
    "@langchain/core": "^0.1.0",
    "@pinecone-database/pinecone": "^2.0.0",
    "llamaindex": "^0.1.0",
    "@qdrant/js-client-rest": "^1.9.0",
    "weaviate-ts-client": "^1.4.0",
    "chromadb": "^1.7.0",
    "promptfoo": "^0.60.0",
    "@huggingface/inference": "^2.6.0",
    "mlflow": "^2.9.0"
  }
}
```

Run:
```bash
cd apps/api && npm install
```

## Environment Variables

```env
# Pinecone
PINECONE_API_KEY=your-api-key
PINECONE_INDEX=rag-index

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key

# Weaviate
WEAVIATE_SCHEME=http
WEAVIATE_HOST=localhost:8080
WEAVIATE_API_KEY=your-api-key

# ChromaDB
CHROMADB_URL=http://localhost:8000

# Hugging Face
HUGGINGFACE_API_KEY=your-api-key

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# Redis
REDIS_URL=redis://localhost:6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
```

## Notes
- All code is written but packages are not installed (per user request)
- Requires running instances of Pinecone, Qdrant, Weaviate, ChromaDB, Redis, Elasticsearch
- Istio requires Istio installation in Kubernetes cluster
- Terraform requires AWS credentials and Terraform CLI
- MLflow requires MLflow server for tracking
