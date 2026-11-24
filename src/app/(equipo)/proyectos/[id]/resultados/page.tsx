import { ArrowDown, ArrowUp, Pencil, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { BotonExcel } from "@/components/boton-excel";
import { Vacio } from "@/components/ui/vacio";
import { LineaKpi, VentasMensuales } from "@/components/graficos";
import { ImportarVentas, ImportarVentasPlato } from "@/components/resultados/importar";
import { negocioDeProyecto } from "@/lib/negocio";
import { agregar, cuentaResultados, KPIS_SECTOR, type CodigoKpi, type Mes } from "@/lib/resultados";
import * as A from "@/app/acciones/resultados";
import { cn, eur, fecha, hoyISO, mes as fmtMes, numero } from "@/lib/utils";

const FUENTE_MP = { cuenta: "de la cuenta", inventario: "por inventarios", compras: "compras del mes" } as const;
const fmt = (c: CodigoKpi, v: number | null) => {
  if (v == null) return "—";
  const k = KPIS_SECTOR.find((x) => x.codigo === c)!;
  return k.unidad === "%" ? `${numero(v * 100, 1)} %` : k.unidad === "€" ? eur(v, 2) : numero(v, 2);
};

export default async function Resultados({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const { v = "cuenta" } = await searchParams;
  const { supabase, negocio } = await negocioDeProyecto(id);
  const [{ data: proyecto }, meses] = await Promise.all([
    supabase.from("proyectos").select("fecha_inicio, titulo").eq("id", id).single(),
    cuentaResultados(supabase, negocio),
  ]);
  const base = `/proyectos/${id}/resultados`;
  const inicio = proyecto?.fecha_inicio ?? null;
  const completos = meses.filter((m) => m.completo);
  const antes = inicio ? completos.filter((m) => m.periodo < inicio) : [];
  const despues = (inicio ? completos.filter((m) => m.periodo >= inicio) : completos).slice(-3);
  const A1 = agregar(antes), D1 = agregar(despues);
  const ultimo = completos.at(-1);
  const visibles = meses.slice(-7);
  const filas: [string, (m: Mes) => number | null, boolean?][] = [
    ["Ventas netas", (m) => m.ventas, true], ["Materia prima", (m) => m.costeMp], ["Personal", (m) => m.personal],
    ["Prime cost", (m) => (m.costeMp != null && m.personal != null ? m.costeMp + m.personal : null), true],
    ["Alquiler", (m) => m.alquiler], ["Suministros", (m) => m.suministros], ["Otros gastos", (m) => m.otros], ["EBITDA", (m) => m.ebitda, true],
  ];

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Ventas último mes cerrado" valor={ultimo ? eur(ultimo.ventas) : "—"} ayuda={ultimo ? fmtMes(ultimo.periodo) : "sin meses cerrados"} />
        <Kpi label="Prime cost" valor={fmt("prime_cost", ultimo?.kpi.prime_cost ?? null)} tono={ultimo?.kpi.prime_cost != null ? (ultimo.kpi.prime_cost <= 0.65 ? "ok" : "bad") : undefined} ayuda="materia prima + personal" />
        <Kpi label="EBITDA" valor={ultimo?.ebitda != null ? eur(ultimo.ebitda) : "—"} tono={ultimo?.ebitda != null ? (ultimo.ebitda >= 0 ? "ok" : "bad") : undefined} ayuda={fmt("ebitda_pct", ultimo?.kpi.ebitda_pct ?? null) + " sobre ventas"} />
        <Kpi label="Mejora de EBITDA" valor={A1 && D1 ? eur(D1.ebitdaMes - A1.ebitdaMes) : "—"} tono={A1 && D1 ? (D1.ebitdaMes >= A1.ebitdaMes ? "ok" : "bad") : undefined} ayuda={A1 && D1 ? "al mes, después frente a antes" : "faltan meses de antes del proyecto"} />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SubPestanas base={base} actual={v} items={[["cuenta", "Cuenta de resultados"], ["kpis", "KPIs del sector"], ["impacto", "Antes y después"], ["ventas", "Importar ventas"]]} />
        <BotonExcel href={`/exportar/resultados?proyecto=${id}`} />
      </div>

      {v === "cuenta" && (meses.length ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Evolución</CardTitle><span className="text-xs text-muted-foreground">En gris, los meses antes del proyecto{inicio ? ` (inicio ${fecha(inicio)})` : ""}</span></CardHeader>
            <VentasMensuales datos={meses.map((m) => ({ mes: fmtMes(m.periodo), ventas: m.ventas ?? 0, ebitda: m.ebitda, fc: m.kpi.food_cost != null ? Math.round(m.kpi.food_cost * 1000) / 10 : null, antes: !!inicio && m.periodo < inicio }))} />
          </Card>
          <Card className="p-0"><div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 text-left">€ sin IVA</th>
                {visibles.map((m) => <th key={m.periodo} className="px-2 py-2 text-right">{fmtMes(m.periodo)}{m.enCurso && <span className="block font-sans text-[10px] normal-case text-warn">en curso</span>}</th>)}
              </tr></thead>
              <tbody>
                {filas.map(([nombre, f, fuerte]) => (
                  <tr key={nombre} className={cn("border-b last:border-0", fuerte && "bg-muted/50 font-semibold")}>
                    <td className="px-5 py-2">{nombre}</td>
                    {visibles.map((m) => {
                      const val = f(m);
                      return <td key={m.periodo} className={cn("tnum px-2 text-right", nombre === "EBITDA" && val != null && (val < 0 ? "text-bad" : "text-ok"))}>
                        {val == null ? <span className="text-muted-foreground">—</span> : eur(val)}
                        {nombre === "Materia prima" && m.fuenteMp && <span className="block text-[10px] font-normal text-muted-foreground">{FUENTE_MP[m.fuenteMp]}</span>}
                      </td>;
                    })}
                  </tr>
                ))}
                {(["food_cost", "labour_cost", "ebitda_pct"] as const).map((c) => (
                  <tr key={c} className="border-b text-muted-foreground last:border-0">
                    <td className="px-5 py-1.5 text-xs">{KPIS_SECTOR.find((k) => k.codigo === c)!.nombre}</td>
                    {visibles.map((m) => <td key={m.periodo} className="tnum px-2 text-right text-xs">{fmt(c, m.kpi[c])}</td>)}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-2 text-xs text-muted-foreground">Editar gastos</td>
                  {visibles.map((m) => (
                    <td key={m.periodo} className="px-2 py-1 text-right">
                      <DialogoForm titulo={`Cuenta de ${fmtMes(m.periodo)}`} descripcion="Deja vacíos ventas y materia prima para que se calculen solos (ventas del TPV; inventarios y facturas)."
                        trigger={<Button variant="ghost" size="icon" aria-label={`Editar ${fmtMes(m.periodo)}`}><Pencil /></Button>}
                        action={async (fd) => { "use server"; return A.guardarCuenta(negocio.id, m.periodo, fd); }}>
                        <Campo label="Ventas netas (vacío = TPV)"><Input name="ventas_netas" type="number" step="0.01" placeholder={m.ventas != null ? String(Math.round(m.ventas)) : ""} /></Campo>
                        <Campo label="Materia prima (vacío = auto)"><Input name="coste_mp" type="number" step="0.01" defaultValue={m.fuenteMp === "cuenta" ? m.costeMp ?? "" : ""} placeholder={m.costeMp != null ? String(Math.round(m.costeMp)) : ""} /></Campo>
                        <Campo label="Personal (nóminas + SS)"><Input name="personal" type="number" step="0.01" defaultValue={m.personal ?? ""} /></Campo>
                        <Campo label="Alquiler"><Input name="alquiler" type="number" step="0.01" defaultValue={m.alquiler ?? ""} /></Campo>
                        <Campo label="Suministros"><Input name="suministros" type="number" step="0.01" defaultValue={m.suministros ?? ""} /></Campo>
                        <Campo label="Otros gastos"><Input name="otros_gastos" type="number" step="0.01" defaultValue={m.otros ?? ""} /></Campo>
                        <Campo label="Notas" className="sm:col-span-2"><Textarea name="notas" defaultValue={m.notas ?? ""} /></Campo>
                      </DialogoForm>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Materia prima: la cifra de la gestoría si la escribes; si no, inventario inicial + compras validadas − inventario final cuando hay inventarios a principio y final de mes; si no, las compras del mes (menos fiable).</p></Card>
        </div>
      ) : <Vacio titulo="Sin ventas todavía">Importa las ventas diarias del TPV en «Importar ventas» y completa los gastos de cada mes.</Vacio>)}

      {v === "kpis" && (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-[70ch] text-sm text-muted-foreground">Calculados con ventas, cuenta de resultados, inventarios y mermas. Usa el botón para copiar los meses cerrados a los KPIs del plan de mejora que tengan el mismo código.</p>
            <BotonAccion variant="default" size="default" accion={async () => { "use server"; return A.actualizarKpisProyecto(id); }}><RefreshCw />Volcar al plan de mejora</BotonAccion>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {KPIS_SECTOR.map((k) => {
              const serie = meses.filter((m) => !m.enCurso && m.kpi[k.codigo] != null).map((m) => ({ periodo: fmtMes(m.periodo), valor: k.unidad === "%" ? Math.round(m.kpi[k.codigo]! * 1000) / 10 : Math.round(m.kpi[k.codigo]! * 100) / 100 }));
              const u = serie.at(-1)?.valor, p = serie.at(-2)?.valor;
              const mejora = u != null && p != null ? (k.bajar ? u < p : u > p) : null;
              return (
                <Card key={k.codigo} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-semibold">{k.nombre}</p><p className="text-xs text-muted-foreground">{k.ref || " "}</p></div>
                    <span className="flex items-center gap-1 font-mono text-lg font-bold">{u != null ? (k.unidad === "%" ? `${numero(u, 1)} %` : k.unidad === "€" ? eur(u, 2) : numero(u, 2)) : "—"}
                      {mejora != null && (mejora ? <ArrowUp className={cn("size-4 text-ok", k.bajar && "rotate-180")} /> : <ArrowDown className={cn("size-4 text-bad", k.bajar && "rotate-180")} />)}</span>
                  </div>
                  {serie.length > 1 ? <LineaKpi datos={serie} unidad={k.unidad === "veces" ? "" : k.unidad} alto={130} /> : <p className="py-6 text-center text-sm text-muted-foreground">Faltan datos.</p>}
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader><CardTitle>Datos del local</CardTitle><span className="text-xs text-muted-foreground">Para RevPASH y rotación</span></CardHeader>
            <DialogoForm titulo="Datos de operación" trigger={<Button variant="outline" size="sm"><Pencil />Aforo {negocio.aforo ?? "—"} plazas · {numero(Number(negocio.horas_apertura_dia), 1)} h/día · {negocio.servicios_dia} servicios</Button>}
              action={async (fd) => { "use server"; return A.guardarOperacion(negocio.id, fd); }}>
              <Campo label="Plazas (aforo)"><Input name="aforo" type="number" min="0" defaultValue={negocio.aforo ?? ""} /></Campo>
              <Campo label="Horas de apertura al día"><Input name="horas_apertura_dia" type="number" step="0.5" min="1" defaultValue={negocio.horas_apertura_dia} /></Campo>
              <Campo label="Servicios al día"><Input name="servicios_dia" type="number" min="1" defaultValue={negocio.servicios_dia} /></Campo>
            </DialogoForm>
          </Card>
        </div>
      )}

      {v === "impacto" && (A1 && D1 ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Antes" valor={`${A1.meses} meses`} ayuda={antes.map((m) => fmtMes(m.periodo)).join(", ")} />
            <Kpi label="Después" valor={`${D1.meses} meses`} ayuda={despues.map((m) => fmtMes(m.periodo)).join(", ")} />
            <Kpi label="Ahorro en materia prima" valor={eur(((A1.kpi.food_cost ?? 0) - (D1.kpi.food_cost ?? 0)) * D1.ventasMes * 12)} tono="ok" ayuda="al año, con las ventas actuales" />
            <Kpi label="EBITDA medio mensual" valor={`${eur(A1.ebitdaMes)} → ${eur(D1.ebitdaMes)}`} tono={D1.ebitdaMes >= A1.ebitdaMes ? "ok" : "bad"} />
          </div>
          <Card className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Indicador</th><th className="px-2 text-right">Antes</th><th className="px-2 text-right">Después</th><th className="px-2 text-right">Cambio</th><th className="px-5 text-right">Impacto anual</th></tr></thead>
              <tbody>
                {KPIS_SECTOR.map((k) => {
                  const a = A1.kpi[k.codigo], d = D1.kpi[k.codigo];
                  if (a == null && d == null) return null;
                  const dif = a != null && d != null ? d - a : null;
                  const bien = dif != null ? (k.bajar ? dif < 0 : dif > 0) : null;
                  const impacto = k.unidad === "%" && dif != null && ["food_cost", "labour_cost", "mermas"].includes(k.codigo) ? -dif * D1.ventasMes * 12 : null;
                  return (
                    <tr key={k.codigo} className="border-b last:border-0">
                      <td className="px-5 py-2.5 font-medium">{k.nombre}</td>
                      <td className="tnum px-2 text-right text-muted-foreground">{fmt(k.codigo, a)}</td>
                      <td className="tnum px-2 text-right font-semibold">{fmt(k.codigo, d)}</td>
                      <td className="px-2 text-right">{dif != null ? <Badge tono={bien ? "ok" : "bad"}>{dif > 0 ? "+" : ""}{k.unidad === "%" ? `${numero(dif * 100, 1)} pt` : k.unidad === "€" ? eur(dif, 2) : numero(dif, 2)}</Badge> : "—"}</td>
                      <td className={cn("tnum px-5 text-right", impacto != null && (impacto >= 0 ? "text-ok" : "text-bad"))}>{impacto != null ? eur(impacto) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Ratios ponderados por ventas. «Después» son los últimos 3 meses cerrados desde el inicio del proyecto. Impacto anual = puntos de mejora × ventas mensuales actuales × 12. Influyen también la estacionalidad y los precios de mercado: compáralo con los mismos meses del año anterior cuando los tengas.</p></Card>
        </div>
      ) : <Vacio titulo="Hacen falta meses de antes y de después">Carga la cuenta de resultados de algún mes anterior al inicio del proyecto ({inicio ? fecha(inicio) : "sin fecha de inicio"}) y al menos uno posterior, con ventas, materia prima y personal.</Vacio>)}

      {v === "ventas" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Ventas diarias</CardTitle></CardHeader>
            <p className="mb-3 text-sm text-muted-foreground">Exporta del TPV el informe de cierre diario (fecha, total, tickets, comensales) en CSV o Excel guardado como CSV.</p>
            <ImportarVentas negocioId={negocio.id} />
            <div className="mt-4 border-t pt-4">
              <DialogoForm titulo="Añadir un día" trigger={<Button variant="ghost" size="sm">O añade un día a mano</Button>} action={async (fd) => { "use server"; return A.guardarDia(negocio.id, fd); }}>
                <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
                <Campo label="Ventas sin IVA (€)"><Input name="ventas_netas" type="number" step="0.01" required /></Campo>
                <Campo label="Tickets"><Input name="tickets" type="number" min="0" /></Campo>
                <Campo label="Comensales"><Input name="cubiertos" type="number" min="0" /></Campo>
              </DialogoForm>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Ventas por plato</CardTitle></CardHeader>
            <p className="mb-3 text-sm text-muted-foreground">El informe de ventas por artículo del mes. Alimenta la ingeniería de menú y el consumo teórico.</p>
            <ImportarVentasPlato negocioId={negocio.id} />
          </Card>
          <p className="text-xs text-muted-foreground lg:col-span-2">La conexión directa con el TPV por API depende del fabricante (cada uno tiene la suya). Cuando sepamos qué TPV usa cada cliente, se puede añadir como importación automática diaria.</p>
        </div>
      )}
    </div>
  );
}
