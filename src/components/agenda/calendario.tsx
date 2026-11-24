"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialog";
import { FormAccion } from "@/components/form-accion";
import { BotonAccion } from "@/components/boton-accion";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { cn, TIPOS_EVENTO, opciones } from "@/lib/utils";
import { actualizarEvento, borrarEvento, crearEvento, moverEvento } from "@/app/acciones/varios";
import type { Database } from "@/lib/supabase/database.types";

type TipoEvento = Database["public"]["Enums"]["tipo_evento"];
export type EventoCal = {
  id: string; titulo: string; tipo: TipoEvento; dia: string; diaFin: string; hIni: string; hFin: string | null;
  todo: boolean; lugar: string | null; notas: string | null; proyectoId: string | null; proyecto: string | null;
};
export type Recordatorio = { dia: string; titulo: string; href: string; clase: "plan" | "cobro" };

export const COLOR_EVENTO: Record<TipoEvento, string> = {
  visita: "bg-primary-soft text-primary-ink border-l-primary",
  auditoria: "bg-warn-soft text-warn border-l-warn",
  entrega: "bg-bad-soft text-bad border-l-bad",
  reunion: "bg-muted text-foreground border-l-muted-foreground",
  formacion: "bg-ok-soft text-ok border-l-ok",
  personal: "bg-sky-100 text-sky-900 border-l-sky-600 dark:bg-sky-950 dark:text-sky-200 dark:border-l-sky-400",
  otro: "bg-card text-foreground border-l-foreground/40 border border-dashed",
};
const PUNTO: Record<TipoEvento, string> = {
  visita: "bg-primary", auditoria: "bg-warn", entrega: "bg-bad", reunion: "bg-muted-foreground", formacion: "bg-ok", personal: "bg-sky-600", otro: "bg-foreground/40",
};
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const nombreMes = (mes: string) => mayus(new Date(mes + "-15T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
const diaLargo = (d: string) => mayus(new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));
export const sumaMes = (mes: string, n: number) => { const [y, m] = mes.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };
const enDia = (e: EventoCal, d: string) => e.dia <= d && d <= e.diaFin;
const orden = (a: EventoCal, b: EventoCal) => Number(b.todo) - Number(a.todo) || a.hIni.localeCompare(b.hIni);

export function Calendario({ mes, hoy, semanas, eventos, recordatorios, proyectos }: {
  mes: string; hoy: string; semanas: string[][]; eventos: EventoCal[]; recordatorios: Recordatorio[]; proyectos: [string, string][];
}) {
  const router = useRouter();
  const [sel, setSel] = useState(hoy.startsWith(mes) ? hoy : `${mes}-01`);
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [editar, setEditar] = useState<EventoCal | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [pend, start] = useTransition();
  const delDia = useMemo(() => (d: string) => eventos.filter((e) => enDia(e, d)).sort(orden), [eventos]);
  const recDia = (d: string) => recordatorios.filter((r) => r.dia === d);
  const ir = (m: string) => router.push(`/agenda?mes=${m}`);

  const soltar = (dia: string) => {
    const id = arrastrando; setArrastrando(null); setDestino(null);
    const e = eventos.find((x) => x.id === id);
    if (!id || !e || e.dia === dia) return;
    start(async () => { await moverEvento(id, dia); router.refresh(); });
  };

  const eventosSel = delDia(sel);
  const recSel = recDia(sel);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => ir(sumaMes(mes, -1))}><ChevronLeft /></Button>
          <h2 className="min-w-44 text-center font-mono text-lg font-bold" aria-live="polite">{nombreMes(mes)}</h2>
          <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => ir(sumaMes(mes, 1))}><ChevronRight /></Button>
          {!hoy.startsWith(mes) && <Button variant="ghost" size="sm" onClick={() => ir(hoy.slice(0, 7))}>Hoy</Button>}
          {pend && <span className="text-xs text-muted-foreground">Moviendo…</span>}
          <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">Doble clic en un día para añadir · arrastra un evento para cambiarlo de día</span>
        </div>
        <div className="overflow-hidden rounded-md border bg-card" role="grid" aria-label={`Calendario de ${nombreMes(mes)}`}>
          <div className="grid grid-cols-7 border-b bg-muted/50" role="row">
            {DIAS_SEMANA.map((d, i) => <div key={d} role="columnheader" aria-label={DIAS_LARGO[i]} className={cn("py-1.5 text-center font-mono text-[11px] font-bold uppercase text-muted-foreground", i >= 5 && "text-primary-ink")}>{d}</div>)}
          </div>
          {semanas.map((sem) => (
            <div key={sem[0]} className="grid grid-cols-7 border-b last:border-b-0" role="row">
              {sem.map((d, i) => {
                const fuera = !d.startsWith(mes);
                const lista = delDia(d); const recs = recDia(d);
                const max = 3;
                return (
                  <div key={d} role="gridcell" aria-selected={d === sel} data-dia={d} tabIndex={0}
                    onClick={() => setSel(d)} onDoubleClick={() => setNuevo(d)}
                    onKeyDown={(e) => { if (e.key === "Enter") setNuevo(d); if (e.key === " ") { e.preventDefault(); setSel(d); } }}
                    onDragOver={(e) => { if (arrastrando) { e.preventDefault(); setDestino(d); } }}
                    onDragLeave={() => setDestino((x) => (x === d ? null : x))}
                    onDrop={(e) => { e.preventDefault(); soltar(d); }}
                    className={cn("relative min-h-14 min-w-0 cursor-pointer overflow-hidden border-r p-1 text-left outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-primary sm:min-h-24 lg:min-h-28",
                      fuera && "bg-muted/40 text-muted-foreground", i >= 5 && !fuera && "bg-muted/20",
                      d === sel && "bg-primary-soft/60", destino === d && "ring-2 ring-inset ring-primary")}>
                    <span className={cn("tnum inline-flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                      d === hoy && "bg-primary text-primary-foreground")}>{Number(d.slice(8))}</span>
                    {/* Móvil: puntos */}
                    <div className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden">
                      {lista.slice(0, 4).map((e) => <span key={e.id} className={cn("size-1.5 rounded-full", PUNTO[e.tipo])} />)}
                      {recs.length > 0 && <span className="size-1.5 rounded-full border border-bad" />}
                    </div>
                    {/* Tableta y escritorio: títulos */}
                    <ul className="mt-0.5 hidden gap-0.5 sm:grid">
                      {lista.slice(0, max).map((e) => (
                        <li key={e.id}>
                          <button type="button" draggable onDragStart={(ev) => { setArrastrando(e.id); ev.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setArrastrando(null); setDestino(null); }}
                            onClick={(ev) => { ev.stopPropagation(); setSel(d); setEditar(e); }} onDoubleClick={(ev) => ev.stopPropagation()}
                            className={cn("block w-full truncate rounded-sm border-l-2 px-1 py-px text-left text-[11px] leading-tight", COLOR_EVENTO[e.tipo], arrastrando === e.id && "opacity-50")}
                            title={`${e.todo ? "Todo el día" : e.hIni} · ${e.titulo}`}>
                            {!e.todo && e.dia === d && <span className="tnum mr-1 font-mono font-semibold">{e.hIni}</span>}{e.titulo}
                          </button>
                        </li>
                      ))}
                      {lista.length > max && <li className="px-1 text-[11px] text-muted-foreground">+{lista.length - max} más</li>}
                      {recs.slice(0, lista.length >= max ? 0 : max - lista.length).map((r) => (
                        <li key={r.href + r.titulo} className="truncate px-1 text-[11px] text-bad" title={r.titulo}>⚑ {r.titulo}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {(Object.keys(TIPOS_EVENTO) as TipoEvento[]).map((t) => <span key={t} className="inline-flex items-center gap-1"><span className={cn("inline-block size-2 rounded-full", PUNTO[t])} />{TIPOS_EVENTO[t]}</span>)}
          <span className="text-bad">⚑ Plazos del plan y cobros</span>
        </p>
      </div>

      <aside className="grid content-start gap-3 xl:sticky xl:top-20" aria-label="Día seleccionado">
        <div className="rounded-md border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{diaLargo(sel)}</h3>
            <Button size="sm" onClick={() => setNuevo(sel)}><Plus />Añadir</Button>
          </div>
          {eventosSel.length === 0 && recSel.length === 0 && <p className="text-sm text-muted-foreground">Día libre.</p>}
          <ul className="grid gap-2">
            {eventosSel.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setEditar(e)} className={cn("w-full rounded-sm border-l-4 p-2 text-left hover:opacity-90", COLOR_EVENTO[e.tipo])}>
                  <p className="font-medium">{e.titulo}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs opacity-80">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" />{e.todo ? "Todo el día" : `${e.hIni}${e.hFin ? `–${e.hFin}` : ""}`}{e.dia !== e.diaFin ? ` · hasta el ${Number(e.diaFin.slice(8))}/${Number(e.diaFin.slice(5, 7))}` : ""}</span>
                    <span>{TIPOS_EVENTO[e.tipo]}</span>
                    {e.lugar && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{e.lugar}</span>}
                  </p>
                  {e.proyecto && <p className="mt-0.5 text-xs opacity-80">{e.proyecto}</p>}
                  {e.notas && <p className="mt-1 whitespace-pre-line text-xs">{e.notas}</p>}
                </button>
              </li>
            ))}
            {recSel.map((r) => (
              <li key={r.href + r.titulo} className="rounded-sm border border-dashed border-bad/50 p-2 text-sm">
                <Link href={r.href} className="hover:underline"><span className="text-bad">⚑ {r.clase === "plan" ? "Plazo del plan" : "Vence el cobro"}:</span> {r.titulo}</Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {nuevo && <FormEvento key={"n" + nuevo} dia={nuevo} proyectos={proyectos} onCerrar={() => setNuevo(null)} onOk={() => { setSel(nuevo); setNuevo(null); router.refresh(); }} />}
      {editar && <FormEvento key={"e" + editar.id} evento={editar} dia={editar.dia} proyectos={proyectos} onCerrar={() => setEditar(null)} onOk={() => { setEditar(null); router.refresh(); }} />}
    </div>
  );
}

function FormEvento({ evento, dia, proyectos, onCerrar, onOk }: {
  evento?: EventoCal; dia: string; proyectos: [string, string][]; onCerrar: () => void; onOk: () => void;
}) {
  const [todo, setTodo] = useState(evento?.todo ?? false);
  const [varios, setVarios] = useState(!!evento && evento.dia !== evento.diaFin);
  return (
    <Dialogo open onOpenChange={(v) => { if (!v) onCerrar(); }} titulo={evento ? "Editar evento" : "Nuevo evento"} ancho="max-w-2xl">
      <FormAccion action={(fd) => (evento ? actualizarEvento(evento.id, fd) : crearEvento(fd))} onOk={onOk} reset={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Qué" className="sm:col-span-2"><Input name="titulo" required autoFocus defaultValue={evento?.titulo} placeholder="Visita de seguimiento, dentista, cierre de mes…" /></Campo>
          <Campo label="Tipo"><Select name="tipo" defaultValue={evento?.tipo ?? "visita"} opciones={opciones(TIPOS_EVENTO)} /></Campo>
          <Campo label="Proyecto (opcional)"><Select name="proyecto_id" defaultValue={evento?.proyectoId ?? ""} vacio="Sin proyecto · cita libre" opciones={proyectos} /></Campo>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="todo_el_dia" checked={todo} onChange={(e) => setTodo(e.target.checked)} className="size-4" />Todo el día</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={varios} onChange={(e) => setVarios(e.target.checked)} className="size-4" />Varios días</label>
          </div>
          <Campo label={varios ? "Desde el día" : "Día"}><Input name="dia" type="date" required defaultValue={dia} /></Campo>
          {varios ? <Campo label="Hasta el día"><Input name="dia_fin" type="date" required defaultValue={evento?.diaFin ?? dia} /></Campo> : <span className="hidden sm:block" />}
          {!todo && (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <Campo label="Desde"><Input name="hora_inicio" type="time" defaultValue={evento?.hIni ?? "10:00"} /></Campo>
              <Campo label="Hasta"><Input name="hora_fin" type="time" defaultValue={evento?.hFin ?? ""} /></Campo>
            </div>
          )}
          <Campo label="Lugar" className="sm:col-span-2"><Input name="lugar" defaultValue={evento?.lugar ?? ""} /></Campo>
          <Campo label="Notas" className="sm:col-span-2"><Textarea name="notas" defaultValue={evento?.notas ?? ""} /></Campo>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {evento && <span className="mr-auto"><BotonAccion variant="ghost" confirmar="¿Borrar el evento?" accion={async () => { const r = await borrarEvento(evento.id); if (r.ok) onOk(); return r; }}>Borrar</BotonAccion></span>}
          <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit">{evento ? "Guardar" : "Añadir"}</Button>
        </div>
      </FormAccion>
    </Dialogo>
  );
}
