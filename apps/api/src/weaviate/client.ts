// Weaviate client for enterprise-rag-platform

import weaviate from 'weaviate-ts-client';

class WeaviateService {
  private client: weaviate.WeaviateClient;

  constructor() {
    this.client = weaviate.client({
      scheme: process.env.WEAVIATE_SCHEME || 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY
        ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
        : undefined,
    });
  }

  async createClass(className: string, vectorizer: string = 'text2vec-openai') {
    try {
      await this.client.schema.classCreator().withClass({
        class: className,
        vectorizer,
        properties: [
          {
            name: 'content',
            dataType: ['text'],
          },
          {
            name: 'metadata',
            dataType: ['object'],
          },
        ],
      }).do();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addDataObject(className: string, data: any) {
    try {
      await this.client.data.creator().withClassName(className).withProperties(data).do();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async search(className: string, query: string, limit: number = 10) {
    try {
      const response = await this.client.graphql
        .get()
        .withClassName(className)
        .withNearText({
          concepts: [query],
          certainty: 0.7,
        })
        .withLimit(limit)
        .do();
      return { success: true, results: response.data.Get[className] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteDataObject(className: string, id: string) {
    try {
      await this.client.data.deleter().withClassName(className).withId(id).do();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getClass(className: string) {
    try {
      const response = await this.client.schema.classGetter().withClassName(className).do();
      return { success: true, class: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteClass(className: string) {
    try {
      await this.client.schema.classDeleter().withClassName(className).do();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      const response = await this.client.schema.getter().do();
      return { success: true, classes: response.classes };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const weaviateService = new WeaviateService();
