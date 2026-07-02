"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarChartProps {
  data: {
    domain: string;
    mastery: number;
  }[];
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Mastery"]}
          contentStyle={{
            background: "#1e293b",
            border: "none",
            borderRadius: "8px",
            color: "#f1f5f9",
            fontSize: "12px",
          }}
        />
        <Radar
          name="Mastery"
          dataKey="mastery"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
