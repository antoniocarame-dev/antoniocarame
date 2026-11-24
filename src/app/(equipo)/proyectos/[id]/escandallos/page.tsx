import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { BotonExcel } from "@/components/boton-excel";
import { Vacio } from "@/components/ui/vacio";
import { MatrizMenu } from "@/components/graficos";
import { VentasForm } from "@/components/escandallos/ventas-form";
import { SubirReceta } from "@/components/escandallos/subir-receta";

// La lectura de una receta con Claude puede tardar hasta un minuto
export const maxDuration = 60;
import { cargarEscandallos } from "@/lib/negocio";
import { CLASES, ingenieriaMenu, type Clase } from "@/lib/costes";
import { eur, numero, mes as fmtMes } from "@/lib/utils";

const pct = (x: number | null) => (x == null ? "—" : `${numero(x * 100, 1)} %`);

export default async function Escandallos({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string; mes?: string }> }) {
  const { id } = await params;
  const { v = "platos", mes } = await searchParams;
  const { escandallos, calculos, ventas, objetivo, negocio } = await cargarEscandallos(id);
  const base = `/proyectos/${id}/escandallos`;
  const platos = escandallos.filter((e) => e.tipo === "plato");
  const elaboraciones = escandallos.filter((e) => e.tipo === "elaboracion");
  const periodos = [...new Set(ventas.map((x) => x.periodo.slice(0, 7)))].sort();
  const periodo = mes ?? periodos.at(-1) ?? new Date().toISOString().slice(0, 7);
  const ventasMes = new Map(ventas.filter((x) => x.periodo.startsWith(periodo)).map((x) => [x.escandallo_id, x.unidades]));

  const conPvp = platos.filter((p) => calculos.get(p.id)?.foodCost != null);
  const totalUds = conPvp.reduce((s, p) => s + (ventasMes.get(p.id) ?? 0), 0);
  const fcCarta = totalUds
    ? conPvp.reduce((s, p) => s + calculos.get(p.id)!.costeRacion * (ventasMes.get(p.id) ?? 0), 0) / conPvp.reduce((s, p) => s + calculos.get(p.id)!.neto! * (ventasMes.get(p.id) ?? 0), 0)
    : conPvp.length ? conPvp.reduce((s, p) => s + calculos.get(p.id)!.foodCost!, 0) / conPvp.length : null;
  const sobre = conPvp.filter((p) => calculos.get(p.id)!.foodCost! > objetivo);
  const ing = ingenieriaMenu(platos.map((p) => { const c = calculos.get(p.id)!; return { id: p.id, nombre: p.nombre, unidades: ventasMes.get(p.id) ?? 0, margen: c.margen ?? 0, foodCost: c.foodCost }; }));
  const tono = (fc: number | null) => (fc == null ? "neutro" : fc <= objetivo ? "ok" : fc <= objetivo + 0.05 ? "warn" : "bad") as "ok" | "warn" | "bad" | "neutro";

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={totalUds ? "Food cost real de carta" : "Food cost medio"} valor={pct(fcCarta)} tono={tono(fcCarta) === "neutro" ? undefined : tono(fcCarta)} ayuda={totalUds ? `ponderado por ventas de ${fmtMes(periodo + "-01")}` : `objetivo ${pct(objetivo)}`} />
        <Kpi label="Platos sobre objetivo" valor={sobre.length} tono={sobre.length ? "bad" : "ok"} ayuda={`de ${conPvp.length} con PVP · objetivo ${pct(objetivo)}`} />
        <Kpi label="Margen medio por ración" valor={eur(ing.margenMedio || (conPvp.length ? conPvp.reduce((s, p) => s + calculos.get(p.id)!.margen!, 0) / conPvp.length : 0), 2)} ayuda={totalUds ? "ponderado por ventas" : "sin ventas registradas"} />
        <Kpi label="Margen bruto del mes" valor={totalUds ? eur(ing.contribucionTotal) : "—"} ayuda={totalUds ? `${totalUds.toLocaleString("es-ES")} raciones vendidas` : "registra ventas en Ingeniería"} />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SubPestanas base={base} actual={v} items={[["platos", "Platos", platos.length], ["elaboraciones", "Elaboraciones", elaboraciones.length], ["ingenieria", "Ingeniería de menú"]]} />
        <div className="flex gap-2">
          <BotonExcel href={`/exportar/escandallos?proyecto=${id}`} />
          <SubirReceta negocioId={negocio.id} proyectoId={id} />
          <Button asChild variant="outline" size="sm"><Link href={`${base}/nuevo?tipo=elaboracion`}><Plus />Elaboración</Link></Button>
          <Button asChild size="sm"><Link href={`${base}/nuevo`}><Plus />Plato</Link></Button>
        </div>
      </div>

      {(v === "platos" || v === "elaboraciones") && (() => {
        const lista = v === "platos" ? platos : elaboraciones;
        if (!lista.length) return <Vacio titulo={v === "platos" ? "Sin platos" : "Sin elaboraciones"}>{v === "platos" ? "Crea el primer escandallo. Los costes salen de los precios de compra en Costes y compras." : "Fondos, salsas, masas o guarniciones que se usan en varios platos."}</Vacio>;
        return (
          <Card className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2">{v === "platos" ? "Plato" : "Elaboración"}</th>
                {v === "platos" ? <><th className="px-2 text-right">Coste ración</th><th className="px-2 text-right">PVP</th><th className="px-2 text-right">Food cost</th><th className="px-2 text-right">Margen</th><th className="px-2 text-right">PVP recomendado</th></>
                  : <><th className="px-2 text-right">Coste total</th><th className="px-2 text-right">Rinde</th><th className="px-2 text-right">Coste por unidad</th></>}
                <th className="px-5">Alérgenos</th>
              </tr></thead>
              <tbody>
                {lista.map((e) => {
                  const c = calculos.get(e.id)!;
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/60">
                      <td className="px-5 py-2.5"><Link href={`${base}/${e.id}`} className="font-medium hover:text-primary-ink">{e.nombre}</Link>
                        <p className="text-xs text-muted-foreground">{e.categoria ?? "—"}{c.sinPrecio.length ? <span className="text-warn"> · sin precio: {c.sinPrecio.join(", ")}</span> : null}</p></td>
                      {v === "platos" ? <>
                        <td className="tnum px-2 text-right">{eur(c.costeRacion, 2)}</td>
                        <td className="tnum px-2 text-right">{e.pvp != null ? eur(Number(e.pvp), 2) : "—"}</td>
                        <td className="px-2 text-right"><Badge tono={tono(c.foodCost)}>{pct(c.foodCost)}</Badge></td>
                        <td className="tnum px-2 text-right">{c.margen != null ? eur(c.margen, 2) : "—"}</td>
                        <td className={"tnum px-2 text-right " + (c.pvpRecomendado && e.pvp && c.pvpRecomendado > Number(e.pvp) ? "font-semibold text-bad" : "text-muted-foreground")}>{c.pvpRecomendado ? eur(c.pvpRecomendado, 2) : "—"}</td>
                      </> : <>
                        <td className="tnum px-2 text-right">{eur(c.costeTotal, 2)}</td>
                        <td className="tnum px-2 text-right">{e.rendimiento ? `${numero(Number(e.rendimiento), 2)} ${e.unidad_rendimiento}` : "—"}</td>
                        <td className="tnum px-2 text-right font-medium">{c.costePorUnidad != null ? `${eur(c.costePorUnidad, 2)}/${e.unidad_rendimiento}` : "—"}</td>
                      </>}
                      <td className="px-5 text-xs">{c.alergenos.join(", ") || <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {v === "platos" && <p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Food cost = coste por ración ÷ PVP sin IVA. PVP recomendado: el que deja el food cost en el objetivo de {negocio.nombre} ({pct(objetivo)}), con IVA. En rojo cuando está por encima del PVP actual.</p>}
          </Card>
        );
      })()}

      {v === "ingenieria" && (
        <div className="grid gap-4">
          {ing.filas.length >= 3 ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader><CardTitle>Matriz de {fmtMes(periodo + "-01")}</CardTitle><span className="text-xs text-muted-foreground">Líneas: 70 % del reparto equitativo y margen medio ponderado</span></CardHeader>
                <MatrizMenu puntos={ing.filas} umbralMix={ing.umbral} margenMedio={ing.margenMedio} />
              </Card>
              <Card>
                <CardHeader><CardTitle>Qué hacer con cada plato</CardTitle></CardHeader>
                <div className="grid gap-3">
                  {(Object.keys(CLASES) as Clase[]).map((k) => {
                    const fs = ing.filas.filter((f) => f.clase === k);
                    return (
                      <section key={k}>
                        <p className="flex items-center gap-2"><Badge tono={CLASES[k].tono}>{CLASES[k].nombre} · {fs.length}</Badge></p>
                        <p className="mt-1 text-xs text-muted-foreground">{CLASES[k].que}</p>
                        {fs.length > 0 && <ul className="mt-1 text-sm">{fs.map((f) => <li key={f.id} className="flex justify-between gap-2"><span>{f.nombre}</span><span className="tnum text-muted-foreground">{f.unidades} uds · {eur(f.margen, 2)}</span></li>)}</ul>}
                      </section>
                    );
                  })}
                </div>
              </Card>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-sm bg-warn-soft px-3 py-2 text-sm text-warn"><AlertTriangle className="size-4" />Registra las ventas de al menos 3 platos con PVP para ver la matriz.</p>
          )}
          <Card>
            <CardHeader><CardTitle>Ventas por plato</CardTitle>{periodos.length > 0 && <span className="text-xs text-muted-foreground">Meses con datos: {periodos.map((p) => fmtMes(p + "-01")).join(", ")}</span>}</CardHeader>
            <VentasForm key={periodo} periodo={periodo} platos={platos.map((p) => ({ id: p.id, nombre: p.nombre, unidades: ventasMes.get(p.id) ?? null }))} />
          </Card>
        </div>
      )}
    </div>
  );
}
