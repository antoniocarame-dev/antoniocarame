"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { cn, eur } from "@/lib/utils";
import { guardarFactura, crearProductoRapido, borrarFactura, type CabeceraForm, type LineaForm } from "@/app/acciones/costes";

type Prod = { id: string; nombre: string; unidad: string; precio_actual: number | null };

export function RevisarFactura({ facturaId, negocioId, volver, cabecera, lineas: iniciales, productos: prodIni, proveedores, validada }: {
  facturaId: string; negocioId: string; volver: string; cabecera: CabeceraForm; lineas: LineaForm[];
  productos: Prod[]; proveedores: { id: string; nombre: string }[]; validada: boolean;
}) {
  const router = useRouter();
  const [cab, setCab] = useState(cabecera);
  const [lineas, setLineas] = useState<LineaForm[]>(iniciales.length ? iniciales : [{ producto_id: null, descripcion: "", cantidad: 1, unidad: "kg", precio_unitario: 0, descuento_pct: 0, iva_pct: 10 }]);
  const [productos, setProductos] = useState(prodIni);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [borrar, setBorrar] = useState(false);

  const suma = useMemo(() => lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0), [lineas]);
  const descuadre = cab.base != null && Math.abs(suma - cab.base) > 0.05;
  const sinProducto = lineas.filter((l) => l.descripcion.trim() && !l.producto_id).length;
  const set = (i: number, c: Partial<LineaForm>) => setLineas((x) => x.map((l, j) => (j === i ? { ...l, ...c } : l)));
  const nm = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

  const guardar = (validar: boolean) => start(async () => {
    const r = await guardarFactura(facturaId, cab, lineas, validar);
    if (!r.ok) return setMsg({ ok: false, t: r.error ?? "Error" });
    setMsg({ ok: true, t: validar ? `Validada. ${r.precios} precios registrados.` : "Guardada." });
    if (validar) router.push(volver); else router.refresh();
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Proveedor" className="sm:col-span-2"><Select value={cab.proveedor_id ?? ""} onChange={(e) => setCab({ ...cab, proveedor_id: e.target.value || null })} vacio="Elige proveedor" opciones={proveedores.map((p) => [p.id, p.nombre])} /></Campo>
        <Campo label="Tipo"><Select value={cab.tipo} onChange={(e) => setCab({ ...cab, tipo: e.target.value as CabeceraForm["tipo"] })} opciones={[["factura", "Factura"], ["albaran", "Albarán"]]} /></Campo>
        <Campo label="Número"><Input value={cab.numero ?? ""} onChange={(e) => setCab({ ...cab, numero: e.target.value || null })} /></Campo>
        <Campo label="Fecha"><Input type="date" value={cab.fecha ?? ""} onChange={(e) => setCab({ ...cab, fecha: e.target.value || null })} /></Campo>
        <Campo label="Base imponible (€)"><Input type="number" step="0.01" value={cab.base ?? ""} onChange={(e) => setCab({ ...cab, base: nm(e.target.value) })} /></Campo>
        <Campo label="IVA (€)"><Input type="number" step="0.01" value={cab.iva ?? ""} onChange={(e) => setCab({ ...cab, iva: nm(e.target.value) })} /></Campo>
        <Campo label="Total (€)"><Input type="number" step="0.01" value={cab.total ?? ""} onChange={(e) => setCab({ ...cab, total: nm(e.target.value) })} /></Campo>
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Descripción en la factura</th><th className="px-2">Producto</th><th className="w-24 px-2 text-right">Cantidad</th><th className="w-20 px-2">Ud.</th><th className="w-28 px-2 text-right">€/ud sin IVA</th><th className="w-20 px-2 text-right">IVA %</th><th className="w-24 px-2 text-right">Importe</th><th className="w-10" />
          </tr></thead>
          <tbody>
            {lineas.map((l, i) => {
              const p = productos.find((x) => x.id === l.producto_id);
              const cambio = p?.precio_actual ? (l.precio_unitario - p.precio_actual) / p.precio_actual : null;
              return (
                <tr key={i} className="border-b align-top last:border-0">
                  <td className="px-3 py-2"><Input value={l.descripcion} onChange={(e) => set(i, { descripcion: e.target.value })} aria-label="Descripción" /></td>
                  <td className="px-2 py-2">
                    <select aria-label="Producto" value={l.producto_id ?? ""} className={cn("h-9 w-full min-w-44 rounded-sm border bg-card px-2 text-sm", l.producto_id ? "border-input" : "border-accent")}
                      onChange={async (e) => {
                        if (e.target.value !== "__nuevo") return set(i, { producto_id: e.target.value || null });
                        const nombre = l.descripcion.trim() || "Producto nuevo";
                        const unidad = (["kg", "l", "ud"].includes(l.unidad ?? "") ? l.unidad : "kg") as "kg";
                        const r = await crearProductoRapido(negocioId, nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(), unidad, cab.proveedor_id);
                        if (r.ok && r.id) { setProductos((x) => [...x, { id: r.id!, nombre, unidad, precio_actual: null }]); set(i, { producto_id: r.id }); }
                        else setMsg({ ok: false, t: r.error ?? "No se ha podido crear el producto" });
                      }}>
                      <option value="">Sin enlazar (no guarda precio)</option>
                      <option value="__nuevo">＋ Crear producto con este nombre</option>
                      {productos.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </select>
                    {cambio != null && Math.abs(cambio) >= 0.005 && <Badge tono={cambio > 0.05 ? "bad" : cambio > 0 ? "warn" : "ok"} className="mt-1">{cambio > 0 ? "+" : ""}{(cambio * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} % vs. último</Badge>}
                  </td>
                  <td className="px-2 py-2"><Input type="number" step="0.001" value={l.cantidad} onChange={(e) => set(i, { cantidad: nm(e.target.value) ?? 0 })} className="text-right" aria-label="Cantidad" /></td>
                  <td className="px-2 py-2"><Select value={l.unidad ?? "kg"} onChange={(e) => set(i, { unidad: e.target.value })} opciones={[["kg", "kg"], ["l", "l"], ["ud", "ud"]]} aria-label="Unidad" /></td>
                  <td className="px-2 py-2"><Input type="number" step="0.0001" value={l.precio_unitario} onChange={(e) => set(i, { precio_unitario: nm(e.target.value) ?? 0 })} className="text-right" aria-label="Precio" /></td>
                  <td className="px-2 py-2"><Input type="number" step="1" value={l.iva_pct ?? ""} onChange={(e) => set(i, { iva_pct: nm(e.target.value) })} className="text-right" aria-label="IVA" /></td>
                  <td className="tnum px-2 py-3.5 text-right">{eur(l.cantidad * l.precio_unitario, 2)}</td>
                  <td className="py-2"><Button variant="ghost" size="icon" aria-label="Quitar línea" onClick={() => setLineas((x) => x.filter((_, j) => j !== i))}><Trash2 /></Button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot><tr>
            <td className="px-3 py-2" colSpan={2}><Button variant="outline" size="sm" onClick={() => setLineas((x) => [...x, { producto_id: null, descripcion: "", cantidad: 1, unidad: "kg", precio_unitario: 0, descuento_pct: 0, iva_pct: 10 }])}><Plus />Línea</Button></td>
            <td colSpan={4} className="px-2 text-right text-sm text-muted-foreground">Suma de líneas</td>
            <td className={cn("tnum px-2 text-right font-semibold", descuadre && "text-bad")}>{eur(suma, 2)}</td><td />
          </tr></tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {descuadre && <Badge tono="bad">No cuadra con la base: diferencia {eur(suma - (cab.base ?? 0), 2)}</Badge>}
        {sinProducto > 0 && <Badge tono="warn">{sinProducto} líneas sin producto: no guardarán precio</Badge>}
        {!descuadre && !sinProducto && lineas.length > 0 && <Badge tono="ok"><Check className="size-3" />Cuadra y está todo enlazado</Badge>}
      </div>
      <Campo label="Notas y avisos de la lectura"><Textarea value={cab.notas ?? ""} onChange={(e) => setCab({ ...cab, notas: e.target.value || null })} /></Campo>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <Button variant="destructive" disabled={pend} onClick={() => { if (!borrar) { setBorrar(true); setTimeout(() => setBorrar(false), 4000); return; } start(async () => { const r = await borrarFactura(facturaId); if (r.ok) router.push(volver); }); }}>
          {borrar ? "Pulsa otra vez para borrar" : "Borrar factura"}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className={cn("text-sm", msg.ok ? "text-ok" : "text-bad")}>{msg.t}</span>}
          <Button variant="outline" disabled={pend} onClick={() => guardar(false)}>Guardar sin validar</Button>
          <Button disabled={pend} onClick={() => guardar(true)}>{validada ? "Guardar y volver a validar" : "Validar y registrar precios"}</Button>
        </div>
      </div>
    </div>
  );
}
