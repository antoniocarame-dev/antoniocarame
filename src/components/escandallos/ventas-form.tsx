"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { guardarVentas } from "@/app/acciones/costes";

/** Unidades vendidas por plato en un mes. */
export function VentasForm({ periodo, platos }: { periodo: string; platos: { id: string; nombre: string; unidades: number | null }[] }) {
  const router = useRouter();
  const [mes, setMes] = useState(periodo);
  const [u, setU] = useState<Record<string, string>>(Object.fromEntries(platos.map((p) => [p.id, p.unidades == null ? "" : String(p.unidades)])));
  const [pend, start] = useTransition();
  const [ok, setOk] = useState<string | null>(null);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">Mes
          <Input type="month" value={mes} onChange={(e) => { setMes(e.target.value); router.push(`?v=ingenieria&mes=${e.target.value}`); }} className="w-44" /></label>
        <p className="pb-2 text-xs text-muted-foreground">Copia las unidades del informe de ventas por artículo de tu TPV.</p>
      </div>
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {platos.map((p) => (
          <label key={p.id} className="flex items-center justify-between gap-3 border-b border-dashed py-1 text-sm">
            <span className="min-w-0 truncate">{p.nombre}</span>
            <Input type="number" min="0" step="1" value={u[p.id] ?? ""} onChange={(e) => setU({ ...u, [p.id]: e.target.value })} className="w-24 text-right" aria-label={`Unidades de ${p.nombre}`} />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {ok && <span className="text-sm text-ok">{ok}</span>}
        <Button disabled={pend} onClick={() => start(async () => {
          const datos = Object.fromEntries(Object.entries(u).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)]));
          const r = await guardarVentas(mes, datos);
          setOk(r.ok ? "Ventas guardadas" : r.error ?? "Error");
          router.refresh();
        })}>Guardar ventas del mes</Button>
      </div>
    </div>
  );
}
