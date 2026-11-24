"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { cuentaResultados } from "@/lib/resultados";
import { emparejarProducto } from "@/lib/texto";
import { err, num, txt, type Res } from "./comun";

const rv = () => revalidatePath("/proyectos", "layout");

export async function guardarCuenta(negocio_id: string, periodo: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("cuentas_resultados").upsert({
    negocio_id, periodo, ventas_netas: num(fd, "ventas_netas"), coste_mp: num(fd, "coste_mp"), personal: num(fd, "personal"),
    alquiler: num(fd, "alquiler"), suministros: num(fd, "suministros"), otros_gastos: num(fd, "otros_gastos"), notas: txt(fd, "notas"),
    updated_at: new Date().toISOString(),
  }, { onConflict: "negocio_id,periodo" });
  rv();
  return err(error);
}

export async function guardarOperacion(negocio_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("negocios").update({
    aforo: num(fd, "aforo"), horas_apertura_dia: num(fd, "horas_apertura_dia") ?? 8, servicios_dia: num(fd, "servicios_dia") ?? 2,
  }).eq("id", negocio_id);
  rv();
  return err(error);
}

export type FilaVenta = { fecha: string; ventas_netas: number; tickets: number | null; cubiertos: number | null };

/** Importa ventas diarias (ya leídas del CSV en el navegador). Si un día existe, se sustituye. */
export async function importarVentas(negocio_id: string, filas: FilaVenta[]): Promise<Res & { n?: number }> {
  const { supabase } = await getSesion();
  const validas = filas.filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.fecha) && Number.isFinite(f.ventas_netas) && f.ventas_netas >= 0);
  if (!validas.length) return { ok: false, error: "No hay filas válidas: revisa las columnas de fecha y ventas." };
  const { error } = await supabase.from("ventas_diarias").upsert(validas.map((f) => ({ negocio_id, ...f, fuente: "csv" })), { onConflict: "negocio_id,fecha" });
  rv();
  return error ? err(error) : { ok: true, n: validas.length };
}

export async function guardarDia(negocio_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const fecha = txt(fd, "fecha"), ventas = num(fd, "ventas_netas");
  if (!fecha || ventas == null) return { ok: false, error: "Indica fecha y ventas." };
  const { error } = await supabase.from("ventas_diarias").upsert({ negocio_id, fecha, ventas_netas: ventas, tickets: num(fd, "tickets"), cubiertos: num(fd, "cubiertos"), fuente: "manual" }, { onConflict: "negocio_id,fecha" });
  rv();
  return err(error);
}

/** Importa unidades vendidas por plato de un mes, emparejando los nombres del TPV con los escandallos. */
export async function importarVentasPlato(negocio_id: string, periodo: string, filas: { nombre: string; unidades: number }[]): Promise<Res & { n?: number; sinPareja?: string[] }> {
  const { supabase } = await getSesion();
  const { data: platos } = await supabase.from("escandallos").select("id, nombre").eq("negocio_id", negocio_id).eq("tipo", "plato");
  const acumulado = new Map<string, number>();
  const sinPareja: string[] = [];
  for (const f of filas) {
    const exacto = platos?.find((p) => p.nombre.toLowerCase() === f.nombre.trim().toLowerCase())?.id;
    const id = exacto ?? emparejarProducto(f.nombre, platos ?? []);
    if (id) acumulado.set(id, (acumulado.get(id) ?? 0) + Math.round(f.unidades)); else sinPareja.push(f.nombre);
  }
  if (!acumulado.size) return { ok: false, error: "Ningún artículo coincide con tus platos escandallados.", sinPareja };
  const { error } = await supabase.from("ventas_plato").upsert([...acumulado].map(([escandallo_id, unidades]) => ({ escandallo_id, periodo: periodo + "-01", unidades })), { onConflict: "escandallo_id,periodo" });
  rv();
  return error ? err(error) : { ok: true, n: acumulado.size, sinPareja };
}

const MAPA: Record<string, (m: Awaited<ReturnType<typeof cuentaResultados>>[number]) => number | null> = {
  food_cost: (m) => m.kpi.food_cost && m.kpi.food_cost * 100, labour_cost: (m) => m.kpi.labour_cost && m.kpi.labour_cost * 100,
  prime_cost: (m) => m.kpi.prime_cost && m.kpi.prime_cost * 100, mermas: (m) => m.kpi.mermas && m.kpi.mermas * 100,
  ticket_medio: (m) => m.kpi.ticket_medio, revpash: (m) => m.kpi.revpash, rotacion_mesas: (m) => m.kpi.rotacion,
  ebitda_pct: (m) => m.kpi.ebitda_pct && m.kpi.ebitda_pct * 100,
};

/** Vuelca los KPIs calculados de los meses cerrados en los KPIs del proyecto (los que tienen código reconocido). */
export async function actualizarKpisProyecto(proyecto_id: string): Promise<Res & { n?: number }> {
  const { supabase } = await getSesion();
  const { data: p } = await supabase.from("proyectos").select("negocios(*)").eq("id", proyecto_id).single();
  if (!p?.negocios) return { ok: false, error: "No se encuentra el negocio." };
  const [meses, { data: kpis }] = await Promise.all([cuentaResultados(supabase, p.negocios), supabase.from("kpis").select("id, codigo").eq("proyecto_id", proyecto_id)]);
  const filas = (kpis ?? []).flatMap((k) => {
    const f = k.codigo ? MAPA[k.codigo] : undefined;
    if (!f) return [];
    return meses.filter((m) => !m.enCurso).flatMap((m) => {
      const v = f(m);
      return v == null ? [] : [{ kpi_id: k.id, periodo: m.periodo, valor: Math.round(v * 100) / 100, fuente: "automatica" }];
    });
  });
  if (!filas.length) return { ok: false, error: "No hay KPIs del proyecto con código reconocido (food cost, labour cost, prime cost, ticket medio, mermas, RevPASH…) o faltan meses cerrados." };
  const { error } = await supabase.from("kpi_valores").upsert(filas, { onConflict: "kpi_id,periodo" });
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return error ? err(error) : { ok: true, n: filas.length };
}
