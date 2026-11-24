"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const rv = () => revalidatePath("/proyectos", "layout");

/** Abre un recuento con todos los productos activos del negocio. */
export async function crearInventario(negocio_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const fecha = txt(fd, "fecha") ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("inventarios").insert({ negocio_id, fecha, nombre: txt(fd, "nombre") ?? `Inventario ${fecha}` }).select("id").single();
  if (error) return err(error);
  const { data: prods } = await supabase.from("productos").select("id").eq("negocio_id", negocio_id).eq("activo", true);
  if (prods?.length) await supabase.from("inventario_lineas").insert(prods.map((p) => ({ inventario_id: data.id, producto_id: p.id })));
  rv();
  return { ok: true, id: data.id };
}

export async function contarLinea(inventario_id: string, producto_id: string, cantidad: number | null): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("inventario_lineas").update({ cantidad }).eq("inventario_id", inventario_id).eq("producto_id", producto_id);
  return err(error);
}

export async function cerrarInventario(id: string, cerrar: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = cerrar
    ? await supabase.rpc("cerrar_inventario", { inv: id })
    : await supabase.from("inventarios").update({ estado: "abierto" }).eq("id", id);
  rv();
  return err(error);
}

export async function borrarInventario(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("inventarios").delete().eq("id", id);
  rv();
  return err(error);
}

/** Registra una merma valorándola al precio actual (producto) o al coste del escandallo (raciones). */
export async function registrarMerma(negocio_id: string, fd: FormData, costeRacion: Record<string, number>): Promise<Res> {
  const { supabase } = await getSesion();
  const origen = txt(fd, "origen");
  const cantidad = num(fd, "cantidad");
  if (!origen || !cantidad || cantidad <= 0) return { ok: false, error: "Indica qué se ha perdido y cuánto." };
  let coste = 0;
  let producto_id: string | null = null, escandallo_id: string | null = null;
  if (origen.startsWith("p:")) {
    producto_id = origen.slice(2);
    const { data: p } = await supabase.from("v_productos_precio").select("precio_actual, merma_pct").eq("id", producto_id).single();
    coste = cantidad * Number(p?.precio_actual ?? 0);
  } else {
    escandallo_id = origen.slice(2);
    coste = cantidad * (costeRacion[escandallo_id] ?? 0);
  }
  const { error } = await supabase.from("mermas").insert({
    negocio_id, producto_id, escandallo_id, cantidad, coste: Math.round(coste * 100) / 100,
    motivo: (txt(fd, "motivo") ?? "otro") as E["motivo_merma"], fecha: txt(fd, "fecha") ?? undefined, notas: txt(fd, "notas"),
  });
  rv();
  return err(error);
}

export async function borrarMerma(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("mermas").delete().eq("id", id);
  rv();
  return err(error);
}
