"use client";

import React from "react";
import useSWR from "swr";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// -----------------------------
// TYPES FOR SENTIMENT TIMELINE
// -----------------------------
interface SentimentPoint {
  hour: number;
  positive: number;
  neutral: number;
  negative: number;
  unknown: number;
}

interface SentimentResponse {
  timeline: SentimentPoint[];
}

// Fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsView() {
  // HOURLY ENGAGEMENT
  const { data: hourly } = useSWR(
    "/api/dashboard/charts?type=activity_hourly",
    fetcher
  );

  // SENTIMENT TIMELINE
  const { data: sentiment } = useSWR<SentimentResponse>(
    "/api/dashboard/sentiment",
    fetcher,
    { refreshInterval: 6000 }
  );

  // -----------------------------
  //   HOURLY ENGAGEMENT DATA
  // -----------------------------
  const hourlyData = {
    labels: hourly?.labels || [],
    datasets: [
      {
        label: "Post Count",
        data: hourly?.data || [],
        backgroundColor: "rgba(96, 165, 250, 0.35)", 
        borderColor: "#60A5FA",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(96, 165, 250, 0.75)",
        hoverBorderColor: "#93C5FD",
        borderRadius: 6,
      },
    ],
  };

  const hourlyOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#CBD5E1",
          font: { size: 12 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 12,
        displayColors: false,
      },
    },

    scales: {
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
    },

    animation: {
      duration: 900,
      easing: "easeOutQuart",
    },
  };

  // -----------------------------
  //   SENTIMENT TIMELINE MERGED
  // -----------------------------
  const sentimentTimeline: SentimentPoint[] = sentiment?.timeline || [];

  const sentimentLabels = sentimentTimeline.map((p: SentimentPoint) =>
    `${p.hour.toString().padStart(2, "0")}:00`
  );

  const sentimentData = {
    labels: sentimentLabels,
    datasets: [
      {
        label: "Positive",
        data: sentimentTimeline.map((p: SentimentPoint) => p.positive),
        borderColor: "#4ADE80",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Neutral",
        data: sentimentTimeline.map((p: SentimentPoint) => p.neutral),
        borderColor: "#60A5FA",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Negative",
        data: sentimentTimeline.map((p: SentimentPoint) => p.negative),
        borderColor: "#F87171",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Unknown",
        data: sentimentTimeline.map((p: SentimentPoint) => p.unknown),
        borderColor: "#A78BFA",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const sentimentOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: { color: "#CBD5E1" },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 10,
        displayColors: false,
      },
    },

    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
    },

    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Hourly Engagement Pattern */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[500px] col-span-1">
        <h3 className="text-gray-300 font-semibold mb-4">
          Hourly Engagement Pattern
        </h3>
        <div className="h-[420px]">
          <Bar data={hourlyData} options={hourlyOptions} />
        </div>
      </div>

      {/* Sentiment Timeline */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[500px] col-span-1">
        <h3 className="text-gray-300 font-semibold mb-4">
          Sentiment Timeline (Last 24 Hours)
        </h3>
        <div className="h-[420px]">
          <Line data={sentimentData} options={sentimentOptions} />
        </div>
      </div>

    </div>
  );
}
