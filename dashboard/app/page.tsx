import React from 'react';
import StatCard from './components/StatCard';
import UsageChart from './components/UsageChart';

/**
 * Fetches today’s aggregated stats from the backend.
 * Falls back to dummy data if the backend is not running or fails.
 */
async function fetchStats() {
  try {
    const res = await fetch('http://localhost:3001/api/user?userId=demo', {
      next: { revalidate: 10 } // Cache for 10 seconds
    });
    if (!res.ok) throw new Error('Backend response not OK');
    const data = await res.json();
    
    const stats = data?.user?.dailyStats?.[0] ?? {
      timeSpent: 0,
      filtered: 0,
    };
    
    return {
      timeSaved: formatDuration(stats.timeSpent),
      videosFiltered: stats.filtered,
      toxicBlocked: data?.user?.toxicBlocked ?? 0,
    };
  } catch (err) {
    // Return mock data if backend isn't ready/reachable yet
    return {
      timeSaved: '2h 15m',
      videosFiltered: 47,
      toxicBlocked: 12,
    };
  }
}

export default async function Home() {
  const stats = await fetchStats();

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
            <UsageChart />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 font-sans">Recent Activity</h2>
          <div className="space-y-5">
            {[
              { id: 1, action: 'Blocked clickbait video', time: '10 mins ago', icon: '🚨' },
              { id: 2, action: 'Flagged toxic tweet', time: '1 hour ago', icon: '☣️' },
              { id: 3, action: 'Hit Doomscroll limit', time: '3 hours ago', icon: '🛡️' },
              { id: 4, action: 'Generated AI Summary', time: '5 hours ago', icon: '🤖' },
            ].map((item) => (
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
