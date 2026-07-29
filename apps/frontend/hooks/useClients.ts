"use client";

import useSWR from "swr";
import type { Client } from "@abhi2/shared";
import { fetcher } from "@/lib/api";

export function useClients(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return useSWR<Client[]>(`/clients${query}`, fetcher);
}
