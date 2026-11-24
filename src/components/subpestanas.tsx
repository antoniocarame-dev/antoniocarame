import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pestañas secundarias por parámetro ?v= (se pueden enlazar y recargar). */
export function SubPestanas({ base, actual, items }: { base: string; actual: string; items: [string, string, number?][] }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-1 rounded-md bg-muted p-1" aria-label="Apartados">
      {items.map(([v, l, n]) => (
        <Link key={v} href={`${base}?v=${v}`} aria-current={actual === v ? "page" : undefined}
          className={cn("rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground", actual === v && "bg-card text-foreground shadow-sm")}>
          {l}{n ? <span className="ml-1.5 rounded-full bg-primary-soft px-1.5 text-xs text-primary-ink">{n}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
