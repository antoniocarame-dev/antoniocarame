"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { TIPOS_ITEM, opciones, tipoDe, type ContenidoAuditoria, type TipoItem } from "@/lib/utils";

export const nuevoId = () => "i" + Math.random().toString(36).slice(2, 8);

/** Editor de secciones y puntos (auditorías, SOPs, checklists, fichas). Controlado. */
export function EditorContenido({ valor, onChange, placeholder = "Punto de control", etiquetaPunto = "Punto", tipos = false }: {
  valor: ContenidoAuditoria; onChange: (c: ContenidoAuditoria) => void; placeholder?: string; etiquetaPunto?: string;
  /** Plantillas de auditoría: cada punto con tipo de respuesta, pista y objetivo. */
  tipos?: boolean;
}) {
  const numOrNull = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));
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
              <li key={it.id} className={tipos ? "grid gap-1.5 rounded-sm border border-dashed p-2" : ""}>
                <div className="flex items-center gap-2">
                  <span className="tnum w-6 font-mono text-xs text-muted-foreground">{ii + 1}</span>
                  <Input value={it.texto} placeholder={placeholder} aria-label={etiquetaPunto}
                    onChange={(e) => set((x) => { x.secciones[si].items[ii].texto = e.target.value; })} />
                  {tipos && <Select value={tipoDe(it)} aria-label="Tipo de respuesta" className="w-40 shrink-0" opciones={opciones(TIPOS_ITEM)}
                    onChange={(e) => set((x) => { x.secciones[si].items[ii].tipo = e.target.value as TipoItem; })} />}
                  <Button variant="ghost" size="icon" aria-label="Subir" onClick={() => set((x) => mover(x.secciones[si].items, ii, -1))}><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" aria-label="Quitar" onClick={() => set((x) => { x.secciones[si].items.splice(ii, 1); })}><Trash2 /></Button>
                </div>
                {tipos && (
                  <div className="flex flex-wrap items-center gap-2 pl-8">
                    <Input value={it.ayuda ?? ""} placeholder="Qué mirar (pista para ti en el local)" aria-label="Qué mirar" className="min-w-48 flex-1 text-xs"
                      onChange={(e) => set((x) => { x.secciones[si].items[ii].ayuda = e.target.value || undefined; })} />
                    {tipoDe(it) === "medida" && (
                      <>
                        <Input value={it.unidad ?? ""} placeholder="Unidad (°C, %, min…)" aria-label="Unidad" className="w-28 text-xs"
                          onChange={(e) => set((x) => { x.secciones[si].items[ii].unidad = e.target.value || undefined; })} />
                        <Input type="number" step="any" value={it.min ?? ""} placeholder="Mínimo" aria-label="Mínimo" className="w-24 text-xs"
                          onChange={(e) => set((x) => { x.secciones[si].items[ii].min = numOrNull(e.target.value); })} />
                        <Input type="number" step="any" value={it.max ?? ""} placeholder="Máximo" aria-label="Máximo" className="w-24 text-xs"
                          onChange={(e) => set((x) => { x.secciones[si].items[ii].max = numOrNull(e.target.value); })} />
                      </>
                    )}
                  </div>
                )}
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
