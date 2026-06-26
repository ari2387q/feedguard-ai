'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  day: string;
  timeSpent: number;
  filtered: number;
}

export default function UsageChart({ userId = 'demo' }: { userId?: string }) {
  // Prevent hydration mismatch by only rendering chart on client
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Fetch user stats and transform to last 7 days of data
   */
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/user?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const result = await response.json();
        const dailyStats = result.user?.dailyStats || [];
        
        // Convert dailyStats to chart format with day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = dailyStats
          .slice(-7) // Last 7 days
          .map((stat: any) => {
            const date = new Date(stat.date);
            const day = dayNames[date.getDay()];
            return {
              day,
              timeSpent: Math.floor(stat.timeSpent / 60), // Convert seconds to minutes
              filtered: stat.filtered,
            };
          });
        
        // Pad with empty days if less than 7
        while (chartData.length < 7) {
          const lastDate = chartData.length > 0 
            ? new Date(chartData[chartData.length - 1].day)
            : new Date();
          const newDate = new Date(lastDate.getTime() - (7 - chartData.length) * 24 * 60 * 60 * 1000);
          const dayName = dayNames[newDate.getDay()];
          chartData.unshift({ day: dayName, timeSpent: 0, filtered: 0 });
        }
        
        setData(chartData.length > 0 ? chartData : getDefaultChartData());
      } catch (err) {
        console.error('[UsageChart] Failed to fetch data:', err);
        setData(getDefaultChartData());
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500">Loading chart...</div>;
  }

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500">Loading data...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: '#2a2a2a' }}
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
          itemStyle={{ color: '#f1f5f9' }}
        />
        <Bar 
          dataKey="timeSpent" 
          name="Time Spent (mins)" 
          fill="#6366f1" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={40}
        />
        <Bar 
          dataKey="filtered" 
          name="Items Filtered" 
          fill="#ef4444" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Returns default chart data (empty week) when backend is unavailable
 */
function getDefaultChartData(): ChartData[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      day: dayNames[date.getDay()],
      timeSpent: 0,
      filtered: 0,
    };
  });
}
