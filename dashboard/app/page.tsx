// dashboard/app/page.tsx
"use client";
import React from 'react';
import useSWR from 'swr';
import TrendHunter from './components/TrendHunter';
import SafetyRisk from './components/SafetyRisk';
import { Activity } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  // Poll APIs
  const { data: posts, isLoading: postsLoading } = useSWR('/api/stream', fetcher, { refreshInterval: 2000 });
  const { data: trends } = useSWR('/api/trends', fetcher, { refreshInterval: 5000 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <Activity className="text-blue-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Bluesky Intelligence Platform
          </h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* TOP ROW: THE ANALYTICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          
          {/* 1. Trend Hunter View (Takes up 2/3 width) */}
          <div className="lg:col-span-2 h-full">
            <TrendHunter trends={trends || []} posts={posts || []} />
          </div>

          {/* 2. Safety & Risk View (Takes up 1/3 width) */}
          <div className="lg:col-span-1 h-full">
            <SafetyRisk posts={posts || []} />
          </div>
        </div>

        {/* BOTTOM ROW: RAW FEED (Simplified) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">Raw Ingestion Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {posts?.slice(0, 6).map((post: any) => (
                <div key={post.post_id} className="bg-slate-950/50 p-3 rounded border border-slate-800/50 text-xs text-slate-400 font-mono truncate">
                  <span className="text-blue-500 mr-2">@{post.author}</span>
                  {post.text}
                </div>
             ))}
          </div>
        </div>

      </main>
    </div>
  );
}