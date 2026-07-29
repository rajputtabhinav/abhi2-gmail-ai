"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Plus } from "lucide-react";
import { ClientTable } from "@/components/clients/ClientTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useClients } from "@/hooks/useClients";

export default function ClientsPage() {
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", notes: "" });
  const { data: clients = [] } = useClients(status);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await apiFetch("/clients", { method: "POST", body: JSON.stringify({ ...form, leadStatus: "warm" }) });
    setForm({ name: "", email: "", company: "", notes: "" });
    mutate("/clients");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Clients</h1>
            <p className="text-sm text-zinc-500">Filter, update status, and schedule follow-ups.</p>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-zinc-800/70 bg-zinc-900/80 px-3 pr-8 text-sm text-zinc-200 outline-none ring-0 transition hover:border-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 appearance-none"
          >
            <option value="">All statuses</option>
            <option value="hot">🔴 Hot</option>
            <option value="warm">🟠 Warm</option>
            <option value="cold">🔵 Cold</option>
            <option value="closed">🟢 Closed</option>
            <option value="lost">⚪ Lost</option>
          </select>
        </div>
        <ClientTable clients={clients} />
      </Card>
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold">Create Client</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
          <Textarea placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </form>
      </Card>
    </div>
  );
}
