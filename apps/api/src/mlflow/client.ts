// MLflow client for enterprise-rag-platform

import { MlflowClient } from 'mlflow';

class MLflowService {
  private client: MlflowClient;

  constructor() {
    this.client = new MlflowClient({
      trackingUri: process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000',
    });
  }

  async createExperiment(name: string) {
    try {
      const experiment = await this.client.createExperiment({ name });
      return { success: true, experimentId: experiment.experiment_id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logRun(experimentId: string, runName: string, params: any, metrics: any) {
    try {
      const run = await this.client.createRun(experimentId, runName);
      await this.client.logParams(run.info.run_id, params);
      await this.client.logMetrics(run.info.run_id, metrics);
      await this.client.setTerminated(run.info.run_id);
      return { success: true, runId: run.info.run_id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getRun(runId: string) {
    try {
      const run = await this.client.getRun(runId);
      return { success: true, run };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchRuns(experimentIds: string[], filter: string = '') {
    try {
      const runs = await this.client.searchRuns({ experimentIds, filter });
      return { success: true, runs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logModel(runId: string, modelPath: string, model: any) {
    try {
      await this.client.logModel(runId, modelPath, model);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async loadModel(modelUri: string) {
    try {
      const model = await this.client.loadModel(modelUri);
      return { success: true, model };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async registerModel(modelName: string, modelUri: string) {
    try {
      const modelVersion = await this.client.registerModel(modelName, modelUri);
      return { success: true, version: modelVersion.version };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getModelVersion(modelName: string, version: string) {
    try {
      const modelVersion = await this.client.getModelVersion(modelName, version);
      return { success: true, modelVersion };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const mlflowService = new MLflowService();
