"use client";
import { useState, useTransition } from "react";
import { Camera, Check, MessageSquare } from "lucide-react";
import { cn, ESCALA, type ContenidoAuditoria } from "@/lib/utils";
import { guardarRespuesta } from "@/app/acciones/diagnostico";
import { subirArchivo, comprimirFoto } from "@/components/subida";

type Resp = { valor: number | null; nota: string | null; foto_path: string | null };

export function Checklist({ proyectoId, auditoriaId, contenido, respuestas, fotos, editable }: {
  proyectoId: string; auditoriaId: string; contenido: ContenidoAuditoria;
  respuestas: Record<string, Resp>; fotos: Record<string, string>; editable: boolean;
}) {
  const [r, setR] = useState(respuestas);
  const [prev, setPrev] = useState(fotos);
  const [notaAbierta, setNotaAbierta] = useState<Record<string, boolean>>({});
  const [guardando, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const total = contenido.secciones.reduce((s, x) => s + x.items.length, 0);
  const hechas = Object.values(r).filter((x) => x.valor != null || x.nota).length;

  const guardar = (item: string, cambios: Partial<Resp>) => {
    setR((x) => ({ ...x, [item]: { ...(x[item] ?? { valor: null, nota: null, foto_path: null }), ...cambios } }));
    start(async () => {
      const res = await guardarRespuesta(proyectoId, auditoriaId, item, cambios);
      setError(res.ok ? null : res.error ?? "Error al guardar");
    });
  };

  return (
    <div>
      <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand transition-all" style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} /></div>
        <span className="tnum text-xs text-muted-foreground">{hechas}/{total} · {guardando ? "Guardando…" : error ? <span className="text-bad">{error}</span> : "Guardado"}</span>
      </div>
      <div className="grid gap-5">
        {contenido.secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="eyebrow mb-2">{s.titulo}</h2>
            <ol className="grid gap-2">
              {s.items.map((it) => {
                const v = r[it.id];
                return (
                  <li key={it.id} className="rounded-md border bg-card p-3">
                    <p className="mb-2.5 font-medium leading-snug">{it.texto}</p>
                    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={it.texto}>
                      {[0, 1, 2, 3, 4].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={v?.valor === n} disabled={!editable} title={ESCALA[n]}
                          onClick={() => guardar(it.id, { valor: v?.valor === n ? null : n })}
                          className={cn("h-10 min-w-10 rounded-sm border border-input px-2 font-mono text-sm font-bold disabled:cursor-default",
                            v?.valor === n && (n <= 1 ? "border-bad bg-bad text-white" : n === 2 ? "border-accent bg-accent text-white" : "border-ok bg-ok text-white dark:text-black"))}>
                          {n}
                        </button>
                      ))}
                      <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">{v?.valor != null ? ESCALA[v.valor] : "Sin valorar · no aplica"}</span>
                      {editable && (
                        <span className="ml-auto flex gap-1">
                          <button type="button" onClick={() => setNotaAbierta((x) => ({ ...x, [it.id]: !x[it.id] }))} aria-label="Añadir nota"
                            className={cn("rounded-sm p-2 text-muted-foreground hover:bg-muted", v?.nota && "text-primary-ink")}><MessageSquare className="size-4" /></button>
                          <label className={cn("cursor-pointer rounded-sm p-2 text-muted-foreground hover:bg-muted", v?.foto_path && "text-primary-ink")} aria-label="Añadir foto">
                            <Camera className="size-4" />
                            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
                              const f = e.target.files?.[0]; if (!f) return;
                              try {
                                const c = await comprimirFoto(f);
                                const ruta = await subirArchivo(`proyectos/${proyectoId}/auditorias/${auditoriaId}`, c);
                                setPrev((x) => ({ ...x, [ruta]: URL.createObjectURL(c) }));
                                guardar(it.id, { foto_path: ruta });
                              } catch (er) { setError((er as Error).message); }
                              e.target.value = "";
                            }} />
                          </label>
                        </span>
                      )}
                    </div>
                    {(notaAbierta[it.id] || v?.nota) && (
                      editable
                        ? <textarea defaultValue={v?.nota ?? ""} placeholder="Qué has visto" aria-label="Nota"
                            className="mt-2 min-h-16 w-full rounded-sm border border-input bg-card p-2 text-sm"
                            onBlur={(e) => { if ((e.target.value || null) !== (v?.nota ?? null)) guardar(it.id, { nota: e.target.value || null }); }} />
                        : <p className="mt-2 text-sm text-muted-foreground">{v?.nota}</p>
                    )}
                    {v?.foto_path && prev[v.foto_path] && <img src={prev[v.foto_path]} alt="" className="mt-2 h-28 rounded-sm object-cover" />}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      {hechas === total && total > 0 && <p className="mt-4 flex items-center gap-2 text-sm text-ok"><Check className="size-4" />Todos los puntos revisados.</p>}
    </div>
  );
}
