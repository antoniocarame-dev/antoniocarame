"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select } from "@/components/ui/form";
import { AREAS, opciones, type ContenidoAuditoria } from "@/lib/utils";
import { guardarPlantilla, archivarPlantilla } from "@/app/acciones/diagnostico";
import type { Database } from "@/lib/supabase/database.types";

type Area = Database["public"]["Enums"]["area_auditoria"];
const nuevoId = () => "i" + Math.random().toString(36).slice(2, 8);

export function EditorPlantilla({ id, inicial }: { id: string | null; inicial: { nombre: string; area: Area | null; descripcion: string | null; contenido: ContenidoAuditoria; activa: boolean } }) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [area, setArea] = useState<Area | "">(inicial.area ?? "");
  const [desc, setDesc] = useState(inicial.descripcion ?? "");
  const [c, setC] = useState(inicial.contenido.secciones.length ? inicial.contenido : { secciones: [{ titulo: "Sección 1", items: [{ id: nuevoId(), texto: "" }] }] });
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const router = useRouter();
  const set = (f: (x: ContenidoAuditoria) => void) => setC((x) => { const y = structuredClone(x); f(y); return y; });
  const mover = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2">
        <Campo label="Nombre"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
        <Campo label="Área"><Select value={area} onChange={(e) => setArea(e.target.value as Area)} vacio="General" opciones={opciones(AREAS)} /></Campo>
        <Campo label="Descripción" className="sm:col-span-2"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Campo>
      </div>
      {c.secciones.map((s, si) => (
        <section key={si} className="rounded-md border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Input value={s.titulo} onChange={(e) => set((x) => { x.secciones[si].titulo = e.target.value; })} className="font-mono font-bold" aria-label="Título de la sección" />
            <Button variant="ghost" size="icon" aria-label="Subir sección" onClick={() => set((x) => mover(x.secciones, si, -1))}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" aria-label="Bajar sección" onClick={() => set((x) => mover(x.secciones, si, 1))}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" aria-label="Quitar sección" onClick={() => set((x) => { x.secciones.splice(si, 1); })}><Trash2 /></Button>
          </div>
          <ol className="grid gap-2">
            {s.items.map((it, ii) => (
              <li key={it.id} className="flex items-center gap-2">
                <span className="tnum w-6 font-mono text-xs text-muted-foreground">{ii + 1}</span>
                <Input value={it.texto} placeholder="Criterio observable: «Las cámaras se registran a diario»" aria-label="Punto de control"
                  onChange={(e) => set((x) => { x.secciones[si].items[ii].texto = e.target.value; })} />
                <Button variant="ghost" size="icon" aria-label="Subir" onClick={() => set((x) => mover(x.secciones[si].items, ii, -1))}><ArrowUp /></Button>
                <Button variant="ghost" size="icon" aria-label="Quitar punto" onClick={() => set((x) => { x.secciones[si].items.splice(ii, 1); })}><Trash2 /></Button>
              </li>
            ))}
          </ol>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => set((x) => { x.secciones[si].items.push({ id: nuevoId(), texto: "" }); })}><Plus />Punto</Button>
        </section>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={() => set((x) => { x.secciones.push({ titulo: "Nueva sección", items: [{ id: nuevoId(), texto: "" }] }); })}><Plus />Sección</Button>
        <div className="flex items-center gap-2">
          {msg && <span className={"text-sm " + (msg.ok ? "text-ok" : "text-bad")}>{msg.t}</span>}
          {id && <Button variant="outline" disabled={pend} onClick={() => start(async () => { await archivarPlantilla(id, !inicial.activa); router.refresh(); })}>{inicial.activa ? "Archivar" : "Reactivar"}</Button>}
          <Button disabled={pend} onClick={() => start(async () => {
            const limpio = { secciones: c.secciones.map((s) => ({ ...s, items: s.items.filter((i) => i.texto.trim()) })).filter((s) => s.items.length) };
            const r = await guardarPlantilla(id, nombre, area || null, desc || null, limpio);
            setMsg(r.ok ? { ok: true, t: "Guardada" } : { ok: false, t: r.error ?? "Error" });
            if (r.ok && !id && r.id) router.replace(`/biblioteca/${r.id}`);
          })}>Guardar plantilla</Button>
        </div>
      </div>
    </div>
  );
}
