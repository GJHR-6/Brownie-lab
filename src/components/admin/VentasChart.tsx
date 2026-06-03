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
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        <span className="font-[700] text-[16px]" style={{ color: "var(--ink)" }}>
          Ventas últimos 30 días
        </span>
        <span
          className="text-[12.5px] font-[600] uppercase tracking-[0.08em]"
          style={{ color: "var(--ink-soft)" }}
        >
          HNL
        </span>
      </div>
      <div className="px-6 pb-5 pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 5" stroke="#ece0c6" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: "#a8967c", fontFamily: "ui-monospace,monospace" }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: "#a8967c", fontFamily: "ui-monospace,monospace" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--hairline)",
                background: "var(--paper-card)",
                fontSize: 12,
                fontFamily: "var(--font-dm-sans, sans-serif)",
                color: "var(--ink)",
              }}
              formatter={(v) => [`L. ${Number(v ?? 0).toFixed(2)}`, "Ventas"]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#d9711e"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: "#d9711e", stroke: "#fbf6ec", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
