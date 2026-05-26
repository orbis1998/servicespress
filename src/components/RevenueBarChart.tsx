import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type RevenueChartPoint = { jour: string; USD: number; CDF: number };

export function RevenueBarChart({
  data,
  showLegend = false,
}: {
  data: RevenueChartPoint[];
  showLegend?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        {showLegend && <Legend />}
        <Bar dataKey="USD" fill="oklch(0.86 0.18 95)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="CDF" fill="oklch(0.15 0 0)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
