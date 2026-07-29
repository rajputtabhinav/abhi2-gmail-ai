import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint: string; icon: LucideIcon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          <p className="mt-2 text-xs text-zinc-500">{hint}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
