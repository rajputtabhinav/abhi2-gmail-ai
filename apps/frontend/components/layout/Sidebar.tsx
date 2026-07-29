"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, Settings, Sparkles, Users, X } from "lucide-react";
import { AbhiLogo } from "@/components/layout/AbhiLogo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/ai", label: "AI Lab", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-800/50 bg-zinc-900 transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between px-4 py-5 text-zinc-100">
        <AbhiLogo size="sm" />
        <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800/40 hover:text-zinc-200",
                active && "bg-zinc-800/80 font-medium text-zinc-100",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/80 p-3.5 text-xs text-zinc-500">
          <p className="mb-2 text-sm font-medium text-zinc-100">Client workspace</p>
          <p className="leading-relaxed">Gmail sync, AI drafts, and scheduled follow-ups in one focused flow.</p>
        </div>
      </div>
      <div className="border-t border-zinc-800/50 px-4 pb-5 pt-3">
        <p className="text-[11px] text-zinc-600">Local-first Abhi2.0</p>
        <p className="mt-1.5 text-[10px] text-zinc-700">(c) {new Date().getFullYear()} Abhi2.0</p>
      </div>
    </aside>
  );
}
