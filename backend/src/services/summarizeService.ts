import { generateSummary } from '../lib/groq';

export const summarizeService = {
  generateSummary: async (title: string, description: string = ''): Promise<string> => {
    try {
      const summary = await generateSummary(title, description);
      return summary;
    } catch (err) {
      console.error('[summarizeService.generateSummary] Error:', err);
      throw new Error('Failed to generate summary.');
    }
  },
};
