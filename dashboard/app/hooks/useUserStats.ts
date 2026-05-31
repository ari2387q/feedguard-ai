'use client';

import { useState, useEffect } from 'react';

export interface DailyStat {
  date: string;
  timeSpent: number;
  filtered: number;
}

export interface UserStats {
  userId: string;
  videosFiltered: number;
  toxicBlocked: number;
  timeSpent: number;
  dailyStats: DailyStat[];
}

export interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch user statistics from the backend.
 * Fetches from /api/user?userId=demo by default.
 * @param userId - The user ID to fetch stats for (defaults to 'demo')
 * @returns Object with stats, loading, error, and refetch function
 */
export function useUserStats(userId: string = 'demo'): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/user?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Backend response: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(message);
      console.error('[useUserStats] Error:', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return { stats, loading, error, refetch: fetchStats };
}
