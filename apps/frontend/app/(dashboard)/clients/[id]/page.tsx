"use client";

import { use } from "react";
import useSWR from "swr";
import type { Client, Email, Followup } from "@abhi2/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/clients/StatusBadge";

const INTENT_COLORS: Record<string, string> = {
  interested:     "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pricing:        "border-blue-500/30 bg-blue-500/10 text-blue-300",
  confused:       "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  not_interested: "border-red-500/30 bg-red-500/10 text-red-400",
  general:        "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
};

const FOLLOWUP_STATUS_COLORS: Record<string, string> = {
  scheduled: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  queued:    "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  sent:      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed:    "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  skipped:   "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = use(params).id;
  const { data: client } = useSWR<Client>(`/clients/${id}`);
  const { data: emails = [] } = useSWR<Email[]>(`/clients/${id}/emails`);
  const { data: followups = [] } = useSWR<Followup[]>(`/clients/${id}/followups`);

  if (!client) return <Card className="p-6 text-sm text-muted-foreground">Loading client...</Card>;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.email}</p>
            <p className="text-sm text-muted-foreground">{client.company ?? "No company set"}</p>
          </div>
          <StatusBadge status={client.leadStatus} />
        </div>
        <h2 className="mb-3 text-sm font-semibold">Email History</h2>
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="rounded-[6px] border border-border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{email.subject}</p>
                {email.intent && (
                  <Badge className={INTENT_COLORS[email.intent] ?? INTENT_COLORS.general}>
                    {email.intent.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <p className="max-h-10 overflow-hidden text-xs text-muted-foreground">{email.snippet ?? email.bodyText}</p>
            </div>
          ))}
          {!emails.length && <p className="text-sm text-muted-foreground">No emails linked yet.</p>}
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Follow-ups</h2>
        <div className="space-y-3">
          {followups.map((followup) => (
            <div key={followup.id} className="flex items-center justify-between gap-3 rounded-[6px] bg-secondary/60 p-3 text-sm">
              <div>
                <p className="font-medium">Day {followup.dayNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(followup.scheduledFor).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Badge className={FOLLOWUP_STATUS_COLORS[followup.status] ?? FOLLOWUP_STATUS_COLORS.scheduled}>
                {followup.status}
              </Badge>
            </div>
          ))}
          {!followups.length && <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>}
        </div>
      </Card>
    </div>
  );
}
