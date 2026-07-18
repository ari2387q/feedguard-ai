'use client';

import React, { useState, useEffect } from 'react';

interface Activity {
  id: string;
  action: string;
  time: string;
  icon: string;
  timestamp: number;
}

/**
 * Component that displays recent activity feed based on daily stats changes
 */
export default function RecentActivity({ userId = 'demo' }: { userId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://feedguard.onrender.com'}/api/user?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const result = await response.json();
      const dailyStats = result.user?.dailyStats || [];
      
      // Sort by date descending to get most recent first
      const sorted = [...dailyStats].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Generate activities based on stats
      const newActivities: Activity[] = [];
      
      sorted.forEach((stat: any, index: number) => {
        const date = new Date(stat.date);
        const isToday = date.toDateString() === new Date().toDateString();
        const timeAgo = getTimeAgo(date);
        
        // Add activity for filtered videos
        if (stat.filtered > 0) {
          const prevFiltered = index > 0 ? sorted[index - 1].filtered : 0;
          const filtered = stat.filtered - prevFiltered;
          if (filtered > 0 || index === 0) {
            newActivities.push({
              id: `filtered-${stat.date}`,
              action: `Blocked ${filtered > 0 ? filtered : stat.filtered} clickbait video${filtered !== 1 ? 's' : ''}`,
              time: timeAgo,
              icon: '🚨',
              timestamp: date.getTime(),
            });
          }
        }
        
        // Add activity for time spent
        if (stat.timeSpent > 300) { // More than 5 minutes
          newActivities.push({
            id: `time-${stat.date}`,
            action: `Spent ${formatDuration(stat.timeSpent)} on feed`,
            time: timeAgo,
            icon: '⏱️',
            timestamp: date.getTime(),
          });
        }
      });
      
      setActivities(newActivities.slice(0, 4)); // Show only 4 most recent
    } catch (err) {
      console.error('[RecentActivity] Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-12 bg-surface-2 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <p className="text-sm">No activity yet. Start using FeedGuard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activities.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-surface-2 rounded-full flex items-center justify-center text-sm border border-border">
            {item.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200 font-sans">{item.action}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Format seconds into a readable duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

/**
 * Get human-readable time difference from now
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
