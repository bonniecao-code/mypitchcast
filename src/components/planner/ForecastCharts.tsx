import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthRow } from "@/lib/forecast";
import { fmtCurrency } from "@/lib/forecast";

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

export function RevenueChart({ data }: { data: MonthRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickFormatter={fmtCurrency} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v)} />
        <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#rev)" name="Revenue" />
        <Line type="monotone" dataKey="mrr" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} name="MRR" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CashflowChart({ data }: { data: MonthRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickFormatter={fmtCurrency} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="netCashflow" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} name="Net cashflow" />
        <Line type="monotone" dataKey="cumulativeCash" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} name="Cumulative" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CustomersChart({ data }: { data: MonthRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="activePaid" fill="var(--color-chart-1)" name="Active paid" radius={[3,3,0,0]} />
        <Bar dataKey="newPaid" fill="var(--color-chart-2)" name="New paid" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
