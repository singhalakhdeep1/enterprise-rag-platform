// LlamaIndex RAG service for enterprise-rag-platform

import { VectorStoreIndex, Document, Settings } from 'llamaindex';
import { PineconeVectorStore } from 'llamaindex/vectorstore/PineconeVectorStore';
import { OpenAIEmbedding } from 'llamaindex/embedding/OpenAIEmbedding';
import { OpenAI } from 'llamaindex/llm/OpenAI';

class LlamaIndexRAGService {
  private index: VectorStoreIndex;

  constructor() {
    const vectorStore = new PineconeVectorStore({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      indexName: process.env.PINECONE_INDEX || 'rag-index',
    });

    Settings.llm = new OpenAI({
      model: 'gpt-4',
      temperature: 0.7,
    });

    Settings.embedModel = new OpenAIEmbedding();
  }

  async query(question: string) {
    const queryEngine = this.index.asQueryEngine({
      retrieverMode: 'hybrid',
      responseMode: 'tree_summarize',
    });

    const response = await queryEngine.query(question);
    return response.toString();
  }

  async addDocuments(documents: Document[]) {
    await VectorStoreIndex.fromDocuments(documents);
    return { success: true, count: documents.length };
  }

  async deleteDocument(documentId: string) {
    await this.index.delete(documentId);
    return { success: true };
  }

  async similaritySearch(query: string, topK: number = 4) {
    const retriever = this.index.asRetriever({ topK });
    const nodes = await retriever.retrieve(query);
    return nodes.map((node) => ({ node, score: node.score || 0 }));
  }
}

export const llamaIndexRAGService = new LlamaIndexRAGService();
