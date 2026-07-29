"use client";

import useSWR from "swr";
import type { User } from "@abhi2/shared";
import { fetcher } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

export function useSession() {
  const session = useSWR<User | null>("/auth/me", fetcher, { shouldRetryOnError: false });
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (session.data !== undefined) setUser(session.data);
  }, [session.data, setUser]);

  return session;
}
