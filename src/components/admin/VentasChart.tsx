"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DailySale {
  fecha: string;
  total: number;
}

export default function VentasChart({ data }: { data: DailySale[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h2 className="font-semibold text-stone-700 mb-4 text-sm">Ventas últimos 30 días (HNL)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v) => [`L. ${Number(v ?? 0).toFixed(2)}`, "Ventas"]}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#b45309"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#92400e" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
