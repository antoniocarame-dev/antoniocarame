"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ClipboardPlus, MessageSquare } from "lucide-react";
import { cn, ESCALA, numero, objetivoTexto, partirMedida, tipoDe, unirMedida, valorMedida, type ContenidoAuditoria, type ItemAuditoria } from "@/lib/utils";
import { anotarNecesidad, guardarRespuesta } from "@/app/acciones/diagnostico";
import { subirArchivo, comprimirFoto } from "@/components/subida";

type Resp = { valor: number | null; nota: string | null; foto_path: string | null };

const colorValor = (n: number) => n <= 1 ? "border-bad bg-bad text-white" : n === 2 ? "border-accent bg-accent text-white" : "border-ok bg-ok text-white dark:text-black";
const boton = "h-10 min-w-10 rounded-sm border border-input px-2 font-mono text-sm font-bold disabled:cursor-default";

export function Checklist({ proyectoId, auditoriaId, contenido, respuestas, fotos, editable }: {
  proyectoId: string; auditoriaId: string; contenido: ContenidoAuditoria;
  respuestas: Record<string, Resp>; fotos: Record<string, string>; editable: boolean;
}) {
  const router = useRouter();
  const [r, setR] = useState(respuestas);
  const [prev, setPrev] = useState(fotos);
  const [notaAbierta, setNotaAbierta] = useState<Record<string, boolean>>({});
  const [necesidad, setNecesidad] = useState<Record<string, boolean>>({});
  const [anotadas, setAnotadas] = useState<Record<string, number>>({});
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

  const anotar = (it: ItemAuditoria, texto: string) => start(async () => {
    const res = await anotarNecesidad(proyectoId, auditoriaId, texto, it.texto);
    if (!res.ok) { setError(res.error ?? "No se pudo anotar"); return; }
    setError(null);
    setNecesidad((x) => ({ ...x, [it.id]: false }));
    setAnotadas((x) => ({ ...x, [it.id]: (x[it.id] ?? 0) + 1 }));
    router.refresh();
  });

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
                const tipo = tipoDe(it);
                const objetivo = objetivoTexto(it);
                return (
                  <li key={it.id} className="rounded-md border bg-card p-3" data-item={it.id}>
                    <p className="font-medium leading-snug">{it.texto}</p>
                    {(it.ayuda || (tipo === "medida" && objetivo)) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tipo === "medida" && objetivo && <span className="mr-2 font-semibold text-foreground">Objetivo: {objetivo}</span>}
                        {it.ayuda}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {tipo === "escala" && (
                        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={it.texto}>
                          {[0, 1, 2, 3, 4].map((n) => (
                            <button key={n} type="button" role="radio" aria-checked={v?.valor === n} disabled={!editable} title={ESCALA[n]}
                              onClick={() => guardar(it.id, { valor: v?.valor === n ? null : n })}
                              className={cn(boton, v?.valor === n && colorValor(n))}>{n}</button>
                          ))}
                          <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">{v?.valor != null ? ESCALA[v.valor] : "Sin valorar · no aplica"}</span>
                        </div>
                      )}
                      {tipo === "sino" && (
                        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={it.texto}>
                          {([[4, "Sí"], [0, "No"]] as const).map(([n, l]) => (
                            <button key={l} type="button" role="radio" aria-checked={v?.valor === n} disabled={!editable}
                              onClick={() => guardar(it.id, { valor: v?.valor === n ? null : n })}
                              className={cn(boton, "min-w-14", v?.valor === n && colorValor(n))}>{l}</button>
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">{v?.valor == null ? "Sin responder · no aplica" : ""}</span>
                        </div>
                      )}
                      {tipo === "medida" && <Medida it={it} v={v} editable={editable} guardar={(c) => guardar(it.id, c)} />}
                      {tipo === "texto" && (
                        editable
                          ? <textarea key={v?.nota ?? ""} defaultValue={v?.nota ?? ""} placeholder="Anota aquí" aria-label={it.texto}
                              className="min-h-20 w-full rounded-sm border border-input bg-card p-2 text-sm"
                              onBlur={(e) => { if ((e.target.value.trim() || null) !== (v?.nota ?? null)) guardar(it.id, { nota: e.target.value.trim() || null, valor: null }); }} />
                          : <p className="w-full whitespace-pre-line text-sm">{v?.nota ?? "—"}</p>
                      )}
                      {editable && (
                        <span className={cn("flex gap-1", tipo === "texto" ? "ml-auto" : "ml-auto")}>
                          {(tipo === "escala" || tipo === "sino") && (
                            <button type="button" onClick={() => setNotaAbierta((x) => ({ ...x, [it.id]: !x[it.id] }))} aria-label="Añadir nota" title="Nota"
                              className={cn("rounded-sm p-2 text-muted-foreground hover:bg-muted", v?.nota && "text-primary-ink")}><MessageSquare className="size-4" /></button>
                          )}
                          <button type="button" onClick={() => setNecesidad((x) => ({ ...x, [it.id]: !x[it.id] }))} aria-label="Anotar necesidad" title="Anotar necesidad"
                            className={cn("rounded-sm p-2 text-muted-foreground hover:bg-muted", anotadas[it.id] && "text-primary-ink")}><ClipboardPlus className="size-4" /></button>
                          <label className={cn("cursor-pointer rounded-sm p-2 text-muted-foreground hover:bg-muted", v?.foto_path && "text-primary-ink")} aria-label="Añadir foto" title="Foto">
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
                    {(tipo === "escala" || tipo === "sino") && (notaAbierta[it.id] || v?.nota) && (
                      editable
                        ? <textarea defaultValue={v?.nota ?? ""} placeholder="Qué has visto" aria-label="Nota"
                            className="mt-2 min-h-16 w-full rounded-sm border border-input bg-card p-2 text-sm"
                            onBlur={(e) => { if ((e.target.value || null) !== (v?.nota ?? null)) guardar(it.id, { nota: e.target.value || null }); }} />
                        : <p className="mt-2 text-sm text-muted-foreground">{v?.nota}</p>
                    )}
                    {necesidad[it.id] && (
                      <form className="mt-2 flex gap-2" onSubmit={(e) => {
                        e.preventDefault();
                        const t = String(new FormData(e.currentTarget).get("necesidad") ?? "").trim();
                        if (t) anotar(it, t);
                      }}>
                        <input name="necesidad" autoFocus placeholder="Qué necesitan (p. ej. medidor de aceite, formación en alérgenos…)" aria-label="Necesidad"
                          className="h-10 min-w-0 flex-1 rounded-sm border border-input bg-card px-2 text-sm" />
                        <button type="submit" className="h-10 rounded-sm bg-primary px-3 text-sm font-semibold text-primary-foreground">Anotar</button>
                      </form>
                    )}
                    {anotadas[it.id] ? <p className="mt-1.5 text-xs text-ok">Necesidad anotada ({anotadas[it.id]}).</p> : null}
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

function Medida({ it, v, editable, guardar }: { it: ItemAuditoria; v?: Resp; editable: boolean; guardar: (c: Partial<Resp>) => void }) {
  const { medida, comentario } = partirMedida(v?.nota);
  const val = valorMedida(it, medida);
  const cambiar = (m: number | null, c: string) => {
    const nota = unirMedida(m, c);
    if (nota !== (v?.nota ?? null)) guardar({ nota, valor: valorMedida(it, m) });
  };
  if (!editable) return (
    <p className="text-sm"><span className="tnum font-mono font-bold">{numero(medida, 2)} {it.unidad}</span>
      {comentario && <span className="ml-2 text-muted-foreground">{comentario}</span>}</p>
  );
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1">
      <label className="flex items-center gap-1.5">
        <input key={`m${v?.nota ?? ""}`} type="number" step="any" inputMode="decimal" defaultValue={medida ?? ""} aria-label={it.texto}
          className="tnum h-10 w-28 rounded-sm border border-input bg-card px-2 text-right font-mono text-sm"
          onBlur={(e) => cambiar(e.target.value === "" ? null : Number(e.target.value), comentario)} />
        <span className="text-sm text-muted-foreground">{it.unidad}</span>
      </label>
      {val != null && <span className={cn("rounded-sm px-2 py-0.5 text-xs font-semibold", val === 4 ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad")}>{val === 4 ? "En objetivo" : "Fuera de objetivo"}</span>}
      <input key={`c${v?.nota ?? ""}`} defaultValue={comentario} placeholder="Comentario" aria-label="Comentario"
        className="h-10 min-w-0 flex-1 rounded-sm border border-input bg-card px-2 text-sm"
        onBlur={(e) => cambiar(medida, e.target.value)} />
    </div>
  );
}
