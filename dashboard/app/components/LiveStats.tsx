'use client';

import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';

interface LiveStatsProps {
  userId: string;
  initialTimeSaved: string;
  initialVideosFiltered: number;
  initialToxicBlocked: number;
}

interface Stats {
  timeSaved: string;
  videosFiltered: number;
  toxicBlocked: number;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export default function LiveStats({
  userId,
  initialTimeSaved,
  initialVideosFiltered,
  initialToxicBlocked,
}: LiveStatsProps) {
  const [stats, setStats] = useState<Stats>({
    timeSaved: initialTimeSaved,
    videosFiltered: initialVideosFiltered,
    toxicBlocked: initialToxicBlocked,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://feedguard.onrender.com';
        const res = await fetch(`${apiUrl}/api/user?userId=${userId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const today = new Date().toISOString().split('T')[0];
        const todayStats = data?.user?.dailyStats?.find((s: {date: string}) => s.date === today);

        const allTimeFiltered = data?.user?.videosFiltered || 0;
        const allTimeToxic = data?.user?.toxicBlocked || 0;
        const allTimeSpam = data?.user?.spamBlocked || 0;
        const allTimeTime = data?.user?.timeSpent || 0;

        const todayFiltered = (todayStats?.filtered || 0) + (todayStats?.spamBlocked || 0);
        const todayToxic = todayStats?.toxicBlocked || 0;
        const todayTime = todayStats?.timeSpent || 0;

        setStats({
          timeSaved: formatDuration(todayTime > 0 ? todayTime : allTimeTime),
          videosFiltered: todayFiltered > 0 ? todayFiltered : allTimeFiltered + allTimeSpam,
          toxicBlocked: todayToxic > 0 ? todayToxic : allTimeToxic,
        });
      } catch {
        // Keep existing values on error
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Time Saved (Est)"
        value={stats.timeSaved}
        icon="⏱️"
        trend="+12% this week"
        trendPositive={true}
      />
      <StatCard
        title="Tweets Filtered (ML)"
        value={stats.videosFiltered.toString()}
        icon="🐦"
        trendPositive={true}
      />
      <StatCard
        title="Toxic Posts Blocked"
        value={stats.toxicBlocked.toString()}
        icon="☣️"
        trendPositive={false}
      />
    </div>
  );
}
