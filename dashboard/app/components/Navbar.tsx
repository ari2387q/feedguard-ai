import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">
              FeedGuard AI
            </span>
            <span className="text-[10px] font-semibold text-accent uppercase tracking-widest leading-tight">
              Dashboard
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Settings
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border overflow-hidden">
            {/* Placeholder for user avatar */}
            <div className="w-full h-full bg-gradient-to-tr from-accent to-purple-500 opacity-80" />
          </div>
        </div>
      </div>
    </nav>
  );
}
