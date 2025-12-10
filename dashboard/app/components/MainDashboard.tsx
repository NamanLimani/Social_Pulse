"use client";
import React from "react";
import useSWR from "swr";

import {
  BarChart3,
  Activity,
  AlertTriangle,
  Flame,
  Skull,
  Bug,
  Tags,
  Network,
  FileText,
} from "lucide-react";

// ----- Chart.js imports -----
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ------- Types -------
interface HashtagItem {
  entity: string;
  mentions: number;
}

interface FeedPost {
  post_id: string;
  author: string;
  text: string;
  created_at?: string;
  toxic?: boolean;
}

interface StatBoxProps {
  label: string;
  value?: number;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}

// ----------------------------

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MainDashboard() {
  const { data: stats } = useSWR("/api/dashboard/stats", fetcher, {
    refreshInterval: 5000,
  });

  const { data: sentiment } = useSWR(
    "/api/dashboard/charts?type=sentiment_dist",
    fetcher
  );

  const { data: hashtags } = useSWR<HashtagItem[]>(
    "/api/trends?type=hashtags",
    fetcher
  );

  const { data: feed } = useSWR<FeedPost[]>("/api/stream", fetcher, {
    refreshInterval: 2000,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">

      {/* ========================= */}
      {/* SENTIMENT DISTRIBUTION   */}
      {/* ========================= */}

      <section
        className="
          bg-white/5 
          backdrop-blur-md 
          border border-white/10 
          rounded-2xl 
          p-6 
          shadow-xl 
          transition-all duration-300
          hover:border-white/20
          hover:shadow-[0_0_35px_rgba(0,200,255,0.25)]
          hover:scale-[1.015]
        "
      >
        <h2 className="text-slate-300 font-bold uppercase text-sm mb-4 tracking-wider">
          Sentiment Distribution
        </h2>

        <div className="h-64">
          <Bar
            data={{
              labels: ["Positive", "Neutral", "Negative", "Unknown"],
              datasets: [
                {
                  label: "Count",
                  data: [
                    sentiment?.positive || 0,
                    sentiment?.neutral || 0,
                    sentiment?.negative || 0,
                    sentiment?.unknown || 0,
                  ],
                  backgroundColor: [
                    "rgba(16, 185, 129, 0.7)",
                    "rgba(99, 102, 241, 0.7)",
                    "rgba(239, 68, 68, 0.7)",
                    "rgba(148, 163, 184, 0.7)",
                  ],
                  borderRadius: 6,
                  barPercentage: 0.6,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  titleColor: "#fff",
                  bodyColor: "#ddd",
                  borderColor: "#0ea5e9",
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  ticks: { color: "#94a3b8" },
                  grid: { color: "rgba(255,255,255,0.05)" },
                },
                y: {
                  ticks: { color: "#94a3b8", font: { size: 12 } },
                  grid: { display: false },
                },
              },
              animation: {
                duration: 900,
                easing: "easeOutQuart",
              },
            }}
          />
        </div>
      </section>

      {/* ========================= */}
      {/* TRENDING HASHTAGS        */}
      {/* ========================= */}

      <section
        className="
          bg-white/5 backdrop-blur-md 
          border border-white/10 rounded-2xl 
          p-6 shadow-xl 
          transition-all duration-300
          hover:border-white/20
          hover:shadow-[0_0_35px_rgba(0,200,255,0.25)]
          hover:scale-[1.015]
          flex flex-col
        "
      >
        <h2 className="text-slate-300 font-bold text-sm tracking-wider mb-4">
          Trending Hashtags
        </h2>

        <div className="space-y-3 flex-1">
          {(hashtags ?? []).slice(0, 7).map((t, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-slate-300"
            >
              <span className="truncate max-w-[70%]">{t.entity}</span>
              <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded text-xs min-w-[30px] text-center">
                {t.mentions}
              </span>
            </div>
          ))}

          {!hashtags && (
            <div className="text-slate-500 text-sm italic">Loading...</div>
          )}
        </div>
      </section>

      {/* ========================= */}
      {/* LIVE FEED                */}
      {/* ========================= */}

      <section
        className="
          bg-white/5 backdrop-blur-md 
          border border-white/10 rounded-2xl 
          p-6 shadow-xl transition-all 
          hover:border-white/20 hover:shadow-[0_0_35px_rgba(0,200,255,0.25)]
          hover:scale-[1.015]
          h-[300px] flex flex-col
        "
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-300 font-bold uppercase text-sm tracking-wider">
            Live Feed
          </h2>
          <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        <div className="overflow-y-auto space-y-3 pr-2 flex-1 custom-scrollbar">
          {(feed ?? []).map((post) => (
            <div
              key={post.post_id}
              className="text-xs text-slate-300 border-l-2 border-white/20 pl-3 py-1"
            >
              <div className="flex justify-between mb-0.5">
                <span className="font-bold">@{post.author?.slice(0, 20)}</span>

                {post.toxic && (
                  <span className="text-rose-400 font-bold">TOXIC</span>
                )}

                <span className="font-mono opacity-60 text-[10px]">
                  {post.created_at
                    ? new Date(post.created_at).toLocaleTimeString()
                    : "Now"}
                </span>
              </div>

              <p className="text-slate-400 line-clamp-2">{post.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= */}
      {/* PREMIUM 3×3 GRID         */}
      {/* ========================= */}

      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">

        <StatBox
          label="Total Posts"
          value={stats?.totalPosts}
          icon={<BarChart3 className="w-5 h-5" />}
          gradient="from-blue-600 to-blue-400"
          glow="rgba(0,135,255,0.45)"
        />

        <StatBox
          label="Topics"
          value={stats?.topicCount}
          icon={<Tags className="w-5 h-5" />}
          gradient="from-purple-600 to-purple-400"
          glow="rgba(150,80,255,0.45)"
        />

        <StatBox
          label="Entities"
          value={stats?.entityCount}
          icon={<Network className="w-5 h-5" />}
          gradient="from-emerald-600 to-emerald-400"
          glow="rgba(0,255,135,0.45)"
        />

        <StatBox
          label="Rumor Posts"
          value={stats?.rumorPosts}
          icon={<Flame className="w-5 h-5" />}
          gradient="from-orange-600 to-orange-400"
          glow="rgba(255,150,0,0.45)"
        />

        <StatBox
          label="Toxic Posts"
          value={stats?.toxicPosts}
          icon={<Skull className="w-5 h-5" />}
          gradient="from-rose-600 to-rose-400"
          glow="rgba(255,0,80,0.45)"
        />

        <StatBox
          label="Anomalies"
          value={stats?.anomalyCount}
          icon={<Bug className="w-5 h-5" />}
          gradient="from-yellow-600 to-yellow-400"
          glow="rgba(255,210,0,0.45)"
        />

        <StatBox
          label="Summaries"
          value={stats?.summaryCount}
          icon={<FileText className="w-5 h-5" />}
          gradient="from-cyan-600 to-cyan-400"
          glow="rgba(0,255,255,0.45)"
        />

        <StatBox
          label="Alerts"
          value={stats?.alertCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          gradient="from-red-600 to-red-400"
          glow="rgba(255,0,0,0.45)"
        />

        <StatBox
          label="Posts / Min"
          value={stats?.postsPerMin}
          icon={<Activity className="w-5 h-5" />}
          gradient="from-green-600 to-green-400"
          glow="rgba(0,255,0,0.45)"
        />
      </div>
    </div>
  );
}

// ----------------------
// PREMIUM STATBOX
// ----------------------

function StatBox({ label, value, icon, gradient, glow }: StatBoxProps) {
  return (
    <div
      className={`
        relative p-5 rounded-xl border 
        bg-gradient-to-br ${gradient} 
        border-slate-800 shadow-lg backdrop-blur 
        transition-all duration-300
        
        hover:scale-[1.04]
        hover:shadow-[0_0_20px_${glow}]
        hover:border-white/20
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-black/20 text-white">{icon}</div>
        <span className="text-xs uppercase tracking-wide font-bold text-white/80">
          {label}
        </span>
      </div>

      <div className="text-3xl font-mono font-bold text-white drop-shadow">
        {value ? value.toLocaleString() : "0"}
      </div>
    </div>
  );
}
