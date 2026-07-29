"use client";

import useSWR from "swr";
import type { Email } from "@abhi2/shared";
import { fetcher } from "@/lib/api";

export function useEmails() {
  return useSWR<Email[]>("/emails", fetcher);
}
