"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import type { ContenidoAuditoria } from "@/lib/utils";

export const nuevoId = () => "i" + Math.random().toString(36).slice(2, 8);

/** Editor de secciones y puntos (auditorías, SOPs, checklists, fichas). Controlado. */
export function EditorContenido({ valor, onChange, placeholder = "Punto de control", etiquetaPunto = "Punto" }: {
  valor: ContenidoAuditoria; onChange: (c: ContenidoAuditoria) => void; placeholder?: string; etiquetaPunto?: string;
}) {
  const set = (f: (x: ContenidoAuditoria) => void) => { const y = structuredClone(valor); f(y); onChange(y); };
  const mover = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  return (
    <div className="grid gap-4">
      {valor.secciones.map((s, si) => (
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
                <Input value={it.texto} placeholder={placeholder} aria-label={etiquetaPunto}
                  onChange={(e) => set((x) => { x.secciones[si].items[ii].texto = e.target.value; })} />
                <Button variant="ghost" size="icon" aria-label="Subir" onClick={() => set((x) => mover(x.secciones[si].items, ii, -1))}><ArrowUp /></Button>
                <Button variant="ghost" size="icon" aria-label="Quitar" onClick={() => set((x) => { x.secciones[si].items.splice(ii, 1); })}><Trash2 /></Button>
              </li>
            ))}
          </ol>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => set((x) => { x.secciones[si].items.push({ id: nuevoId(), texto: "" }); })}><Plus />{etiquetaPunto}</Button>
        </section>
      ))}
      <div><Button variant="outline" onClick={() => set((x) => { x.secciones.push({ titulo: "Nueva sección", items: [{ id: nuevoId(), texto: "" }] }); })}><Plus />Sección</Button></div>
    </div>
  );
}

export const limpiarContenido = (c: ContenidoAuditoria): ContenidoAuditoria =>
  ({ secciones: c.secciones.map((s) => ({ ...s, items: s.items.filter((i) => i.texto.trim()) })).filter((s) => s.items.length) });
