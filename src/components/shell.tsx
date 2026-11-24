"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { BookOpen, Briefcase, Building2, CalendarDays, FolderKanban, LayoutDashboard, LogOut, Moon, Settings, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/negocios", label: "Negocios", icon: Building2 },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/consultora", label: "Consultora", icon: Briefcase },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Sello({ className }: { className?: string }) {
  return <span className={cn("-rotate-[4deg] rounded-md border-2 border-brand px-1.5 py-1 font-mono text-lg font-bold leading-none", className)}>AC</span>;
}

export function TemaToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const oscuro = m && resolvedTheme === "dark";
  return (
    <button onClick={() => setTheme(oscuro ? "light" : "dark")} aria-label={oscuro ? "Modo claro" : "Modo oscuro"}
      className="rounded-sm p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
      {oscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function Shell({ children, proyectos, usuario, salir }: {
  children: React.ReactNode;
  proyectos: { id: string; titulo: string; negocio: string }[];
  usuario: { nombre: string; rol: string };
  salir: () => Promise<void>;
}) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => setAbierto(false), [ruta]);
  const proyectoActual = ruta.match(/^\/proyectos\/([0-9a-f-]{36})/)?.[1] ?? "";

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: I }) => {
        const activo = ruta === href || ruta.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={activo ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              activo && "bg-sidebar-hover text-sidebar-foreground shadow-[inset_2px_0_0_var(--brand)]")}>
            <I className="size-4" />{label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[232px_1fr]">
      {/* Barra lateral (escritorio) / cajón (móvil) */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col gap-6 bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0",
        abierto ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-3">
            <Sello />
            <span>
              <span className="block font-mono text-sm font-bold">AC Consultoría</span>
              <span className="block font-mono text-[9.5px] uppercase tracking-[0.2em] text-sidebar-muted">Mejora continua</span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setAbierto(false)} aria-label="Cerrar menú"><X className="size-5" /></button>
        </div>
        {nav}
        <div className="mt-auto border-t border-sidebar-hover pt-4 text-sm">
          <p className="font-medium">{usuario.nombre}</p>
          <p className="text-xs text-sidebar-muted">{usuario.rol}</p>
          <form action={salir}>
            <button className="mt-3 flex items-center gap-2 text-xs text-sidebar-muted hover:text-sidebar-foreground"><LogOut className="size-3.5" />Cerrar sesión</button>
          </form>
        </div>
      </aside>
      {abierto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setAbierto(false)} />}

      <div className="min-w-0">
        {/* Barra superior con selector de proyecto siempre visible */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <button className="rounded-sm p-1.5 hover:bg-muted lg:hidden" onClick={() => setAbierto(true)} aria-label="Abrir menú"><Menu className="size-5" /></button>
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="eyebrow hidden sm:inline">Proyecto</span>
            <select value={proyectoActual} onChange={(e) => e.target.value && router.push(`/proyectos/${e.target.value}`)}
              className="h-9 min-w-0 max-w-md flex-1 truncate rounded-sm border border-input bg-card px-2.5 text-sm" aria-label="Ir a un proyecto">
              <option value="">Elige un proyecto…</option>
              {proyectos.map((p) => <option key={p.id} value={p.id}>{p.negocio} · {p.titulo}</option>)}
            </select>
          </label>
          <TemaToggle />
        </header>
        <main className="px-4 pb-16 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function Cabecera({ eyebrow, titulo, sub, children }: { eyebrow?: string; titulo: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-balance font-mono text-2xl font-bold tracking-tight lg:text-[28px]">{titulo}</h1>
        {sub && <div className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{sub}</div>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
