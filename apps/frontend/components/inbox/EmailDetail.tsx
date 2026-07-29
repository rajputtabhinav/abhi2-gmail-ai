"use client";

import type { Email } from "@abhi2/shared";
import { Badge } from "@/components/ui/badge";

const INTENT_COLORS: Record<string, string> = {
  interested:     "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pricing:        "border-blue-500/30 bg-blue-500/10 text-blue-300",
  confused:       "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  not_interested: "border-red-500/30 bg-red-500/10 text-red-400",
  general:        "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
};

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailDetail({ email }: { email?: Email }) {
  if (!email) {
    return <div className="grid h-[calc(100vh-16rem)] min-h-[520px] place-items-center p-6 text-sm text-zinc-500">Select an email to review the thread and draft a response.</div>;
  }

  const sentTime = formatDateTime(email.sentAt ?? email.createdAt);

  return (
    <article className="h-[calc(100vh-16rem)] min-h-[520px] overflow-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {email.intent && (
          <Badge className={INTENT_COLORS[email.intent] ?? INTENT_COLORS.general}>
            {email.intent.replace("_", " ")}
          </Badge>
        )}
        {sentTime && (
          <span className="text-xs text-zinc-500">{sentTime}</span>
        )}
      </div>
      <h1 className="text-xl font-semibold">{email.subject}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        From <span className="text-zinc-300">{email.fromEmail}</span>
        {email.toEmails.length > 0 && <> to <span className="text-zinc-300">{email.toEmails.join(", ")}</span></>}
      </p>
      <div className="mt-6 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6">{email.bodyText}</div>
    </article>
  );
}
