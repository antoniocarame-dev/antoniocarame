import "server-only";
import { notFound } from "next/navigation";
import { getSesion } from "./sesion";
import { calcularEscandallos, type Escandallo } from "./costes";

/** El negocio al que pertenece un proyecto (compras y escandallos son del negocio, no del proyecto). */
export async function negocioDeProyecto(proyectoId: string) {
  const s = await getSesion();
  const { data } = await s.supabase.from("proyectos").select("negocio_id, negocios(*)").eq("id", proyectoId).maybeSingle();
  if (!data?.negocios) notFound();
  return { ...s, negocio: data.negocios };
}

/** Productos con último precio, escandallos con sus ingredientes y el cálculo de todos ellos. */
export async function cargarEscandallos(proyectoId: string) {
  const s = await negocioDeProyecto(proyectoId);
  const nid = s.negocio.id;
  const [{ data: productos }, { data: escandallos }, { data: ventas }] = await Promise.all([
    s.supabase.from("v_productos_precio").select("*").eq("negocio_id", nid).order("nombre"),
    s.supabase.from("escandallos").select("*, ingredientes_escandallo!ingredientes_escandallo_escandallo_id_fkey(*)").eq("negocio_id", nid).order("categoria").order("nombre"),
    s.supabase.from("ventas_plato").select("*, escandallos!inner(negocio_id)").eq("escandallos.negocio_id", nid),
  ]);
  const objetivo = Number(s.negocio.food_cost_objetivo ?? 0.3);
  const calculos = calcularEscandallos((escandallos ?? []) as Escandallo[], productos ?? [], objetivo);
  return { ...s, productos: productos ?? [], escandallos: (escandallos ?? []) as Escandallo[], ventas: ventas ?? [], calculos, objetivo };
}
