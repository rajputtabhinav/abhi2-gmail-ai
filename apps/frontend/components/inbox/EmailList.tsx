"use client";

import type { Email } from "@abhi2/shared";
import { cn } from "@/lib/utils";

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const INTENT_COLORS: Record<string, string> = {
  interested:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pricing:        "bg-blue-500/15 text-blue-300 border-blue-500/30",
  confused:       "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  not_interested: "bg-red-500/15 text-red-400 border-red-500/30",
  general:        "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function IntentBadge({ email }: { email: Email }) {
  if (email.intent) {
    return (
      <span
        className={cn(
          "shrink-0 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium",
          INTENT_COLORS[email.intent] ?? INTENT_COLORS.general,
        )}
      >
        {email.intent.replace("_", " ")}
      </span>
    );
  }

  if (email.direction === "inbound") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-[4px] border border-zinc-700/50 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-500">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
        AI…
      </span>
    );
  }

  return null;
}

export function EmailList({
  emails,
  selectedId,
  onSelect,
}: {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-[calc(100vh-16rem)] min-h-[520px] overflow-auto border-r border-zinc-800/70">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={cn(
            "block w-full border-b border-zinc-800/70 p-4 text-left transition hover:bg-zinc-800/55",
            selectedId === email.id && "bg-zinc-800/75",
          )}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{email.fromEmail}</p>
            <IntentBadge email={email} />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm">{email.subject}</p>
            <span className="shrink-0 text-[10px] text-zinc-600">{relativeTime(email.sentAt ?? email.createdAt)}</span>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{email.snippet ?? email.bodyText}</p>
        </button>
      ))}
      {!emails.length && <p className="p-4 text-sm text-zinc-500">No synced emails yet.</p>}
    </div>
  );
}
