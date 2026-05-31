import { analyzeContent } from '../lib/groq';

export interface AnalyzeResult {
  toxic: boolean;
  ragebait: boolean;
  clickbait: boolean;
  reason: string;
}

/**
 * Service layer for content analysis.
 * Handles business logic for analyzing tweets/posts using the Groq LLM.
 */
export const analyzeService = {
  /**
   * Analyzes tweet/post text for toxicity, rage-bait, and clickbait.
   * @param text - The tweet/post content
   * @returns Analysis result with flags and reason
   */
  analyzeTweet: async (text: string): Promise<AnalyzeResult> => {
    try {
      const result = await analyzeContent(text);
      return result;
    } catch (err) {
      console.error('[analyzeService.analyzeTweet] Error:', err);
      throw new Error('Failed to analyze content.');
    }
  },
};
