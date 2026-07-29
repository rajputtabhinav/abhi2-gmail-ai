"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const params = useSearchParams();
  const gmailConnected = params.get("gmail") === "connected";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Gmail Connection</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your Gmail account so Abhi2.0 can read your inbox and send emails on your behalf.
          You only need to do this once — tokens are stored securely in the database.
        </p>
        {gmailConnected && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Gmail connected successfully.
          </div>
        )}
        <a href={`${apiUrl}/auth/google`} className="mt-4 block">
          <Button variant="outline" className="w-full gap-2">
            <Mail className="h-4 w-4" />
            {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </Button>
        </a>
      </Card>
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Sending Safety</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI-generated replies require manual approval before sending. Scheduled follow-ups auto-send
          only after you explicitly schedule them.
        </p>
      </Card>
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Environment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure OpenAI, Redis, and PostgreSQL in <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">apps/backend/.env</code>.
          Change your login password with the <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">LOCAL_PASSWORD</code> variable.
        </p>
      </Card>
    </div>
  );
}
