import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-zinc-100 bg-zinc-100 text-zinc-900 hover:bg-white",
        variant === "secondary" && "border-zinc-800/70 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100",
        variant === "ghost" && "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-100",
        variant === "danger" && "border-destructive bg-destructive text-white hover:bg-red-500",
        variant === "outline" && "border-zinc-700 bg-transparent text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/60",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-10 px-4",
        size === "icon" && "h-9 w-9",
        className,
      )}
      {...props}
    />
  );
}
