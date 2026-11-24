import { Badge, type Tono } from "@/components/ui/badge";
import { cn, SALUD, ESTADOS_PROYECTO, ESTADOS_TAREA, PRIORIDAD } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

export function Kpi({ label, valor, ayuda, tono }: { label: string; valor: React.ReactNode; ayuda?: React.ReactNode; tono?: Tono }) {
  return (
    <div className="rounded-md border bg-card px-4 py-3.5">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("tnum mt-1 font-mono text-2xl font-bold", tono === "bad" && "text-bad", tono === "warn" && "text-warn", tono === "ok" && "text-ok")}>{valor}</p>
      {ayuda && <div className="text-[12.5px] text-muted-foreground">{ayuda}</div>}
    </div>
  );
}

const tonoSalud: Record<E["salud_proyecto"], Tono> = { verde: "ok", ambar: "warn", rojo: "bad" };
export function Semaforo({ salud, texto = true }: { salud: E["salud_proyecto"]; texto?: boolean }) {
  const color = { verde: "bg-ok", ambar: "bg-accent", rojo: "bg-bad" }[salud];
  return texto
    ? <Badge tono={tonoSalud[salud]}><span className={cn("size-2 rounded-full", color)} />{SALUD[salud]}</Badge>
    : <span className={cn("inline-block size-2.5 rounded-full", color)} title={SALUD[salud]} />;
}
export const EstadoProyecto = ({ estado }: { estado: E["estado_proyecto"] }) =>
  <Badge tono={estado === "en_curso" ? "primary" : estado === "cerrado" ? "neutro" : estado === "diagnostico" ? "warn" : "ok"}>{ESTADOS_PROYECTO[estado]}</Badge>;
export const EstadoTarea = ({ estado }: { estado: E["estado_tarea"] }) =>
  <Badge tono={estado === "hecha" ? "ok" : estado === "bloqueada" ? "bad" : estado === "en_curso" ? "primary" : "neutro"}>{ESTADOS_TAREA[estado]}</Badge>;
export const Prioridad = ({ p }: { p: E["prioridad"] }) =>
  <Badge tono={p === "alta" ? "bad" : p === "media" ? "warn" : "neutro"}>{PRIORIDAD[p]}</Badge>;

export function Progreso({ hechas, total }: { hechas: number; total: number }) {
  const pct = total ? Math.round((hechas / total) * 100) : 0;
  return (
    <div className="min-w-24">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
      <p className="tnum mt-1 text-xs text-muted-foreground">{hechas}/{total} tareas</p>
    </div>
  );
}

export function Puntuacion({ v }: { v: number | null }) {
  if (v == null) return <Badge>Sin puntuar</Badge>;
  return <Badge tono={v >= 75 ? "ok" : v >= 50 ? "warn" : "bad"}>{v.toLocaleString("es-ES", { maximumFractionDigits: 0 })}/100</Badge>;
}
