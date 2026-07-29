"use client";

import useSWR from "swr";
import { MailCheck, Target, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "./MetricCard";

export type DashboardSummary = {
  totalLeads: number;
  hotLeads: number;
  emailsSentToday: number;
  conversionRate: number;
  weeklyActivity?: { day: string; value: number }[];
};

export function MetricsGrid() {
  const { data } = useSWR<DashboardSummary>("/emails/metrics/summary");
  const summary = data ?? { totalLeads: 0, hotLeads: 0, emailsSentToday: 0, conversionRate: 0 };
  return (
    <div className="metric-grid grid gap-4">
      <MetricCard label="Total Leads" value={summary.totalLeads} hint="Active client records" icon={Users} />
      <MetricCard label="Hot Leads" value={summary.hotLeads} hint="Marked ready to close" icon={TrendingUp} />
      <MetricCard label="Sent Today" value={summary.emailsSentToday} hint="Outbound Gmail activity" icon={MailCheck} />
      <MetricCard label="Conversion" value={`${summary.conversionRate}%`} hint="Closed over active leads" icon={Target} />
    </div>
  );
}
