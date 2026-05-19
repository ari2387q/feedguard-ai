import { Router, Request, Response } from 'express';
import { analyzeContent } from '../lib/groq';

const router = Router();

/** Request body shape for the /api/analyze POST endpoint */
interface AnalyzeRequestBody {
  text: string;
}

/** Response shape for /api/analyze — returned as strict JSON from Groq */
interface AnalyzeResponse {
  toxic: boolean;
  ragebait: boolean;
  clickbait: boolean;
  reason: string;
}

/**
 * POST /api/analyze
 * Accepts tweet/post text and returns an AI-powered analysis
 * classifying it for toxicity, rage-bait, and clickbait.
 */
router.post('/', async (req: Request<unknown, unknown, AnalyzeRequestBody>, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "text" field.' });
      return;
    }

    if (text.length > 5000) {
      res.status(400).json({ error: 'Text exceeds maximum length of 5000 characters.' });
      return;
    }

    const result: AnalyzeResponse = await analyzeContent(text);
    res.json(result);
  } catch (err) {
    console.error('[/api/analyze] Error:', err);
    res.status(500).json({ error: 'Failed to analyze content.' });
  }
});

export default router;
