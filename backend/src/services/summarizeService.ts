import { generateSummary } from '../lib/groq';

/**
 * Service layer for content summarization.
 * Handles business logic for generating summaries using the Groq LLM.
 */
export const summarizeService = {
  /**
   * Generates a concise summary of a video based on title and description.
   * @param title - The video title
   * @param description - Optional video description
   * @returns A 2-sentence summary
   */
  generateSummary: async (
    title: string,
    description: string = ''
  ): Promise<string> => {
    try {
      const summary = await generateSummary(title, description);
      return summary;
    } catch (err) {
      console.error('[summarizeService.generateSummary] Error:', err);
      throw new Error('Failed to generate summary.');
    }
  },
};
