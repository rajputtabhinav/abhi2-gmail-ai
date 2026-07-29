import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-zinc-800/70 bg-zinc-900/90 text-zinc-100 shadow-xl shadow-black/10", className)}>
      {children}
    </section>
  );
}
