"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import type { EmailIntent } from "@abhi2/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";

const INTENT_COLORS: Record<string, string> = {
  interested:     "text-emerald-400",
  pricing:        "text-blue-400",
  confused:       "text-yellow-400",
  not_interested: "text-red-400",
  general:        "text-zinc-400",
};

export default function AILabPage() {
  const [emailBody, setEmailBody] = useState("");
  const [clientName, setClientName] = useState("Client");
  const [intent, setIntent] = useState<EmailIntent | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setIsLoading(true);
    setError("");
    setIntent(null);
    setConfidence(null);
    setReply("");
    try {
      const detected = await apiFetch<{ intent: EmailIntent; confidence: number; summary: string }>("/ai/detect-intent", {
        method: "POST",
        body: JSON.stringify({ emailBody }),
      });
      setIntent(detected.intent);
      setConfidence(detected.confidence);
      const generated = await apiFetch<{ reply: string }>("/ai/generate-reply", {
        method: "POST",
        body: JSON.stringify({
          emailBody,
          intent: detected.intent,
          clientContext: { name: clientName, company: null, leadStatus: "warm", previousEmails: [] },
        }),
      });
      setReply(generated.reply);
    } catch {
      setError("Failed to generate — check your OpenAI key and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-4">
        <h1 className="mb-4 text-lg font-semibold">AI Lab</h1>
        <div className="space-y-3">
          <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client name" />
          <Textarea
            value={emailBody}
            onChange={(event) => setEmailBody(event.target.value)}
            placeholder="Paste customer email..."
            className="min-h-80"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button onClick={generate} disabled={!emailBody.trim() || isLoading} className="w-full">
            {isLoading ? <Spinner /> : <WandSparkles className="h-4 w-4" />}
            {isLoading ? "Analyzing…" : "Detect Intent + Draft Reply"}
          </Button>
        </div>
      </Card>
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 min-h-[28px]">
          {intent ? (
            <>
              <span className={`text-sm font-semibold ${INTENT_COLORS[intent] ?? INTENT_COLORS.general}`}>
                {intent.replace("_", " ")}
              </span>
              {confidence != null && (
                <span className="text-xs text-zinc-500">({Math.round(confidence * 100)}% confidence)</span>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-500">{isLoading ? "Detecting intent…" : "No intent detected yet."}</span>
          )}
        </div>
        <Textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={isLoading ? "Drafting reply…" : "Generated reply appears here…"}
          className="min-h-[22rem] flex-1"
        />
      </Card>
    </div>
  );
}
