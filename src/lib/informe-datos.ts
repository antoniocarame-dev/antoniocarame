import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { cargarEscandallos } from "./negocio";
import { agregar, cuentaResultados } from "./resultados";
import { AREAS, estadoKpi } from "./utils";

/** Todo lo que necesita un informe (página, PDF y redacción automática), en un solo sitio. */
export async function cargarInforme(supabase: SupabaseClient<Database>, id: string) {
  const { data: inf } = await supabase.from("informes").select("*").eq("id", id).maybeSingle();
  if (!inf) return null;
  const pid = inf.proyecto_id;
  const desde = inf.periodo_desde ?? "1900-01-01", hasta = inf.periodo_hasta ?? "2999-12-31";
  const [{ data: p }, { data: org }, { data: fases }, { data: tareas }, { data: kpis }, { data: auditorias }, { data: hallazgos }, { data: acciones }, { data: estandares }, { data: formaciones }, { data: actas }] = await Promise.all([
    supabase.from("proyectos").select("*, negocios(*)").eq("id", pid).single(),
    supabase.from("organizaciones").select("nombre").single(),
    supabase.from("fases").select("*").eq("proyecto_id", pid).order("orden"),
    supabase.from("tareas").select("*").eq("proyecto_id", pid),
    supabase.from("kpis").select("*, kpi_valores(periodo, valor)").eq("proyecto_id", pid).eq("visible_cliente", true),
    supabase.from("auditorias").select("area, fecha, puntuacion, titulo").eq("proyecto_id", pid).eq("visible_cliente", true).order("fecha"),
    supabase.from("hallazgos").select("*").eq("proyecto_id", pid).eq("visible_cliente", true).order("impacto", { ascending: false }),
    supabase.from("acciones").select("*").eq("proyecto_id", pid).eq("visible_cliente", true).order("fecha_objetivo"),
    supabase.from("estandares").select("*").eq("proyecto_id", pid).eq("visible_cliente", true),
    supabase.from("formaciones").select("*").eq("proyecto_id", pid).eq("visible_cliente", true).gte("fecha", desde).lte("fecha", hasta).order("fecha"),
    supabase.from("actas").select("*").eq("proyecto_id", pid).eq("visible_cliente", true).gte("fecha", desde).lte("fecha", hasta).order("fecha"),
  ]);
  if (!p?.negocios) return null;
  const neg = p.negocios;
  const sec = new Set(inf.secciones);

  const meses = sec.has("resultados") ? await cuentaResultados(supabase, neg) : [];
  const completos = meses.filter((m) => m.completo);
  const enPeriodo = completos.filter((m) => m.periodo >= desde.slice(0, 7) + "-01" && m.periodo <= hasta);
  const A1 = p.fecha_inicio ? agregar(completos.filter((m) => m.periodo < p.fecha_inicio!)) : null;
  const D1 = agregar((p.fecha_inicio ? completos.filter((m) => m.periodo >= p.fecha_inicio!) : completos).slice(-3));
  const costes = sec.has("costes") ? await cargarEscandallos(pid) : null;
  const resumenCostes = costes && (() => {
    const platos = costes.escandallos.filter((e) => e.tipo === "plato" && costes.calculos.get(e.id)?.foodCost != null);
    const sobre = platos.filter((e) => costes.calculos.get(e.id)!.foodCost! > costes.objetivo)
      .map((e) => { const c = costes.calculos.get(e.id)!; return { id: e.id, nombre: e.nombre, coste: c.costeRacion, pvp: Number(e.pvp), foodCost: c.foodCost!, pvpRecomendado: c.pvpRecomendado }; });
    const subidas = costes.productos.filter((x) => Number(x.variacion_pct ?? 0) >= 5).map((x) => ({ nombre: x.nombre, variacion: Number(x.variacion_pct) }));
    return { platos: platos.length, objetivo: costes.objetivo, sobre, subidas };
  })();

  const porArea = new Map<string, { actual: number; inicial: number }>();
  (auditorias ?? []).filter((a) => a.puntuacion != null).forEach((a) => { const pr = porArea.get(a.area); porArea.set(a.area, { inicial: pr?.inicial ?? Number(a.puntuacion), actual: Number(a.puntuacion) }); });
  const radar = [...porArea].map(([a, v]) => ({ area: AREAS[a as keyof typeof AREAS], ...v }));
  const hechas = (tareas ?? []).filter((t) => t.estado === "hecha").length;
  const pendCliente = (tareas ?? []).filter((t) => t.responsable_externo && t.estado !== "hecha");
  const kpisSerie = (kpis ?? []).map((k) => {
    const serie = [...k.kpi_valores].sort((a, b) => a.periodo.localeCompare(b.periodo)).filter((v) => v.periodo <= hasta);
    const u = serie.at(-1);
    return { ...k, serie, ultimo: u?.valor ?? null, estado: estadoKpi(u?.valor, k.objetivo, k.valor_base, k.sentido) };
  });

  return {
    inf, p, neg, org, sec, desde, hasta, fases: fases ?? [], tareas: tareas ?? [], kpis: kpisSerie, auditorias: auditorias ?? [],
    hallazgos: hallazgos ?? [], acciones: acciones ?? [], estandares: estandares ?? [], formaciones: formaciones ?? [], actas: actas ?? [],
    enPeriodo, A1, D1, costes: resumenCostes, porArea, radar, hechas, pendCliente,
    faseActual: (fases ?? []).find((f) => f.estado === "en_curso")?.nombre ?? null,
  };
}
export type DatosInforme = NonNullable<Awaited<ReturnType<typeof cargarInforme>>>;

export const TITULO_TIPO = { diagnostico: "Informe de diagnóstico", seguimiento: "Informe de seguimiento", cierre: "Informe de cierre" } as const;
