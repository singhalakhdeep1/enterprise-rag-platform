// Hugging Face client for enterprise-rag-platform

import { HfInference } from '@huggingface/inference';

class HuggingFaceService {
  private client: HfInference;

  constructor() {
    this.client = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  async textGeneration(model: string, inputs: string, parameters: any = {}) {
    try {
      const response = await this.client.textGeneration({
        model,
        inputs,
        parameters,
      });
      return { success: true, output: response.generated_text };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async textEmbeddings(model: string, inputs: string[]) {
    try {
      const response = await this.client.embeddings({
        model,
        inputs,
      });
      return { success: true, embeddings: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async questionAnswering(model: string, question: string, context: string) {
    try {
      const response = await this.client.questionAnswer({
        model,
        inputs: {
          question,
          context,
        },
      });
      return { success: true, answer: response.answer, score: response.score };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async summarization(model: string, inputs: string) {
    try {
      const response = await this.client.summarization({
        model,
        inputs,
      });
      return { success: true, summary: response.summary_text };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async textClassification(model: string, inputs: string) {
    try {
      const response = await this.client.textClassification({
        model,
        inputs,
      });
      return { success: true, classifications: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async imageClassification(model: string, image: Blob) {
    try {
      const response = await this.client.imageClassification({
        model,
        data: image,
      });
      return { success: true, classifications: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const huggingFaceService = new HuggingFaceService();
