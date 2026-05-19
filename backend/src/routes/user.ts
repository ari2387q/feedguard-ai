import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

/** Shape of a daily stat entry */
interface DailyStat {
  date: string;
  timeSpent: number;
  filtered: number;
}

/** Request body for POST /api/user (upsert stats) */
interface UserStatsBody {
  userId: string;
  videosFiltered?: number;
  toxicBlocked?: number;
  timeSpent?: number;
}

/**
 * POST /api/user
 * Upserts user stats — creates a new document if userId doesn't exist,
 * otherwise increments the existing counters.
 */
router.post('/', async (req: Request<unknown, unknown, UserStatsBody>, res: Response) => {
  try {
    const { userId, videosFiltered = 0, toxicBlocked = 0, timeSpent = 0 } = req.body;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "userId" field.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        videosFiltered,
        toxicBlocked,
        timeSpent,
        dailyStats: [{ date: today, timeSpent, filtered: videosFiltered }],
      });
    } else {
      user.videosFiltered += videosFiltered;
      user.toxicBlocked += toxicBlocked;
      user.timeSpent += timeSpent;

      // Update today's entry in dailyStats, or push a new one
      const todayEntry = user.dailyStats.find(
        (d: DailyStat) => d.date === today
      );
      if (todayEntry) {
        todayEntry.timeSpent += timeSpent;
        todayEntry.filtered += videosFiltered;
      } else {
        user.dailyStats.push({ date: today, timeSpent, filtered: videosFiltered });
      }
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error('[/api/user POST] Error:', err);
    res.status(500).json({ error: 'Failed to save user stats.' });
  }
});

/**
 * GET /api/user?userId=<id>
 * Retrieves the full user document including daily stats.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;

    if (!userId) {
      res.status(400).json({ error: 'Missing "userId" query parameter.' });
      return;
    }

    const user = await User.findOne({ userId });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('[/api/user GET] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve user data.' });
  }
});

export default router;
