"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Client, Email } from "@abhi2/shared";
import { Card } from "@/components/ui/card";
import { MetricsGrid, type DashboardSummary } from "@/components/dashboard/MetricsGrid";
import { StatusBadge } from "@/components/clients/StatusBadge";

function formatChartDay(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

const DEFAULT_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, value: 0 }));

export default function DashboardPage() {
  const { data: clients = [] } = useSWR<Client[]>("/clients");
  const { data: emails = [] } = useSWR<Email[]>("/emails");
  const { data: summary } = useSWR<DashboardSummary>("/emails/metrics/summary");
  const fromApi =
    summary?.weeklyActivity?.map((row) => ({
      day: formatChartDay(row.day),
      value: row.value,
    })) ?? [];
  const chartData = fromApi.length > 0 ? fromApi : DEFAULT_WEEK;
  const maxValue = Math.max(1, ...chartData.map((item) => item.value));
  const xDenom = Math.max(1, chartData.length - 1);
  const points = chartData
    .map((item, index) => {
      const x = (index / xDenom) * 100;
      const y = 90 - (item.value / maxValue) * 70;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="space-y-4">
      <MetricsGrid />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Client Progress</h2>
              <p className="text-xs text-zinc-500">Weekly lead activity</p>
            </div>
          </div>
          <div className="h-72 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="leadActivity" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#f4f4f5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points="0,90 100,90" fill="none" stroke="#27272a" strokeWidth="0.6" />
              <polygon points={areaPoints} fill="url(#leadActivity)" />
              <polyline points={points} fill="none" stroke="#f4f4f5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              {chartData.map((item, index) => {
                const x = (index / Math.max(1, chartData.length - 1)) * 100;
                const y = 90 - (item.value / maxValue) * 70;
                return (
                  <circle key={`pt-${index}`} cx={x} cy={y} r="1.8" fill="#f4f4f5" opacity="0.7">
                    <title>{`${item.day}: ${item.value} email${item.value !== 1 ? "s" : ""}`}</title>
                  </circle>
                );
              })}
            </svg>
            <div
              className="mt-3 grid text-center text-[11px] text-zinc-600"
              style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
            >
              {chartData.map((item, i) => (
                <span key={`${item.day}-${i}`}>{item.day}</span>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Recent Clients</h2>
          <div className="space-y-3">
            {clients.slice(0, 6).map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between gap-3 rounded-[6px] bg-secondary/60 p-3 transition hover:bg-secondary/90"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  <p className="truncate text-xs text-zinc-500">{client.email}</p>
                </div>
                <StatusBadge status={client.leadStatus} />
              </Link>
            ))}
            {!clients.length && <p className="text-sm text-zinc-500">No clients yet. Sync Gmail or create one manually.</p>}
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold">Recent Email Activity</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {emails.slice(0, 4).map((email) => (
            <div key={email.id} className="rounded-[6px] border border-border p-3">
              <p className="truncate text-sm font-medium">{email.subject}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">{email.snippet ?? email.bodyText}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
