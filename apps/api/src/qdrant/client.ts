// Qdrant client for enterprise-rag-platform

import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async createCollection(collectionName: string, vectorSize: number = 1536) {
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async upsertPoints(collectionName: string, points: any[]) {
    try {
      await this.client.upsert(collectionName, {
        points,
      });
      return { success: true, count: points.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async search(collectionName: string, queryVector: number[], limit: number = 10) {
    try {
      const response = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
      });
      return { success: true, results: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deletePoint(collectionName: string, pointId: string) {
    try {
      await this.client.delete(collectionName, {
        points: [pointId],
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCollection(collectionName: string) {
    try {
      const response = await this.client.getCollection(collectionName);
      return { success: true, collection: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteCollection(collectionName: string) {
    try {
      await this.client.deleteCollection(collectionName);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      const collections = await this.client.getCollections();
      return { success: true, collections: collections.collections };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const qdrantService = new QdrantService();
