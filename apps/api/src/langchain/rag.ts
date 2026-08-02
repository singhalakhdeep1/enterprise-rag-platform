// LangChain RAG service for enterprise-rag-platform

import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { VectorStore } from '@langchain/core/vectorstores';
import { Document } from '@langchain/core/documents';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

class LangChainRAGService {
  private llm: ChatOpenAI;
  private vectorStore: VectorStore;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
    });

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });

    this.vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX || 'rag-index') }
    );
  }

  async query(question: string, k: number = 4) {
    const retriever = this.vectorStore.asRetriever({ k });

    const prompt = PromptTemplate.fromTemplate(
      `Answer the question based on the following context:
      
      Context: {context}
      
      Question: {question}
      
      Answer:`
    );

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe((docs) => docs.map((d) => d.pageContent).join('\n\n')),
        question: (input: { question: string }) => input.question,
      },
      prompt,
      this.llm,
    ]);

    const response = await chain.invoke({ question });
    return response;
  }

  async addDocuments(documents: Document[]) {
    await this.vectorStore.addDocuments(documents);
    return { success: true, count: documents.length };
  }

  async deleteDocument(documentId: string) {
    await this.vectorStore.delete({ ids: [documentId] });
    return { success: true };
  }

  async similaritySearch(query: string, k: number = 4) {
    const results = await this.vectorStore.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({ document: doc, score }));
  }
}

export const langChainRAGService = new LangChainRAGService();
