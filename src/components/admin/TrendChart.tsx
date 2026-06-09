// src/components/admin/TrendChart.tsx
"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendDataPoint {
  name: string;
  visitors: number;
  eis: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        border: "1px solid rgba(189,201,193,0.35)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3
            className="font-headline-sm text-headline-sm"
            style={{ color: "var(--color-on-surface)" }}
          >
            Tren Pengunjung &amp; Dampak Edukasi
          </h3>
          <p
            className="font-body-sm text-body-sm mt-1"
            style={{ color: "var(--color-outline)" }}
          >
            Perbandingan jumlah pengunjung harian dengan rata-rata skor EIS (Exhibit Impact Score)
          </p>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-2 font-label-sm text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-primary-container)" }}
            />
            Pengunjung
          </span>
          <span className="flex items-center gap-2 font-label-sm text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-tertiary)" }}
            />
            Rata-rata EIS
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="rgba(189,201,193,0.25)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-outline)", fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-outline)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-outline)", fontSize: 12 }}
              domain={[0, 100]}
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
                        <p className="font-body-sm text-primary flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-primary-container" />
                          Pengunjung: {payload[0]?.value?.toLocaleString()}
                        </p>
                        <p className="font-body-sm text-tertiary flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-tertiary" />
                          Rata-rata EIS: {payload[1]?.value}%
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: "rgba(189,201,193,0.4)",
                strokeWidth: 1.5,
                strokeDasharray: "4 4",
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="visitors"
              fill="var(--color-primary-container)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="eis"
              stroke="var(--color-tertiary)"
              strokeWidth={3.5}
              dot={{ r: 5, strokeWidth: 2, fill: "var(--color-surface-container-lowest)", stroke: "var(--color-tertiary)" }}
              activeDot={{ r: 7, strokeWidth: 0, fill: "var(--color-tertiary)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
