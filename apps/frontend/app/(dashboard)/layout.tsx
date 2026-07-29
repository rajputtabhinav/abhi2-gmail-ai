"use client";

import { useState } from "react";
import { SWRConfig } from "swr";
import { AppBackground } from "@/components/layout/AppBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { fetcher } from "@/lib/api";
import { useSession } from "@/hooks/useSession";
import { useSocket } from "@/hooks/useSocket";

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useSession();
  useSocket();

  return (
    <div className="relative min-h-screen overflow-x-hidden text-zinc-900">
      <AppBackground />
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/50" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenu={() => setSidebarOpen(true)} />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-20 md:px-8">
        <div>{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 5000 }}>
      <DashboardChrome>{children}</DashboardChrome>
    </SWRConfig>
  );
}
