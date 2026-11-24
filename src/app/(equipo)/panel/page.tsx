import Link from "next/link";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kpi, Semaforo, EstadoProyecto, Progreso } from "@/components/piezas";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { estadoKpi, eur, fecha, hoyISO, fechaCorta, hora, numero, TIPOS_EVENTO, valorKpi, diasHasta, ESTADOS_PROYECTO, madridAISO, diaMadrid } from "@/lib/utils";

export const metadata = { title: "Panel" };

export default async function Panel() {
  const { supabase, esAdmin, perfil } = await requiereEquipo();
  const ahora = new Date();
  const en14 = new Date(ahora.getTime() + 14 * 864e5);
  const hace60 = new Date(ahora.getTime() - 60 * 864e5).toISOString().slice(0, 10);
  const [{ data: proyectos }, { data: perfiles }, { data: finanzas }, { data: kpis }, { data: eventos }, { data: subidas }, { data: porRevisar }] = await Promise.all([
    supabase.from("v_proyectos_resumen").select("*").order("fecha_fin", { nullsFirst: false }),
    supabase.from("perfiles").select("id, nombre"),
    esAdmin ? supabase.from("proyecto_finanzas").select("*") : Promise.resolve({ data: [] as never[] }),
    supabase.from("kpis").select("id, nombre, unidad, objetivo, valor_base, sentido, proyecto_id, kpi_valores(periodo, valor)"),
    supabase.from("eventos").select("*, proyectos(titulo)").gte("inicio", madridAISO(diaMadrid(ahora))).lte("inicio", en14.toISOString()).order("inicio"),
    supabase.from("v_productos_precio").select("id, nombre, unidad, precio_actual, precio_anterior, variacion_pct, fecha_precio, negocio_id").gte("variacion_pct", 5).gte("fecha_precio", hace60).order("variacion_pct", { ascending: false }).limit(8),
    supabase.from("facturas").select("negocio_id").eq("estado", "pendiente"),
  ]);
  const { data: porCobrar } = esAdmin ? await supabase.from("facturas_emitidas").select("base, iva_pct, irpf_pct, vencimiento").eq("estado", "pendiente") : { data: [] };
  const cobroPend = (porCobrar ?? []).reduce((s, f) => s + Number(f.base) * (1 + Number(f.iva_pct) / 100 - Number(f.irpf_pct) / 100), 0);
  const cobroVencido = (porCobrar ?? []).filter((f) => f.vencimiento && f.vencimiento < hoyISO()).length;
  const proyectoDeNegocio = (nid: string | null) => (proyectos ?? []).find((p) => p.negocio_id === nid && p.estado !== "cerrado");
  const nombre = (id: string | null) => perfiles?.find((p) => p.id === id)?.nombre ?? "—";
  const activos = (proyectos ?? []).filter((p) => p.estado !== "cerrado");
  const vencidas = activos.reduce((a, p) => a + (p.tareas_vencidas ?? 0), 0);
  const horasC = (finanzas ?? []).filter((f) => activos.some((p) => p.id === f.proyecto_id)).reduce((a, f) => a + Number(f.horas_consumidas), 0);
  const horasP = (finanzas ?? []).filter((f) => activos.some((p) => p.id === f.proyecto_id)).reduce((a, f) => a + Number(f.horas_presupuestadas), 0);
  const facturable = (finanzas ?? []).filter((f) => activos.some((p) => p.id === f.proyecto_id)).reduce((a, f) => a + Number(f.importe_presupuestado), 0);

  const alertas = (kpis ?? []).flatMap((k) => {
    if (!activos.some((p) => p.id === k.proyecto_id)) return [];
    const ult = [...(k.kpi_valores ?? [])].sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
    const e = estadoKpi(ult?.valor, k.objetivo, k.valor_base, k.sentido);
    return e === "ok" || e === "neutro" ? [] : [{ k, ult, e, p: activos.find((p) => p.id === k.proyecto_id)! }];
  });
  const columnas = ["diagnostico", "en_curso", "seguimiento"] as const;

  return (
    <>
      <Cabecera eyebrow={ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        titulo={`Hola, ${perfil.nombre.split(" ")[0]}`} sub="Estado de todos tus proyectos, lo que vence y los indicadores que se han salido del objetivo." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Proyectos activos" valor={activos.length} ayuda={columnas.map((c) => `${activos.filter((p) => p.estado === c).length} ${ESTADOS_PROYECTO[c].toLowerCase()}`).join(" · ")} />
        {esAdmin
          ? <Kpi label="Pendiente de cobro" valor={eur(cobroPend)} tono={cobroVencido ? "bad" : undefined} ayuda={`${cobroVencido ? `${cobroVencido} facturas vencidas · ` : ""}${numero(horasC, 0)} de ${numero(horasP, 0)} h consumidas · ${eur(facturable)} en cartera`} />
          : <Kpi label="Tareas abiertas" valor={activos.reduce((a, p) => a + (p.tareas_total ?? 0) - (p.tareas_hechas ?? 0), 0)} />}
        <Kpi label="Tareas vencidas" valor={vencidas} tono={vencidas ? "bad" : "ok"} ayuda="sin cerrar y fuera de fecha" />
        <Kpi label="Alertas" valor={alertas.length + (subidas?.length ?? 0)} tono={alertas.length + (subidas?.length ?? 0) ? "warn" : "ok"} ayuda={`${alertas.length} KPIs fuera de objetivo · ${subidas?.length ?? 0} subidas de precio · ${porRevisar?.length ?? 0} facturas por revisar`} />
      </div>

      <div className="grid gap-4">
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pt-5"><CardTitle>Proyectos</CardTitle><Link href="/proyectos" className="text-sm text-primary-ink hover:underline">Ver tablero</Link></div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2">Proyecto</th><th className="px-2 py-2">Estado</th><th className="px-2 py-2">Fase</th><th className="px-2 py-2">Responsable</th><th className="px-2 py-2">Entrega</th><th className="px-2 py-2">Progreso</th><th className="px-5 py-2">Salud</th>
              </tr></thead>
              <tbody>
                {activos.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/60">
                    <td className="px-5 py-3"><Link href={`/proyectos/${p.id}`} className="font-semibold hover:text-primary-ink">{p.titulo}</Link><p className="text-xs text-muted-foreground">{p.negocio_nombre}</p></td>
                    <td className="px-2"><EstadoProyecto estado={p.estado!} /></td>
                    <td className="px-2 text-muted-foreground">{p.fase_actual ?? "—"}</td>
                    <td className="px-2">{nombre(p.responsable_id)}</td>
                    <td className="tnum whitespace-nowrap px-2">{fecha(p.fecha_fin)}</td>
                    <td className="px-2"><Progreso hechas={p.tareas_hechas ?? 0} total={p.tareas_total ?? 0} /></td>
                    <td className="px-5"><Semaforo salud={p.salud!} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!activos.length && <div className="p-5"><Vacio titulo="Sin proyectos activos">Crea el primero desde Proyectos.</Vacio></div>}
          </div>
        </Card>

        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-4" />Próximos 14 días</CardTitle><Link href="/agenda" className="text-sm text-primary-ink hover:underline">Agenda</Link></CardHeader>
            {eventos?.length ? (
              <ul className="divide-y">
                {eventos.map((e) => (
                  <li key={e.id} className="flex gap-3 py-2.5">
                    <div className="w-12 shrink-0 text-center font-mono"><p className="text-[10px] uppercase text-muted-foreground">{fecha(e.inicio, { weekday: "short" })}</p><p className="text-lg font-bold leading-tight">{fecha(e.inicio, { day: "numeric" })}</p></div>
                    <div className="min-w-0"><p className="font-medium">{e.titulo}</p><p className="text-xs text-muted-foreground">{TIPOS_EVENTO[e.tipo]} · {e.todo_el_dia ? "Todo el día" : hora(e.inicio)}{e.lugar ? ` · ${e.lugar}` : ""}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Nada en agenda.</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4" />Alertas de KPIs</CardTitle></CardHeader>
            {alertas.length ? (
              <ul className="divide-y">
                {alertas.map(({ k, ult, e, p }) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0"><Link href={`/proyectos/${p.id}/plan`} className="font-medium hover:text-primary-ink">{k.nombre}</Link><p className="text-xs text-muted-foreground">{p.negocio_nombre} · objetivo {valorKpi(k.objetivo, k.unidad)}{ult ? ` · ${fechaCorta(ult.periodo)}` : ""}</p></div>
                    <Badge tono={e === "bad" ? "bad" : "warn"}>{valorKpi(ult?.valor, k.unidad)}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Todos los indicadores están en objetivo.</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Subidas de precio</CardTitle><span className="text-xs text-muted-foreground">≥ 5 % · últimos 60 días</span></CardHeader>
            {subidas?.length ? (
              <ul className="divide-y">
                {subidas.map((x) => {
                  const p = proyectoDeNegocio(x.negocio_id);
                  return (
                    <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">{p ? <Link href={`/proyectos/${p.id}/costes?v=productos`} className="font-medium hover:text-primary-ink">{x.nombre}</Link> : <span className="font-medium">{x.nombre}</span>}
                        <p className="text-xs text-muted-foreground">{p?.negocio_nombre ?? ""} · {eur(Number(x.precio_anterior), 2)} → {eur(Number(x.precio_actual), 2)}/{x.unidad}</p></div>
                      <Badge tono="bad">+{numero(Number(x.variacion_pct), 1)} %</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Sin subidas relevantes.</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Entregas</CardTitle></CardHeader>
            <ul className="divide-y">
              {activos.filter((p) => p.fecha_fin).slice(0, 5).map((p) => {
                const d = diasHasta(p.fecha_fin!);
                return <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate">{p.negocio_nombre}</span><Badge tono={d < 0 ? "bad" : d <= 14 ? "warn" : "neutro"}>{d < 0 ? `vencido hace ${-d} d` : `en ${d} d`}</Badge></li>;
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
