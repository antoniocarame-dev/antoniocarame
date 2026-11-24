"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { cn, eur } from "@/lib/utils";
import { guardarPresupuesto, type PresupuestoForm } from "@/app/acciones/consultora";

export function EditorPresupuesto({ id, inicial, negocios, proyectos, tarifa }: {
  id: string; inicial: PresupuestoForm; negocios: [string, string][]; proyectos: [string, string][]; tarifa: number;
}) {
  const router = useRouter();
  const [p, setP] = useState(inicial);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const base = p.conceptos.reduce((s, c) => s + c.cantidad * c.precio, 0);
  const setC = (i: number, c: Partial<PresupuestoForm["conceptos"][number]>) => setP({ ...p, conceptos: p.conceptos.map((x, j) => (j === i ? { ...x, ...c } : x)) });
  const nm = (v: string) => Number(v.replace(",", ".")) || 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Título" className="sm:col-span-2"><Input value={p.titulo} onChange={(e) => setP({ ...p, titulo: e.target.value })} /></Campo>
        <Campo label="Cliente"><Select value={p.negocio_id} onChange={(e) => setP({ ...p, negocio_id: e.target.value })} opciones={negocios} /></Campo>
        <Campo label="Proyecto"><Select value={p.proyecto_id ?? ""} onChange={(e) => setP({ ...p, proyecto_id: e.target.value || null })} vacio="Aún sin proyecto" opciones={proyectos} /></Campo>
        <Campo label="Fecha"><Input type="date" value={p.fecha} onChange={(e) => setP({ ...p, fecha: e.target.value })} /></Campo>
        <Campo label="Validez (días)"><Input type="number" min="1" value={p.validez_dias} onChange={(e) => setP({ ...p, validez_dias: nm(e.target.value) })} /></Campo>
        <Campo label="IVA (%)"><Input type="number" value={p.iva_pct} onChange={(e) => setP({ ...p, iva_pct: nm(e.target.value) })} /></Campo>
        <Campo label="Introducción" className="sm:col-span-2 lg:col-span-4" ayuda="Qué has visto y qué propones, en el tono del cliente"><Textarea value={p.introduccion ?? ""} onChange={(e) => setP({ ...p, introduccion: e.target.value || null })} /></Campo>
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-3 py-2">Concepto</th><th className="w-24 px-2 text-right">Cantidad</th><th className="w-28 px-2">Unidad</th><th className="w-28 px-2 text-right">Precio</th><th className="w-28 px-2 text-right">Importe</th><th className="w-10" /></tr></thead>
          <tbody>
            {p.conceptos.map((c, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-1.5"><Input value={c.descripcion} onChange={(e) => setC(i, { descripcion: e.target.value })} aria-label="Concepto" /></td>
                <td className="px-2"><Input type="number" step="0.5" value={c.cantidad} onChange={(e) => setC(i, { cantidad: nm(e.target.value) })} className="text-right" aria-label="Cantidad" /></td>
                <td className="px-2"><Input value={c.unidad ?? ""} onChange={(e) => setC(i, { unidad: e.target.value })} aria-label="Unidad" placeholder="servicio, sesión, mes" /></td>
                <td className="px-2"><Input type="number" step="1" value={c.precio} onChange={(e) => setC(i, { precio: nm(e.target.value) })} className="text-right" aria-label="Precio" /></td>
                <td className="tnum px-2 text-right">{eur(c.cantidad * c.precio, 2)}</td>
                <td><Button variant="ghost" size="icon" aria-label="Quitar" onClick={() => setP({ ...p, conceptos: p.conceptos.filter((_, j) => j !== i) })}><Trash2 /></Button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td className="px-3 py-2" colSpan={3}><Button variant="outline" size="sm" onClick={() => setP({ ...p, conceptos: [...p.conceptos, { descripcion: "", cantidad: 1, unidad: "servicio", precio: 0 }] })}><Plus />Concepto</Button></td>
              <td className="px-2 text-right text-muted-foreground">Base</td><td className="tnum px-2 text-right font-semibold">{eur(base, 2)}</td><td /></tr>
            <tr className="text-muted-foreground"><td colSpan={3} className="px-3 pb-2 text-xs">{tarifa ? `Equivale a ${(base / tarifa).toLocaleString("es-ES", { maximumFractionDigits: 0 })} h a tu tarifa de ${eur(tarifa)}/h` : ""}</td><td className="px-2 text-right">Total con IVA</td><td className="tnum px-2 text-right">{eur(base * (1 + p.iva_pct / 100), 2)}</td><td /></tr>
          </tfoot>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Condiciones de pago"><Textarea value={p.condiciones ?? ""} onChange={(e) => setP({ ...p, condiciones: e.target.value || null })} /></Campo>
        <Campo label="Notas internas (no salen en el PDF)"><Textarea value={p.notas ?? ""} onChange={(e) => setP({ ...p, notas: e.target.value || null })} /></Campo>
      </div>
      <div className="flex items-center justify-end gap-2">
        {msg && <span className={cn("text-sm", msg.ok ? "text-ok" : "text-bad")}>{msg.t}</span>}
        <Button disabled={pend} onClick={() => start(async () => { const r = await guardarPresupuesto(id, p); setMsg(r.ok ? { ok: true, t: "Guardado" } : { ok: false, t: r.error ?? "Error" }); router.refresh(); })}>Guardar</Button>
      </div>
    </div>
  );
}
