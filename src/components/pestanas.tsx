"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Pestanas({ base, items }: { base: string; items: { href: string; label: string; fase?: string }[] }) {
  const ruta = usePathname();
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 lg:mx-0 lg:px-0" aria-label="Secciones del proyecto">
      {items.map((it) => {
        const href = base + it.href;
        const activo = it.href === "" ? ruta === base : ruta.startsWith(href);
        return (
          <Link key={it.href} href={href} aria-current={activo ? "page" : undefined}
            className={cn("-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
              activo && "border-brand text-foreground")}>
            {it.label}{it.fase && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase">{it.fase}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
