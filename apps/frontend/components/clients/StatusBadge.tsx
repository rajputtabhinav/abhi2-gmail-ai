import type { LeadStatus } from "@abhi2/shared";
import { Badge } from "@/components/ui/badge";

const styles: Record<LeadStatus, string> = {
  hot: "border-red-500/40 bg-red-500/10 text-red-200",
  warm: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  cold: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  closed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  lost: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge className={styles[status]}>{status.replace("_", " ")}</Badge>;
}
