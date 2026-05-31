import { Request, Response } from 'express';
import { analyzeService } from '../services/analyzeService';

export interface AnalyzeRequestBody {
  text: string;
}

/**
 * POST /api/analyze
 * Controller that handles the analyze endpoint.
 * Validates input and delegates to service layer.
 */
export const analyzeController = {
  analyze: async (
    req: Request<unknown, unknown, AnalyzeRequestBody>,
    res: Response
  ): Promise<void> => {
    try {
      const { text } = req.body;

      // Validation
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "text" field.' });
        return;
      }

      if (text.length > 5000) {
        res
          .status(400)
          .json({ error: 'Text exceeds maximum length of 5000 characters.' });
        return;
      }

      // Delegate to service
      const result = await analyzeService.analyzeTweet(text);
      res.json(result);
    } catch (err) {
      console.error('[analyzeController] Error:', err);
      res.status(500).json({ error: 'Failed to analyze content.' });
    }
  },
};
