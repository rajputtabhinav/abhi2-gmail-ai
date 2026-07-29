"use client";

import Link from "next/link";
import { mutate } from "swr";
import type { Client, LeadStatus } from "@abhi2/shared";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

const statuses: LeadStatus[] = ["hot", "warm", "cold", "closed", "lost"];

export function ClientTable({ clients }: { clients: Client[] }) {
  async function updateStatus(client: Client, leadStatus: LeadStatus) {
    await apiFetch(`/clients/${client.id}`, {
      method: "PATCH",
      body: JSON.stringify({ leadStatus }),
    });
    mutate("/clients");
  }

  async function schedule(client: Client) {
    await apiFetch("/followups/schedule", {
      method: "POST",
      body: JSON.stringify({ clientId: client.id, days: [1, 3, 5, 7] }),
    });
    mutate("/followups");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/70">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-950/70 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-zinc-800/70 bg-zinc-900/50">
              <td className="px-4 py-3">
                <Link href={`/clients/${client.id}`} className="font-medium text-zinc-100 hover:text-white">
                  {client.name}
                </Link>
                <p className="text-xs text-zinc-500">{client.email}</p>
              </td>
              <td className="px-4 py-3 text-zinc-500">{client.company ?? "Unassigned"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={client.leadStatus} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={client.leadStatus}
                    onChange={(event) => updateStatus(client, event.target.value as LeadStatus)}
                    className="h-8 rounded-lg border border-zinc-800 bg-zinc-800/80 px-2 text-xs text-zinc-200 outline-none"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="secondary" onClick={() => schedule(client)}>
                    Schedule
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!clients.length && <p className="p-6 text-sm text-zinc-500">No clients match the current filters.</p>}
    </div>
  );
}
