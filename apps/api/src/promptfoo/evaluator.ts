// Promptfoo evaluator for enterprise-rag-platform

import { evaluate } from 'promptfoo';

class PromptfooEvaluator {
  async evaluate(prompts: string[], testCases: any[], config: any = {}) {
    try {
      const results = await evaluate({
        prompts,
        tests: testCases,
        ...config,
      });
      return { success: true, results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async evaluateRAG(
    prompts: string[],
    documents: string[],
    questions: string[],
    expectedAnswers: string[]
  ) {
    const testCases = questions.map((question, i) => ({
      query: question,
      expected: expectedAnswers[i],
      context: documents,
    }));

    return await this.evaluate(prompts, testCases, {
      providers: ['openai:gpt-4'],
      outputPath: './promptfoo-results.json',
    });
  }

  async compareModels(
    prompt: string,
    testCases: any[],
    models: string[] = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus']
  ) {
    const prompts = models.map((model) => ({
      prompt,
      model,
    }));

    return await this.evaluate(prompts, testCases);
  }

  async generateReport(results: any) {
    const report = {
      summary: {
        totalTests: results.results.length,
        passed: results.results.filter((r: any) => r.pass).length,
        failed: results.results.filter((r: any) => !r.pass).length,
      },
      details: results.results,
    };
    return report;
  }
}

export const promptfooEvaluator = new PromptfooEvaluator();
