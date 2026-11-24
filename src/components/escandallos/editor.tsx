"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { cn, eur, numero } from "@/lib/utils";
import { precioNeto } from "@/lib/costes";
import { guardarEscandallo, borrarEscandallo, type EscandalloForm, type IngredienteForm } from "@/app/acciones/costes";

type Prod = { id: string; nombre: string; unidad: string; precio: number | null; merma: number; alergenos: string[] };
type Elab = { id: string; nombre: string; unidad: string; costePorUnidad: number; alergenos: string[] };

export function EditorEscandallo({ id, negocioId, inicial, ingredientes, productos, elaboraciones, objetivo, volver, usadoEn }: {
  id: string | null; negocioId: string; inicial: EscandalloForm; ingredientes: IngredienteForm[];
  productos: Prod[]; elaboraciones: Elab[]; objetivo: number; volver: string; usadoEn: string[];
}) {
  const router = useRouter();
  const [e, setE] = useState(inicial);
  const [ings, setIngs] = useState<IngredienteForm[]>(ingredientes.length ? ingredientes : [{ producto_id: null, sub_escandallo_id: null, cantidad: 0, merma_pct: null }]);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [borrar, setBorrar] = useState(false);
  const esPlato = e.tipo === "plato";
  const nm = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

  const calc = useMemo(() => {
    const al = new Set<string>(); const sinPrecio: string[] = [];
    const lineas = ings.map((i) => {
      if (i.producto_id) {
        const p = productos.find((x) => x.id === i.producto_id);
        if (!p) return null;
        const merma = i.merma_pct ?? p.merma;
        p.alergenos.forEach((a) => al.add(a));
        if (p.precio == null) sinPrecio.push(p.nombre);
        return { unidad: p.unidad, precio: p.precio ?? 0, merma, coste: i.cantidad * precioNeto(p.precio ?? 0, merma) };
      }
      if (i.sub_escandallo_id) {
        const s = elaboraciones.find((x) => x.id === i.sub_escandallo_id);
        if (!s) return null;
        s.alergenos.forEach((a) => al.add(a));
        return { unidad: s.unidad, precio: s.costePorUnidad, merma: 0, coste: i.cantidad * s.costePorUnidad };
      }
      return null;
    });
    const total = lineas.reduce((s, l) => s + (l?.coste ?? 0), 0);
    const racion = total / (e.raciones || 1);
    const neto = e.pvp ? e.pvp / (1 + e.iva_pct / 100) : null;
    return { lineas, total, racion, neto, fc: neto ? racion / neto : null, margen: neto != null ? neto - racion : null,
      pvpRec: objetivo ? (racion / objetivo) * (1 + e.iva_pct / 100) : null, porUnidad: e.rendimiento ? total / e.rendimiento : null,
      alergenos: [...al].sort(), sinPrecio };
  }, [ings, e, productos, elaboraciones, objetivo]);

  const set = (i: number, c: Partial<IngredienteForm>) => setIngs((x) => x.map((l, j) => (j === i ? { ...l, ...c } : l)));
  const fcTono = calc.fc == null ? "neutro" : calc.fc <= objetivo ? "ok" : calc.fc <= objetivo + 0.05 ? "warn" : "bad";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 content-start gap-4">
        <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label={esPlato ? "Plato" : "Elaboración"} className="sm:col-span-2"><Input value={e.nombre} onChange={(x) => setE({ ...e, nombre: x.target.value })} required /></Campo>
          <Campo label="Tipo"><Select value={e.tipo} onChange={(x) => setE({ ...e, tipo: x.target.value as EscandalloForm["tipo"] })} opciones={[["plato", "Plato de carta"], ["elaboracion", "Elaboración (base)"]]} /></Campo>
          <Campo label="Categoría"><Input value={e.categoria ?? ""} onChange={(x) => setE({ ...e, categoria: x.target.value || null })} placeholder={esPlato ? "Fritos, Postres…" : "Fondos, Salsas…"} /></Campo>
          {esPlato ? <>
            <Campo label="Raciones que salen"><Input type="number" min="1" step="1" value={e.raciones} onChange={(x) => setE({ ...e, raciones: nm(x.target.value) ?? 1 })} /></Campo>
            <Campo label="PVP con IVA (€)"><Input type="number" step="0.10" min="0" value={e.pvp ?? ""} onChange={(x) => setE({ ...e, pvp: nm(x.target.value) })} /></Campo>
            <Campo label="IVA"><Select value={String(e.iva_pct)} onChange={(x) => setE({ ...e, iva_pct: Number(x.target.value) })} opciones={[["10", "10 % hostelería"], ["21", "21 %"], ["4", "4 %"]]} /></Campo>
          </> : <>
            <Campo label="Rinde"><Input type="number" step="0.001" min="0" value={e.rendimiento ?? ""} onChange={(x) => setE({ ...e, rendimiento: nm(x.target.value) })} /></Campo>
            <Campo label="Unidad del rendimiento"><Select value={e.unidad_rendimiento ?? "kg"} onChange={(x) => setE({ ...e, unidad_rendimiento: x.target.value as "kg" })} opciones={[["kg", "kg"], ["l", "litros"], ["ud", "unidades"]]} /></Campo>
          </>}
        </div>

        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Ingrediente</th><th className="w-28 px-2 text-right">Cantidad bruta</th><th className="w-12 px-1">Ud.</th><th className="w-24 px-2 text-right">Merma %</th><th className="w-28 px-2 text-right">Precio</th><th className="w-24 px-2 text-right">Coste</th><th className="w-10" />
            </tr></thead>
            <tbody>
              {ings.map((i, n) => {
                const l = calc.lineas[n];
                const valor = i.producto_id ? `p:${i.producto_id}` : i.sub_escandallo_id ? `e:${i.sub_escandallo_id}` : "";
                return (
                  <tr key={n} className="border-b last:border-0">
                    <td className="px-3 py-1.5">
                      <select aria-label="Ingrediente" value={valor} className="h-9 w-full min-w-52 rounded-sm border border-input bg-card px-2"
                        onChange={(x) => { const v = x.target.value; set(n, v.startsWith("p:") ? { producto_id: v.slice(2), sub_escandallo_id: null, merma_pct: null } : v.startsWith("e:") ? { producto_id: null, sub_escandallo_id: v.slice(2), merma_pct: null } : { producto_id: null, sub_escandallo_id: null }); }}>
                        <option value="">Elige producto o elaboración</option>
                        {elaboraciones.length > 0 && <optgroup label="Elaboraciones">{elaboraciones.map((s) => <option key={s.id} value={`e:${s.id}`}>{s.nombre}</option>)}</optgroup>}
                        <optgroup label="Productos">{productos.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.nombre}{p.precio == null ? " (sin precio)" : ""}</option>)}</optgroup>
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><Input type="number" step="0.001" min="0" value={i.cantidad || ""} onChange={(x) => set(n, { cantidad: nm(x.target.value) ?? 0 })} className="text-right" aria-label="Cantidad" /></td>
                    <td className="px-1 text-muted-foreground">{l?.unidad ?? ""}</td>
                    <td className="px-2 py-1.5">{i.producto_id ? <Input type="number" step="0.5" min="0" max="95" value={i.merma_pct ?? l?.merma ?? 0} onChange={(x) => set(n, { merma_pct: nm(x.target.value) })} className="text-right" aria-label="Merma" /> : <span className="block text-right text-muted-foreground">—</span>}</td>
                    <td className="tnum px-2 text-right text-muted-foreground">{l ? `${eur(l.precio, 2)}/${l.unidad}` : ""}</td>
                    <td className="tnum px-2 text-right font-medium">{l ? eur(l.coste, 3) : ""}</td>
                    <td><Button variant="ghost" size="icon" aria-label="Quitar ingrediente" onClick={() => setIngs((x) => x.filter((_, j) => j !== n))}><Trash2 /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-3 py-2">
            <Button variant="outline" size="sm" onClick={() => setIngs((x) => [...x, { producto_id: null, sub_escandallo_id: null, cantidad: 0, merma_pct: null }])}><Plus />Ingrediente</Button>
            <p className="text-xs text-muted-foreground">Cantidad bruta, tal como sale del almacén. La merma la aplica el cálculo.</p>
          </div>
        </div>
        <Campo label="Elaboración, emplatado y puntos críticos"><Textarea value={e.elaboracion ?? ""} onChange={(x) => setE({ ...e, elaboracion: x.target.value || null })} className="min-h-28" /></Campo>
      </div>

      <aside className="ticket-edge grid content-start gap-3 self-start rounded-sm border bg-card p-4 lg:sticky lg:top-20">
        <p className="eyebrow">Escandallo</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Coste total</dt><dd className="tnum text-right">{eur(calc.total, 2)}</dd>
          {esPlato ? <>
            <dt className="text-muted-foreground">Coste por ración</dt><dd className="tnum text-right font-mono text-lg font-bold">{eur(calc.racion, 2)}</dd>
            <dt className="text-muted-foreground">PVP sin IVA</dt><dd className="tnum text-right">{calc.neto != null ? eur(calc.neto, 2) : "—"}</dd>
            <dt className="text-muted-foreground">Food cost</dt><dd className="text-right"><Badge tono={fcTono}>{calc.fc != null ? `${numero(calc.fc * 100, 1)} %` : "—"}</Badge></dd>
            <dt className="text-muted-foreground">Margen bruto</dt><dd className="tnum text-right font-semibold">{calc.margen != null ? eur(calc.margen, 2) : "—"}</dd>
          </> : <>
            <dt className="text-muted-foreground">Coste por {e.unidad_rendimiento ?? "unidad"}</dt><dd className="tnum text-right font-mono text-lg font-bold">{calc.porUnidad != null ? eur(calc.porUnidad, 2) : "—"}</dd>
          </>}
        </dl>
        {esPlato && calc.pvpRec != null && (
          <div className={cn("rounded-sm p-3 text-sm", e.pvp && calc.pvpRec > e.pvp ? "bg-bad-soft text-bad" : "bg-muted")}>
            PVP recomendado para un food cost del {numero(objetivo * 100, 0)} %: <b className="tnum">{eur(calc.pvpRec, 2)}</b> con IVA
          </div>
        )}
        <div className="border-t border-dashed pt-3 text-sm"><p className="eyebrow mb-1">Alérgenos</p>{calc.alergenos.join(", ") || <span className="text-muted-foreground">Ninguno declarado en los productos</span>}</div>
        {calc.sinPrecio.length > 0 && <p className="rounded-sm bg-warn-soft p-2 text-xs text-warn">Sin precio de compra: {calc.sinPrecio.join(", ")}. El coste sale más bajo de lo real.</p>}
        {usadoEn.length > 0 && <p className="text-xs text-muted-foreground">Se usa en: {usadoEn.join(", ")}</p>}
        <div className="grid gap-2 border-t pt-3">
          {msg && <p className={cn("text-sm", msg.ok ? "text-ok" : "text-bad")}>{msg.t}</p>}
          <Button disabled={pend} onClick={() => start(async () => {
            const r = await guardarEscandallo(negocioId, id, e, ings);
            if (!r.ok) return setMsg({ ok: false, t: r.error ?? "Error" });
            setMsg({ ok: true, t: "Guardado" });
            if (!id && r.id) router.replace(`${volver.split("?")[0]}/${r.id}`); else router.refresh();
          })}>Guardar escandallo</Button>
          {id && <Button variant="destructive" disabled={pend} onClick={() => {
            if (!borrar) { setBorrar(true); setTimeout(() => setBorrar(false), 4000); return; }
            start(async () => { const r = await borrarEscandallo(id); if (r.ok) router.push(volver); else setMsg({ ok: false, t: r.error ?? "Error" }); });
          }}>{borrar ? "Pulsa otra vez para borrar" : "Borrar"}</Button>}
        </div>
      </aside>
    </div>
  );
}
