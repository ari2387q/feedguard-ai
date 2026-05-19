import { Router, Request, Response } from 'express';
import { generateSummary } from '../lib/groq';

const router = Router();

/** Request body shape for the /api/summarize POST endpoint */
interface SummarizeRequestBody {
  title: string;
  description?: string;
}

/** Response shape for /api/summarize */
interface SummarizeResponse {
  summary: string;
}

/**
 * POST /api/summarize
 * Accepts a video title (and optional description), calls the Groq LLM,
 * and returns a concise 2-sentence summary of what the video is likely about.
 */
router.post('/', async (req: Request<unknown, unknown, SummarizeRequestBody>, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "title" field.' });
      return;
    }

    const summary = await generateSummary(title, description || '');

    const response: SummarizeResponse = { summary };
    res.json(response);
  } catch (err) {
    console.error('[/api/summarize] Error:', err);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

export default router;
