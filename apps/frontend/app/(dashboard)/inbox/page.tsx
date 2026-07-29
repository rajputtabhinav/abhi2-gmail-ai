"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { EmailDetail } from "@/components/inbox/EmailDetail";
import { EmailList } from "@/components/inbox/EmailList";
import { AIReplyPanel } from "@/components/ai/AIReplyPanel";
import { apiFetch } from "@/lib/api";
import { useEmails } from "@/hooks/useEmails";
import { useAppStore } from "@/store/useAppStore";

export default function InboxPage() {
  const { data: emails = [] } = useEmails();
  const selectedEmailId = useAppStore((state) => state.selectedEmailId);
  const setSelectedEmail = useAppStore((state) => state.setSelectedEmail);
  const selected = emails.find((email) => email.id === selectedEmailId) ?? emails[0];
  const [syncing, setSyncing] = useState(false);

  async function syncInbox() {
    setSyncing(true);
    try {
      await apiFetch("/gmail/inbox");
      mutate("/emails");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Inbox</h1>
          <p className="text-sm text-zinc-600">Sync Gmail, inspect client messages, and generate approved drafts.</p>
        </div>
        <Button variant="secondary" onClick={syncInbox} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Gmail"}
        </Button>
      </div>
      <section className="grid overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/90 text-zinc-100 shadow-xl shadow-black/10 xl:grid-cols-[340px_1fr_380px]">
        <EmailList emails={emails} selectedId={selected?.id ?? null} onSelect={setSelectedEmail} />
        <EmailDetail email={selected} />
        <AIReplyPanel email={selected} />
      </section>
    </div>
  );
}
