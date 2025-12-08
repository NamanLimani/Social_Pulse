"use client";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';

// Types based on your pipeline
interface TrendItem {
  entity: string;
  mentions: number;
  positive: number;
  total: number;
}

interface Post {
  topic_anomaly?: boolean;
  topic_keywords?: string[];
  text: string;
}

export default function TrendHunter({ trends, posts }: { trends: TrendItem[], posts: Post[] }) {
  
  // 1. Prepare Data for Stacked Bar Chart
  // We need to split 'total' into 'positive' and 'others' (neutral/negative) for the stack
  const chartData = useMemo(() => {
    return trends.map(t => ({
      name: t.entity,
      positive: t.positive,
      others: t.total - t.positive, // Derived field for the stack
      total: t.total
    }));
  }, [trends]);

  // 2. Detect Active Spikes from the Live Stream
  // We look at the last 50 posts to see if any are currently flagged as an anomaly
  const activeSpike = useMemo(() => {
    return posts.find(p => p.topic_anomaly);
  }, [posts]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* A. SPIKE ALERT BANNER (Conditional) */}
      {activeSpike ? (
        <div className="bg-yellow-950/30 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-400 uppercase tracking-wide text-sm">Anomaly Detected</h3>
            <p className="text-xs text-yellow-200/80">
              Unusual volume spike in topic: <span className="font-mono text-white">
                {activeSpike.topic_keywords?.slice(0, 3).join(", ")}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4 opacity-50">
          <TrendingUp className="w-6 h-6 text-slate-600" />
          <div>
            <h3 className="font-bold text-slate-500 uppercase tracking-wide text-sm">System Normal</h3>
            <p className="text-xs text-slate-600">No volume anomalies detected in current window.</p>
          </div>
        </div>
      )}

      {/* B. ENTITY SENTIMENT LEADERBOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> 
            Trending Entities
          </h2>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
            Last 5 Seconds
          </span>
        </div>

        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={90} 
                tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                interval={0}
              />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              
              {/* Stacked Bars */}
              <Bar dataKey="positive" name="Positive" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} barSize={18} />
              <Bar dataKey="others" name="Neutral/Neg" stackId="a" fill="#334155" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}