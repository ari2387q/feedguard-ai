import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

/**
 * POST /api/user
 * Upserts user stats — creates a new document if userId doesn't exist,
 * otherwise increments the existing counters.
 */
router.post('/', userController.upsertStats);

/**
 * GET /api/user?userId=<id>
 * Retrieves the full user document including daily stats.
 */
router.get('/', userController.getStats);

export default router;
