// ChromaDB client for enterprise-rag-platform

import { ChromaClient } from 'chromadb';

class ChromaDBService {
  private client: ChromaClient;

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000',
    });
  }

  async createCollection(name: string) {
    try {
      await this.client.createCollection({ name });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addDocuments(collectionName: string, documents: string[], metadatas: any[], ids: string[]) {
    try {
      const collection = await this.client.getCollection({ name: collectionName });
      await collection.add({
        documents,
        metadatas,
        ids,
      });
      return { success: true, count: documents.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async query(collectionName: string, queryTexts: string[], nResults: number = 10) {
    try {
      const collection = await this.client.getCollection({ name: collectionName });
      const response = await collection.query({
        queryTexts,
        nResults,
      });
      return { success: true, results: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteDocument(collectionName: string, id: string) {
    try {
      const collection = await this.client.getCollection({ name: collectionName });
      await collection.delete({ ids: [id] });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCollection(collectionName: string) {
    try {
      const collection = await this.client.getCollection({ name: collectionName });
      const count = await collection.count();
      return { success: true, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteCollection(collectionName: string) {
    try {
      await this.client.deleteCollection({ name: collectionName });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      const collections = await this.client.listCollections();
      return { success: true, collections };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const chromaDBService = new ChromaDBService();
