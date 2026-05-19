import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendPositive?: boolean;
}

export default function StatCard({ title, value, icon, trend, trendPositive }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <span className="text-xl bg-surface-2 w-10 h-10 rounded-lg flex items-center justify-center border border-border/50">
          {icon}
        </span>
      </div>
      
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-amber-400 bg-amber-400/10'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
