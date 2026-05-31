import { analyzeContent } from '../lib/groq';

export interface AnalyzeResult {
  toxic: boolean;
  ragebait: boolean;
  clickbait: boolean;
  reason: string;
}

export const analyzeTweet= async (text: string): Promise<AnalyzeResult> => {
    try {
      const result = await analyzeContent(text);
      return result;
    } catch (err) {
      console.error(`[analyzeService.analyzeTweet] Error:`, err);
      throw new Error('Failed to analyze content.');
    }
  };