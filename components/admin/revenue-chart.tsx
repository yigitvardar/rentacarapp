"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthData {
  month: string;
  revenue: number;
  count: number;
}

function formatK(value: number) {
  if (value >= 1000) return `₺${(value / 1000).toFixed(0)}B`;
  return `₺${value}`;
}

export function RevenueChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Henüz gelir verisi yok</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 12 }} width={48} />
        <Tooltip
          formatter={(value) => [`₺${Number(value).toLocaleString("tr-TR")}`, "Gelir"]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OccupancyChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div className="space-y-3">
      {data.map(({ label, value, color }) => (
        <div key={label}>
          <div className="flex justify-between text-sm mb-1">
            <span>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.min((value / Math.max(...data.map(d => d.value), 1)) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
