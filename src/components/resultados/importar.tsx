"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { eur } from "@/lib/utils";
import { importarVentas, importarVentasPlato, type FilaVenta } from "@/app/acciones/resultados";

/** Lee un CSV de TPV: detecta separador y cabeceras. */
function leerCsv(texto: string) {
  const lineas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const sep = [";", "\t", ","].map((s) => ({ s, n: (lineas[0].match(new RegExp(s === "\t" ? "\t" : `\\${s}`, "g")) ?? []).length })).sort((a, b) => b.n - a.n)[0].s;
  const partir = (l: string) => { const out: string[] = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
  const [cab, ...filas] = lineas.map(partir);
  return { cab, filas };
}
/** "1.234,56" → 1234.56 · "1234.56" → 1234.56 */
const numero = (s: string | undefined) => {
  if (!s) return NaN;
  let t = s.replace(/[€\s]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = t.replace(",", ".");
  return Number(t);
};
const fechaIso = (s: string | undefined) => {
  if (!s) return "";
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  const i = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return i ? i[0] : "";
};
const buscar = (cab: string[], claves: string[]) => {
  const i = cab.findIndex((c) => claves.some((k) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(k)));
  return i < 0 ? "" : String(i);
};

export function ImportarVentas({ negocioId }: { negocioId: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState<ReturnType<typeof leerCsv> | null>(null);
  const [col, setCol] = useState({ fecha: "", ventas: "", tickets: "", cubiertos: "" });
  const [conIva, setConIva] = useState(true);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const filas: FilaVenta[] = csv ? csv.filas.map((f) => {
    const v = numero(f[Number(col.ventas)]);
    return { fecha: fechaIso(f[Number(col.fecha)]), ventas_netas: Math.round((conIva ? v / 1.1 : v) * 100) / 100,
      tickets: col.tickets ? Math.round(numero(f[Number(col.tickets)])) || null : null, cubiertos: col.cubiertos ? Math.round(numero(f[Number(col.cubiertos)])) || null : null };
  }) : [];
  const validas = filas.filter((f) => f.fecha && Number.isFinite(f.ventas_netas));
  const opts = csv ? csv.cab.map((c, i) => [String(i), c || `Columna ${i + 1}`] as [string, string]) : [];

  return (
    <div className="grid gap-3">
      <Button asChild variant="outline" className="w-fit"><label className="cursor-pointer"><Upload />Elegir CSV de ventas diarias
        <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
          const r = leerCsv(await f.text()); setCsv(r); setMsg(null);
          setCol({ fecha: buscar(r.cab, ["fecha", "dia", "date"]), ventas: buscar(r.cab, ["venta", "importe", "total", "neto", "base"]), tickets: buscar(r.cab, ["ticket", "operacion", "factura"]), cubiertos: buscar(r.cab, ["comensal", "cubierto", "pax", "cliente"]) });
        }} /></label></Button>
      {csv && (
        <>
          <div className="grid gap-2 sm:grid-cols-4">
            {(["fecha", "ventas", "tickets", "cubiertos"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">{{ fecha: "Fecha", ventas: "Ventas", tickets: "Tickets", cubiertos: "Comensales" }[k]}
                <Select value={col[k]} onChange={(e) => setCol({ ...col, [k]: e.target.value })} vacio={k === "fecha" || k === "ventas" ? "Elige columna" : "No hay"} opciones={opts} /></label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={conIva} onChange={(e) => setConIva(e.target.checked)} className="size-4" />Los importes incluyen IVA (10 %): quitarlo</label>
          <p className="text-sm">{validas.length} de {filas.length} filas válidas · {eur(validas.reduce((s, f) => s + f.ventas_netas, 0))} sin IVA{validas.length ? ` · del ${validas[0].fecha} al ${validas.at(-1)!.fecha}` : ""}</p>
          <div className="overflow-x-auto rounded-sm border text-xs"><table className="w-full"><tbody>
            {validas.slice(0, 4).map((f, i) => <tr key={i} className="border-b last:border-0"><td className="px-2 py-1">{f.fecha}</td><td className="tnum px-2 text-right">{eur(f.ventas_netas, 2)}</td><td className="px-2 text-right">{f.tickets ?? "—"} tickets</td><td className="px-2 text-right">{f.cubiertos ?? "—"} comensales</td></tr>)}
          </tbody></table></div>
          <Button className="w-fit" disabled={pend || !validas.length} onClick={() => start(async () => {
            const r = await importarVentas(negocioId, validas);
            setMsg(r.ok ? { ok: true, t: `${r.n} días importados. Los días que ya existían se han sustituido.` } : { ok: false, t: r.error ?? "Error" });
            if (r.ok) { setCsv(null); router.refresh(); }
          })}>Importar {validas.length} días</Button>
        </>
      )}
      {msg && <p className={"text-sm " + (msg.ok ? "text-ok" : "text-bad")}>{msg.t}</p>}
    </div>
  );
}

export function ImportarVentasPlato({ negocioId }: { negocioId: string }) {
  const router = useRouter();
  const [mes, setMes] = useState(new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 7));
  const [csv, setCsv] = useState<ReturnType<typeof leerCsv> | null>(null);
  const [col, setCol] = useState({ nombre: "", unidades: "" });
  const [pend, start] = useTransition();
  const [res, setRes] = useState<{ ok: boolean; t: string; sin?: string[] } | null>(null);
  const filas = csv ? csv.filas.map((f) => ({ nombre: f[Number(col.nombre)] ?? "", unidades: numero(f[Number(col.unidades)]) })).filter((f) => f.nombre && Number.isFinite(f.unidades)) : [];
  const opts = csv ? csv.cab.map((c, i) => [String(i), c || `Columna ${i + 1}`] as [string, string]) : [];
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">Mes<Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-44" /></label>
        <Button asChild variant="outline"><label className="cursor-pointer"><Upload />Elegir CSV de ventas por artículo
          <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
            const r = leerCsv(await f.text()); setCsv(r); setRes(null);
            setCol({ nombre: buscar(r.cab, ["articulo", "producto", "plato", "descrip", "nombre"]), unidades: buscar(r.cab, ["unidad", "cantidad", "uds", "vendid"]) });
          }} /></label></Button>
      </div>
      {csv && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">Artículo<Select value={col.nombre} onChange={(e) => setCol({ ...col, nombre: e.target.value })} vacio="Elige columna" opciones={opts} /></label>
            <label className="flex flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">Unidades<Select value={col.unidades} onChange={(e) => setCol({ ...col, unidades: e.target.value })} vacio="Elige columna" opciones={opts} /></label>
          </div>
          <p className="text-sm">{filas.length} artículos. Se emparejan por nombre con tus platos escandallados.</p>
          <Button className="w-fit" disabled={pend || !filas.length} onClick={() => start(async () => {
            const r = await importarVentasPlato(negocioId, mes, filas);
            setRes(r.ok ? { ok: true, t: `${r.n} platos actualizados para ${mes}.`, sin: r.sinPareja } : { ok: false, t: r.error ?? "Error", sin: r.sinPareja });
            if (r.ok) { setCsv(null); router.refresh(); }
          })}>Importar ventas por plato</Button>
        </>
      )}
      {res && <div className="text-sm"><p className={res.ok ? "text-ok" : "text-bad"}>{res.t}</p>
        {!!res.sin?.length && <p className="mt-1 text-muted-foreground">Sin pareja (bebidas, extras o platos sin escandallo): {res.sin.slice(0, 12).map((s) => <Badge key={s} className="mr-1">{s}</Badge>)}{res.sin.length > 12 ? ` y ${res.sin.length - 12} más` : ""}</p>}</div>}
    </div>
  );
}
