import User from '../models/User';

export interface DailyStat {
  date: string;
  timeSpent: number;
  filtered: number;
}

export interface UpsertPayload {
  userId: string;
  videosFiltered?: number;
  toxicBlocked?: number;
  timeSpent?: number;
}

/**
 * Service layer for user operations.
 * Handles business logic for creating, updating, and retrieving user stats.
 */
export const userService = {
  /**
   * Upserts user stats — creates if not exists, updates if exists.
   * @param payload - User data with optional stat increments
   * @returns Updated user document
   */
  upsertUserStats: async (payload: UpsertPayload) => {
    try {
      const {
        userId,
        videosFiltered = 0,
        toxicBlocked = 0,
        timeSpent = 0,
      } = payload;

      const today = new Date().toISOString().split('T')[0];
      let user = await User.findOne({ userId });

      if (!user) {
        // Create new user
        user = new User({
          userId,
          videosFiltered,
          toxicBlocked,
          timeSpent,
          dailyStats: [
            { date: today, timeSpent, filtered: videosFiltered },
          ],
        });
      } else {
        // Update existing user
        user.videosFiltered += videosFiltered;
        user.toxicBlocked += toxicBlocked;
        user.timeSpent += timeSpent;

        // Update or create today's daily stat
        const todayEntry = user.dailyStats.find(
          (d: DailyStat) => d.date === today
        );
        if (todayEntry) {
          todayEntry.timeSpent += timeSpent;
          todayEntry.filtered += videosFiltered;
        } else {
          user.dailyStats.push({
            date: today,
            timeSpent,
            filtered: videosFiltered,
          });
        }
      }

      await user.save();
      return user;
    } catch (err) {
      console.error('[userService.upsertUserStats] Error:', err);
      throw new Error('Failed to upsert user stats.');
    }
  },

  /**
   * Retrieves user stats by userId.
   * @param userId - The user ID
   * @returns User document or null if not found
   */
  getUserStats: async (userId: string) => {
    try {
      const user = await User.findOne({ userId });
      return user;
    } catch (err) {
      console.error('[userService.getUserStats] Error:', err);
      throw new Error('Failed to retrieve user stats.');
    }
  },
};
