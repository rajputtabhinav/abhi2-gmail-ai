"use client";

import { Bot, Menu, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const connected = useAppStore((state) => state.socketConnected);

  return (
    <>
      <button
        onClick={onMenu}
        className="fixed left-4 top-4 z-30 rounded-lg border border-zinc-800/50 bg-zinc-900/80 p-2 text-zinc-400 backdrop-blur-sm transition-colors hover:text-zinc-200"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        {connected && (
          <span className="hidden items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 backdrop-blur-sm sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Bot size={13} className="shrink-0" />
            Agent on
          </span>
        )}
        <span className="hidden items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur-sm sm:flex">
          {connected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-zinc-500" />}
          {connected ? "Live" : "Offline"}
        </span>
      </div>
    </>
  );
}
