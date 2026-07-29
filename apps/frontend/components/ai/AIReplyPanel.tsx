"use client";

import { useEffect, useState } from "react";
import { Check, Clipboard, Send, WandSparkles } from "lucide-react";
import type { Email } from "@abhi2/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export function AIReplyPanel({ email }: { email?: Email }) {
  const { aiReply, detectedIntent, isAILoading, setAIState } = useAppStore();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    if (!draft.trim()) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    setDraft(aiReply ?? "");
  }, [aiReply]);

  async function process() {
    if (!email) return;
    setAIState({ isAILoading: true, aiReply: null, detectedIntent: null });
    const result = await apiFetch<{ intent: { intent: typeof detectedIntent }; reply: string }>("/ai/process-email", {
      method: "POST",
      body: JSON.stringify({ emailId: email.id }),
    });
    setAIState({ isAILoading: false, detectedIntent: result.intent.intent, aiReply: result.reply });
  }

  async function sendReply() {
    if (!email || !draft.trim()) return;
    await apiFetch("/gmail/reply", { method: "POST", body: JSON.stringify({ emailId: email.id, body: draft }) });
  }

  return (
    <aside className="h-[calc(100vh-16rem)] min-h-[520px] overflow-auto border-l border-zinc-800/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">AI Reply Draft</h2>
          <p className="text-xs text-zinc-500">{detectedIntent ? `Intent: ${detectedIntent}` : "Human approval required before sending"}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={process} disabled={!email || isAILoading}>
          {isAILoading ? <Spinner /> : <WandSparkles className="h-4 w-4" />}
          Draft
        </Button>
      </div>
      <div className="relative">
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="AI draft appears here..." className="min-h-72 w-full pr-10" />
        {draft && (
          <button
            onClick={copyDraft}
            title="Copy to clipboard"
            className="absolute right-2 top-2 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <Button className="mt-3 w-full" onClick={sendReply} disabled={!email || !draft.trim()}>
        <Send className="h-4 w-4" />
        Send Approved Reply
      </Button>
    </aside>
  );
}
