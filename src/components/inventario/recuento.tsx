"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, eur } from "@/lib/utils";
import { contarLinea, cerrarInventario } from "@/app/acciones/inventario";

type L = { producto_id: string; nombre: string; familia: string; unidad: string; cantidad: number | null; precio: number };

/** Recuento pensado para hacerse en el almacén con el móvil: se guarda cada línea al salir del campo. */
export function Recuento({ inventarioId, lineas: ini, cerrado }: { inventarioId: string; lineas: L[]; cerrado: boolean }) {
  const router = useRouter();
  const [lineas, setLineas] = useState(ini);
  const [filtro, setFiltro] = useState("");
  const [guardando, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const familias = [...new Set(lineas.map((l) => l.familia))].sort();
  const contadas = lineas.filter((l) => l.cantidad != null).length;
  const valor = useMemo(() => lineas.reduce((s, l) => s + (l.cantidad ?? 0) * l.precio, 0), [lineas]);

  const guardar = (pid: string, v: string) => {
    const cantidad = v === "" ? null : Number(v.replace(",", "."));
    if (cantidad != null && (!Number.isFinite(cantidad) || cantidad < 0)) return;
    setLineas((x) => x.map((l) => (l.producto_id === pid ? { ...l, cantidad } : l)));
    start(async () => { const r = await contarLinea(inventarioId, pid, cantidad); setError(r.ok ? null : r.error ?? "Error"); });
  };

  return (
    <div>
      <div className="sticky top-14 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0">
        <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto"
          className="h-9 min-w-40 flex-1 rounded-sm border border-input bg-card px-2.5 text-sm" />
        <span className="tnum text-sm text-muted-foreground">{contadas}/{lineas.length} contados · <b className="text-foreground">{eur(valor, 2)}</b> · {guardando ? "Guardando…" : error ? <span className="text-bad">{error}</span> : "Guardado"}</span>
        <Button size="sm" variant={cerrado ? "outline" : "default"} disabled={guardando} onClick={() => start(async () => { await cerrarInventario(inventarioId, !cerrado); router.refresh(); })}>
          {cerrado ? <><LockOpen />Reabrir</> : <><Lock />Cerrar y valorar</>}
        </Button>
      </div>
      <div className="grid gap-5">
        {familias.map((f) => {
          const ls = lineas.filter((l) => l.familia === f && l.nombre.toLowerCase().includes(filtro.toLowerCase()));
          if (!ls.length) return null;
          return (
            <section key={f}>
              <h2 className="eyebrow mb-2">{f}</h2>
              <ul className="divide-y rounded-md border bg-card">
                {ls.map((l) => (
                  <li key={l.producto_id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1"><p className="font-medium">{l.nombre}</p><p className="text-xs text-muted-foreground">{eur(l.precio, 2)}/{l.unidad}{l.cantidad != null ? ` · ${eur(l.cantidad * l.precio, 2)}` : ""}</p></div>
                    <input type="number" inputMode="decimal" step="0.001" min="0" disabled={cerrado} defaultValue={l.cantidad ?? ""} aria-label={`Cantidad de ${l.nombre}`}
                      onBlur={(e) => { if ((e.target.value === "" ? null : Number(e.target.value)) !== l.cantidad) guardar(l.producto_id, e.target.value); }}
                      className={cn("h-11 w-28 rounded-sm border bg-card px-2 text-right font-mono text-base", l.cantidad == null ? "border-accent" : "border-input")} />
                    <span className="w-6 text-sm text-muted-foreground">{l.unidad}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
