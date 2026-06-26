import React from 'react';
import StatCard from './components/StatCard';
import UsageChart from './components/UsageChart';
import RecentActivity from './components/RecentActivity';

/**
 * Fetches today’s aggregated stats from the backend.
 * Falls back to dummy data if the backend is not running or fails.
 */
async function fetchStats(userId: string) {
  try {
    const res = await fetch(`http://localhost:3001/api/user?userId=${userId}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Backend response not OK');
    const data = await res.json();
    
    // Get today's stats from dailyStats array
    const today = new Date().toISOString().split('T')[0];
    const todayStats = data?.user?.dailyStats?.find((stat: any) => stat.date === today) ?? {
      timeSpent: 0,
      filtered: 0,
    };
    
    return {
      timeSaved: formatDuration(todayStats.timeSpent),
      videosFiltered: todayStats.filtered,
      toxicBlocked: data?.user?.toxicBlocked ?? 0,
      dailyStats: data?.user?.dailyStats ?? [],
    };
  } catch (err) {
    console.error('[Dashboard] Failed to fetch stats:', err);
    // Return empty data if backend isn't available
    return {
      timeSaved: '0m',
      videosFiltered: 0,
      toxicBlocked: 0,
      dailyStats: [],
    };
  }
}

export default async function Home({ searchParams }: { searchParams: { userId?: string } }) {
  const userId = searchParams.userId || 'demo';
  const stats = await fetchStats(userId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">
          Dashboard
        </h1>
        <p className="text-slate-400 font-sans">
          Overview of your digital wellbeing and feed curation.
        </p>
      </header>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Time Saved (Est)"
          value={stats.timeSaved}
          icon="⏱️"
          trend="+12% this week"
          trendPositive={true}
        />
        <StatCard
          title="Clickbait Filtered"
          value={stats.videosFiltered.toString()}
          icon="🚨"
          trend="+5% this week"
          trendPositive={true}
        />
        <StatCard
          title="Toxic Posts Blocked"
          value={stats.toxicBlocked.toString()}
          icon="☣️"
          trend="-2% this week"
          trendPositive={false}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 font-sans">Weekly Usage</h2>
          <div className="h-[300px] w-full">
            <UsageChart userId={userId} />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 font-sans">Recent Activity</h2>
          <RecentActivity userId={userId} />
        </div>
      </div>
    </div>
  );
}

/** Convert seconds to a friendly duration string */
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
