'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Navbar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlUserId = searchParams.get('userId');
  const [currentId, setCurrentId] = useState<string>('demo');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (urlUserId) {
      setCurrentId(urlUserId);
      localStorage.setItem('feedguard_user_id', urlUserId);
    } else {
      const stored = localStorage.getItem('feedguard_user_id');
      if (stored) {
        setCurrentId(stored);
        router.replace(`/?userId=${stored}`);
      } else {
        setCurrentId('demo');
      }
    }
  }, [urlUserId, router]);

  const handleSaveId = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const trimmed = inputValue.trim();
      localStorage.setItem('feedguard_user_id', trimmed);
      setCurrentId(trimmed);
      setIsEditing(false);
      router.push(`/?userId=${trimmed}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href={`/?userId=${currentId || 'demo'}`} className="flex items-center gap-2">
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

        <div className="flex items-center gap-3">
          {isEditing ? (
            <form onSubmit={handleSaveId} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste Extension ID..."
                className="bg-surface border border-border text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-accent w-48 font-mono"
                autoFocus
              />
              <button
                type="submit"
                className="bg-accent text-white text-xs px-2.5 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setInputValue(currentId === 'demo' ? '' : currentId);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border px-3 py-1.5 rounded-lg transition-colors text-xs"
              title="Click to link your Extension User ID"
            >
              <span className="text-slate-400 font-medium">User:</span>
              <span className="text-accent font-mono">
                {currentId ? (currentId.length > 12 ? `${currentId.slice(0, 10)}...` : currentId) : 'demo'}
              </span>
              <span className="text-slate-500 text-[10px]">✏️</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border overflow-hidden">
            <div className="w-full h-full bg-gradient-to-tr from-accent to-purple-500 opacity-80" />
          </div>
        </div>
      </div>
    </nav>
  );
}
