import { Request, Response } from 'express';
import { summarizeService } from '../services/summarizeService';

export interface SummarizeRequestBody {
  title: string;
  description?: string;
}

export interface SummarizeResponse {
  summary: string;
}

/**
 * POST /api/summarize
 * Controller that handles the summarize endpoint.
 * Validates input and delegates to service layer.
 */
export const summarizeController = {
  summarize: async (
    req: Request<unknown, unknown, SummarizeRequestBody>,
    res: Response
  ): Promise<void> => {
    try {
      const { title, description } = req.body;

      // Validation
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "title" field.' });
        return;
      }

      // Delegate to service
      const summary = await summarizeService.generateSummary(
        title,
        description || ''
      );

      const response: SummarizeResponse = { summary };
      res.json(response);
    } catch (err) {
      console.error('[summarizeController] Error:', err);
      res.status(500).json({ error: 'Failed to generate summary.' });
    }
  },
};
