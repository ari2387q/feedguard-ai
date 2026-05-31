import { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController';

const router = Router();

/**
 * POST /api/analyze
 * Accepts tweet/post text and returns an AI-powered analysis
 * classifying it for toxicity, rage-bait, and clickbait.
 */
router.post('/', analyzeController.analyze);

export default router;
