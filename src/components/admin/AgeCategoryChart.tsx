// src/components/admin/AgeCategoryChart.tsx
"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AgeCategoryPerformance } from "@/types/admin.types";

interface AgeCategoryChartProps {
  data: AgeCategoryPerformance[];
}

export default function AgeCategoryChart({ data }: AgeCategoryChartProps) {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    name: item.age_category,
    count: item.avg_eis_score > 0 ? Math.round(item.avg_eis_score * 5) : 0, // scale for bar visualization
    eis: item.avg_eis_score,
  }));

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        border: "1px solid rgba(189,201,193,0.35)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
      }}
    >
      <h3
        className="font-headline-sm text-headline-sm mb-5"
        style={{ color: "var(--color-on-surface)" }}
      >
        Performa per Kategori Usia
      </h3>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              horizontal={false}
              stroke="rgba(189,201,193,0.25)"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-outline)", fontSize: 12 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 600 }}
              width={65}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div 
                      className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                      style={{ fontFamily: "var(--font-work-sans), sans-serif" }}
                    >
                      <p className="font-label-sm text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">{label}</p>
                      <div className="space-y-1">
                        <p className="font-body-sm text-secondary flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-secondary-container)" }} />
                          Populasi: {payload[0]?.value}
                        </p>
                        <p className="font-body-sm text-primary flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Rata-rata EIS: {payload[1]?.value}%
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "var(--color-surface-container-low)", opacity: 0.4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            />
            <Bar
              dataKey="count"
              name="Total Populasi"
              fill="var(--color-secondary-container)"
              radius={[0, 6, 6, 0]}
              barSize={20}
            />
            <Line
              dataKey="eis"
              name="Rata-rata EIS"
              type="monotone"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ r: 5, strokeWidth: 2, fill: "var(--color-surface-container-lowest)", stroke: "var(--color-primary)" }}
              activeDot={{ r: 7, strokeWidth: 0, fill: "var(--color-primary)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
