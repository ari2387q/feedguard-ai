import { Request, Response } from 'express';
import { userService } from '../services/userService';

export interface UserStatsBody {
  userId: string;
  videosFiltered?: number;
  toxicBlocked?: number;
  timeSpent?: number;
}

/**
 * POST /api/user
 * Controller that handles user stats upsert.
 * Validates input and delegates to service layer.
 */
export const userController = {
  upsertStats: async (
    req: Request<unknown, unknown, UserStatsBody>,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, videosFiltered = 0, toxicBlocked = 0, timeSpent = 0 } =req.body;

      // Validation
      if (!userId || typeof userId !== 'string') {
        res
          .status(400)
          .json({ error: 'Missing or invalid "userId" field.' });
        return;
      }

      // Delegate to service
      const user = await userService.upsertUserStats({
        userId,
        videosFiltered,
        toxicBlocked,
        timeSpent,
      });

      res.json({ success: true, user });
    } catch (err) {
      console.error('[userController.upsertStats] Error:', err);
      res.status(500).json({ error: 'Failed to save user stats.' });
    }
  },

  /**
   * GET /api/user?userId=<id>
   * Controller that retrieves user stats by userId.
   */
  getStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.query.userId as string | undefined;

      // Validation
      if (!userId) {
        res
          .status(400)
          .json({ error: 'Missing "userId" query parameter.' });
        return;
      }

      // Delegate to service
      const user = await userService.getUserStats(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({ user });
    } catch (err) {
      console.error('[userController.getStats] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve user data.' });
    }
  },
};
