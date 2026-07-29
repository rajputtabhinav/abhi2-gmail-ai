import { cn } from "@/lib/utils";

export function AbhiLogo({ size = "md", showWordmark = true }: { size?: "sm" | "md" | "lg"; showWordmark?: boolean }) {
  const markSize = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "lg" ? "text-xl" : "text-sm";

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-primary/30 bg-[#f5bd18] text-[#171717] shadow-[0_0_0_1px_rgba(245,189,24,0.12),0_10px_30px_rgba(245,189,24,0.18)]",
          markSize,
        )}
        aria-hidden="true"
      >
        <span className="font-mono text-[0.95rem] font-black leading-none tracking-normal">A2</span>
        <span className="absolute bottom-0 left-0 h-[3px] w-full bg-[#171717]/25" />
      </span>
      {showWordmark && <span className={cn("font-semibold tracking-tight text-current", textSize)}>Abhi2.0</span>}
    </span>
  );
}
