"use client";

import { create } from "zustand";
import type { EmailIntent, User } from "@abhi2/shared";

type AppStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedEmailId: string | null;
  setSelectedEmail: (id: string | null) => void;
  filters: { status?: string; leadStatus?: string };
  setFilter: (key: string, value: string) => void;
  aiReply: string | null;
  detectedIntent: EmailIntent | null;
  isAILoading: boolean;
  setAIState: (state: Partial<Pick<AppStore, "aiReply" | "detectedIntent" | "isAILoading">>) => void;
  socketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  selectedEmailId: null,
  setSelectedEmail: (selectedEmailId) => set({ selectedEmailId }),
  filters: {},
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value || undefined } })),
  aiReply: null,
  detectedIntent: null,
  isAILoading: false,
  setAIState: (state) => set(state),
  socketConnected: false,
  setSocketConnected: (socketConnected) => set({ socketConnected }),
}));
