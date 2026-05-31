import { Router } from 'express';
import { summarizeController } from '../controllers/summarizeController';

const router = Router();

/**
 * POST /api/summarize
 * Accepts a video title (and optional description), calls the Groq LLM,
 * and returns a concise 2-sentence summary of what the video is likely about.
 */
router.post('/', summarizeController.summarize);

export default router;
