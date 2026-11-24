"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const datos = (fd: FormData) => ({
  nombre: txt(fd, "nombre") ?? "Sin nombre", tipo: (txt(fd, "tipo") ?? "restaurante") as E["tipo_negocio"],
  grupo: txt(fd, "grupo"), direccion: txt(fd, "direccion"), localidad: txt(fd, "localidad"), provincia: txt(fd, "provincia"),
  aforo: num(fd, "aforo"), horarios: txt(fd, "horarios"), ticket_medio: num(fd, "ticket_medio"), plantilla: num(fd, "plantilla"),
  food_cost_objetivo: (num(fd, "food_cost_objetivo") ?? 30) / 100, notas: txt(fd, "notas"),
});

export async function crearNegocio(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const { data, error } = await supabase.from("negocios").insert({ organizacion_id: perfil.organizacion_id, ...datos(fd) }).select("id").single();
  revalidatePath("/negocios");
  return error ? err(error) : { ok: true, id: data.id };
}
export async function actualizarNegocio(id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("negocios").update(datos(fd)).eq("id", id);
  revalidatePath(`/negocios/${id}`);
  return err(error);
}
export async function crearContacto(negocio_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("contactos").insert({
    negocio_id, nombre: txt(fd, "nombre") ?? "Contacto", cargo: txt(fd, "cargo"), email: txt(fd, "email"), telefono: txt(fd, "telefono"), principal: bool(fd, "principal"),
  });
  revalidatePath(`/negocios/${negocio_id}`);
  return err(error);
}
export async function borrarContacto(negocio_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("contactos").delete().eq("id", id);
  revalidatePath(`/negocios/${negocio_id}`);
  return err(error);
}

/** Lista recursiva de archivos bajo una carpeta del almacén. */
async function archivosBajo(supabase: Awaited<ReturnType<typeof getSesion>>["supabase"], carpeta: string): Promise<string[]> {
  const { data } = await supabase.storage.from("documentos").list(carpeta, { limit: 1000 });
  const out: string[] = [];
  for (const x of data ?? []) {
    const ruta = `${carpeta}/${x.name}`;
    if (x.id) out.push(ruta); else out.push(...(await archivosBajo(supabase, ruta)));
  }
  return out;
}

/**
 * Borra un cliente y todo lo suyo: proyectos, diagnóstico, plan, documentos, compras, escandallos, ventas…
 * Se conservan las facturas que le has emitido (obligación fiscal) y tus horas (pasan a trabajo interno).
 */
export async function borrarNegocio(id: string, fd: FormData): Promise<Res> {
  const { supabase, esAdmin } = await getSesion();
  if (!esAdmin) return { ok: false, error: "Solo el administrador puede borrar clientes." };
  const { data: n } = await supabase.from("negocios").select("nombre").eq("id", id).single();
  if (!n) return { ok: false, error: "No se encuentra el cliente." };
  if ((txt(fd, "confirmacion") ?? "").trim().toLowerCase() !== n.nombre.trim().toLowerCase()) {
    return { ok: false, error: `Escribe exactamente «${n.nombre}» para confirmar.` };
  }
  const { data: proyectos } = await supabase.from("proyectos").select("id, titulo").eq("negocio_id", id);
  // Conservar horas y facturas emitidas con el nombre del cliente
  for (const p of proyectos ?? []) {
    const { data: hs } = await supabase.from("horas").select("id, descripcion").eq("proyecto_id", p.id);
    for (const h of hs ?? []) await supabase.from("horas").update({ descripcion: `[${n.nombre} · ${p.titulo}] ${h.descripcion ?? ""}`.trim() }).eq("id", h.id);
  }
  await supabase.from("facturas_emitidas").update({ cliente_nombre: n.nombre }).eq("negocio_id", id).is("cliente_nombre", null);
  // Archivos del almacén (documentos, fotos, facturas y recetas subidas)
  const rutas = [...(await archivosBajo(supabase, `negocios/${id}`)), ...(await Promise.all((proyectos ?? []).map((p) => archivosBajo(supabase, `proyectos/${p.id}`)))).flat()];
  for (let i = 0; i < rutas.length; i += 100) await supabase.storage.from("documentos").remove(rutas.slice(i, i + 100));
  const { error } = await supabase.from("negocios").delete().eq("id", id);
  if (error) return err(error);
  revalidatePath("/", "layout");
  return { ok: true };
}
