import { cn } from "@/lib/utils";

const tonos = {
  neutro: "bg-muted text-muted-foreground",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  primary: "bg-primary-soft text-primary-ink",
} as const;
export type Tono = keyof typeof tonos;

export function Badge({ tono = "neutro", className, children }: { tono?: Tono; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", tonos[tono], className)}>{children}</span>;
}
