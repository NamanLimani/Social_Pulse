"use client";
import React from 'react';
import useSWR from 'swr';
import { TrendingUp } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MainDashboard() {
  const { data: stats } = useSWR('/api/dashboard/stats', fetcher, { refreshInterval: 5000 });
  const { data: sentiment } = useSWR('/api/dashboard/charts?type=sentiment_dist', fetcher);
  
  // Fetch hashtags for the main card
  const { data: hashtags } = useSWR('/api/trends?type=hashtags', fetcher);
  // Fetch entities for the footer
  const { data: entities } = useSWR('/api/trends?type=entities', fetcher);
  
  const { data: feed } = useSWR('/api/stream', fetcher, { refreshInterval: 2000 });

  const getPercent = (val: number) => sentiment?.total ? ((val / sentiment.total) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      
      {/* 1. Sentiment Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-slate-400 font-bold uppercase text-sm mb-4 tracking-wider">Sentiment Distribution</h2>
        <div className="space-y-4">
          {['positive', 'neutral', 'negative', 'unknown'].map((type) => (
            <div key={type}>
              <div className="flex justify-between text-xs mb-1 uppercase font-semibold text-slate-400">
                <span>{type}</span>
                <span>{getPercent(sentiment?.[type] || 0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${type === 'positive' ? 'bg-emerald-400' : type === 'neutral' ? 'bg-indigo-400' : 'bg-rose-500'}`} 
                  style={{ width: `${getPercent(sentiment?.[type] || 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Trending Hashtags Card (Fixed Mode) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-400 font-bold text-sm tracking-wider">
             Trending Hashtags
          </h2>
        </div>

        <div className="space-y-3 flex-1">
          {hashtags?.slice(0, 7).map((t: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm animate-in fade-in slide-in-from-right-2 duration-300">
              <span className="text-blue-300 font-mono truncate max-w-[70%]">{t.entity}</span>
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs min-w-[30px] text-center">
                {t.mentions}
              </span>
            </div>
          ))}
          {(!hashtags) && <div className="text-slate-600 text-sm italic">Loading data...</div>}
          {(hashtags?.length === 0) && <div className="text-slate-600 text-sm">No hashtags yet.</div>}
        </div>
      </section>

      {/* 3. Live Feed Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg lg:col-span-1 h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-400 font-bold uppercase text-sm tracking-wider">Live Feed</h2>
          <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
        <div className="overflow-y-auto space-y-3 pr-2 flex-1 custom-scrollbar">
          {feed?.map((post: any) => (
            <div key={post.post_id} className="text-xs border-l-2 border-slate-700 pl-3 py-1 hover:border-blue-500 transition-colors">
              <div className="flex justify-between text-slate-500 mb-0.5">
                <span className="font-bold">@{post.author?.slice(0, 20)}</span>
                {post.toxic && <span className="text-rose-500 font-bold">TOXIC</span>}
                <span className="font-mono opacity-50 text-[10px]">
                  {post.created_at ? new Date(post.created_at).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <p className="text-slate-300 line-clamp-2 leading-relaxed">{post.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Stats Footer */}
      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        
        {/* Standard Stats */}
        <StatBox label="Total Posts" value={stats?.totalPosts || 0} />
        <StatBox label="Posts/Min" value={stats?.postsPerMin || 0} />
        
        {/* Top Entities Tag Cloud */}
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-500 text-xs uppercase font-bold tracking-wide">Trending Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {entities?.slice(0, 10).map((e: any, i: number) => (
              <span 
                key={i} 
                className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-emerald-300 font-mono hover:bg-slate-700 transition-colors cursor-default"
                title={`${e.mentions} mentions`}
              >
                {e.entity}
              </span>
            ))}
            {!entities && <span className="text-xs text-slate-600">Loading...</span>}
          </div>
        </div>

        {/* Alerts Stat */}
        <StatBox label="Alerts" value={stats?.alertCount || 0} isAlert />
      </div>

    </div>
  );
}

function StatBox({ label, value, isAlert }: any) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg hover:border-slate-700 transition-colors">
      <div className="text-slate-500 text-xs uppercase font-bold tracking-wide">{label}</div>
      <div className={`text-2xl font-mono mt-1 ${isAlert ? 'text-amber-500' : 'text-slate-200'}`}>
        {value ? value.toLocaleString() : '0'}
      </div>
    </div>
  )
}