import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 rounded-lg border border-zinc-800 bg-zinc-800/80 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-32 rounded-lg border border-zinc-800 bg-zinc-800/80 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700", props.className)} />;
}
