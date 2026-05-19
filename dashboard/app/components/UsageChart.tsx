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

const data = [
  { day: 'Mon', timeSpent: 120, filtered: 12 },
  { day: 'Tue', timeSpent: 90, filtered: 18 },
  { day: 'Wed', timeSpent: 150, filtered: 25 },
  { day: 'Thu', timeSpent: 80, filtered: 8 },
  { day: 'Fri', timeSpent: 110, filtered: 15 },
  { day: 'Sat', timeSpent: 210, filtered: 40 },
  { day: 'Sun', timeSpent: 180, filtered: 32 },
];

export default function UsageChart() {
  // Prevent hydration mismatch by only rendering chart on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500">Loading chart...</div>;
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
