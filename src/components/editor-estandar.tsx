"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select } from "@/components/ui/form";
import { EditorContenido, limpiarContenido } from "@/components/editor-contenido";
import { AREAS, opciones } from "@/lib/utils";
import { guardarEstandar, borrarEstandar, estandarABiblioteca, type EstandarForm } from "@/app/acciones/estandares";

export function EditorEstandar({ proyectoId, id, inicial, version, volver, contactos }: {
  proyectoId: string; id: string; inicial: EstandarForm; version: number; volver: string; contactos: string[];
}) {
  const router = useRouter();
  const [e, setE] = useState(inicial);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [borrar, setBorrar] = useState(false);
  const guardar = (nuevaVersion: boolean) => start(async () => {
    const r = await guardarEstandar(proyectoId, id, { ...e, contenido: limpiarContenido(e.contenido) }, nuevaVersion);
    setMsg(r.ok ? { ok: true, t: nuevaVersion ? `Guardada como versión ${version + 1}` : "Guardado" } : { ok: false, t: r.error ?? "Error" });
    router.refresh();
  });
  return (
    <div className="grid max-w-4xl gap-4">
      <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Título" className="sm:col-span-2"><Input value={e.titulo} onChange={(x) => setE({ ...e, titulo: x.target.value })} /></Campo>
        <Campo label="Tipo"><Select value={e.tipo} onChange={(x) => setE({ ...e, tipo: x.target.value as EstandarForm["tipo"] })} opciones={[["sop", "Procedimiento (SOP)"], ["checklist", "Checklist"], ["ficha", "Ficha técnica / de producción"], ["manual", "Manual"]]} /></Campo>
        <Campo label="Área"><Select value={e.area ?? ""} onChange={(x) => setE({ ...e, area: (x.target.value || null) as EstandarForm["area"] })} vacio="General" opciones={opciones(AREAS)} /></Campo>
        <Campo label="Estado"><Select value={e.estado} onChange={(x) => setE({ ...e, estado: x.target.value as EstandarForm["estado"] })} opciones={[["borrador", "Borrador"], ["en_prueba", "En prueba en el local"], ["implantado", "Implantado"]]} /></Campo>
        <Campo label="Responsable en el local">
          <Input list="contactos-estandar" value={e.responsable_externo ?? ""} onChange={(x) => setE({ ...e, responsable_externo: x.target.value || null })} />
          <datalist id="contactos-estandar">{contactos.map((c) => <option key={c} value={c} />)}</datalist>
        </Campo>
        <Campo label="Implantado el"><Input type="date" value={e.fecha_implantacion ?? ""} onChange={(x) => setE({ ...e, fecha_implantacion: x.target.value || null })} /></Campo>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={e.visible_cliente} onChange={(x) => setE({ ...e, visible_cliente: x.target.checked })} className="size-4" />Incluir en los informes</label>
      </div>
      <EditorContenido valor={e.contenido} onChange={(c) => setE({ ...e, contenido: c })}
        etiquetaPunto={e.tipo === "sop" ? "Paso" : "Punto"} placeholder={e.tipo === "sop" ? "Qué se hace, cómo y con qué estándar" : e.tipo === "checklist" ? "Lo que se marca hecho o no hecho" : "Dato o instrucción"} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <div className="flex gap-2">
          <Button variant="destructive" disabled={pend} onClick={() => { if (!borrar) { setBorrar(true); setTimeout(() => setBorrar(false), 4000); return; } start(async () => { const r = await borrarEstandar(proyectoId, id); if (r.ok) router.push(volver); }); }}>{borrar ? "Pulsa otra vez" : "Borrar"}</Button>
          <Button variant="outline" disabled={pend} onClick={() => start(async () => { const r = await estandarABiblioteca(id); setMsg(r.ok ? { ok: true, t: "Copiado a la biblioteca" } : { ok: false, t: r.error ?? "Error" }); })}>Guardar en la biblioteca</Button>
          <Button asChild variant="outline"><a href={`/imprimir/estandar/${id}`} target="_blank" rel="noreferrer">Hoja para imprimir</a></Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className={"text-sm " + (msg.ok ? "text-ok" : "text-bad")}>{msg.t}</span>}
          <Button variant="outline" disabled={pend} onClick={() => guardar(true)}>Nueva versión (v{version + 1})</Button>
          <Button disabled={pend} onClick={() => guardar(false)}>Guardar</Button>
        </div>
      </div>
    </div>
  );
}
