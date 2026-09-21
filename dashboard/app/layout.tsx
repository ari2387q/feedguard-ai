import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: 'FeedGuard AI Dashboard',
  description: 'AI-powered feed curator analytics and insights.',
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-slate-200">
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<div className="h-16 border-b border-border bg-bg/80" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
