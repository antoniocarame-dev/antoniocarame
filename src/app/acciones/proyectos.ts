"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const FASES_POR_DEFECTO = ["Diagnóstico", "Plan de acción", "Implantación", "Seguimiento"];

export async function crearProyecto(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const negocio_id = txt(fd, "negocio_id");
  if (!negocio_id) return { ok: false, error: "Elige el negocio." };
  const { data, error } = await supabase.from("proyectos").insert({
    organizacion_id: perfil.organizacion_id, negocio_id, titulo: txt(fd, "titulo") ?? "Nuevo proyecto",
    tipo: txt(fd, "tipo") ?? "otro", codigo: txt(fd, "codigo"), responsable_id: txt(fd, "responsable_id") ?? perfil.id,
    fecha_inicio: txt(fd, "fecha_inicio"), fecha_fin: txt(fd, "fecha_fin"), objetivos: txt(fd, "objetivos"),
  }).select("id").single();
  if (error) return err(error);
  await supabase.from("proyecto_miembros").insert({ proyecto_id: data.id, usuario_id: perfil.id, rol: "consultor" });
  await supabase.from("proyecto_finanzas").insert({
    proyecto_id: data.id, horas_presupuestadas: num(fd, "horas") ?? 0, importe_presupuestado: num(fd, "importe") ?? 0, tarifa_hora: perfil.tarifa_hora,
  });
  await supabase.from("fases").insert(FASES_POR_DEFECTO.map((nombre, i) => ({ proyecto_id: data.id, nombre, orden: i + 1, estado: (i === 0 ? "en_curso" : "pendiente") as E["estado_fase"] })));
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function actualizarProyecto(id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("proyectos").update({
    titulo: txt(fd, "titulo") ?? undefined, tipo: txt(fd, "tipo") ?? undefined, codigo: txt(fd, "codigo"),
    estado: (txt(fd, "estado") ?? undefined) as E["estado_proyecto"] | undefined,
    salud: (txt(fd, "salud") ?? undefined) as E["salud_proyecto"] | undefined,
    responsable_id: txt(fd, "responsable_id"), fecha_inicio: txt(fd, "fecha_inicio"), fecha_fin: txt(fd, "fecha_fin"),
    objetivos: txt(fd, "objetivos"), alcance: txt(fd, "alcance"),
  }).eq("id", id);
  revalidatePath("/", "layout");
  return err(error);
}

export async function cambiarEstadoProyecto(id: string, estado: E["estado_proyecto"]): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("proyectos").update({ estado }).eq("id", id);
  revalidatePath("/", "layout");
  return err(error);
}

export async function actualizarFinanzas(id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("proyecto_finanzas").upsert({
    proyecto_id: id, horas_presupuestadas: num(fd, "horas_presupuestadas") ?? 0,
    importe_presupuestado: num(fd, "importe_presupuestado") ?? 0, tarifa_hora: num(fd, "tarifa_hora"),
  });
  revalidatePath(`/proyectos/${id}`);
  return err(error);
}

export async function borrarProyecto(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("proyectos").delete().eq("id", id);
  revalidatePath("/", "layout");
  return err(error);
}

// ---------- Fases e hitos ----------
export async function crearFase(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { count } = await supabase.from("fases").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto_id);
  const { error } = await supabase.from("fases").insert({
    proyecto_id, nombre: txt(fd, "nombre") ?? "Nueva fase", orden: (count ?? 0) + 1,
    fecha_inicio: txt(fd, "fecha_inicio"), fecha_fin: txt(fd, "fecha_fin"),
  });
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return err(error);
}
export async function estadoFase(proyecto_id: string, id: string, estado: E["estado_fase"]): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("fases").update({ estado }).eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return err(error);
}
export async function borrarFase(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("fases").delete().eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return err(error);
}
export async function crearHito(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("hitos").insert({ proyecto_id, titulo: txt(fd, "titulo") ?? "Hito", fecha: txt(fd, "fecha") });
  revalidatePath(`/proyectos/${proyecto_id}`);
  return err(error);
}
export async function toggleHito(proyecto_id: string, id: string, completado: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("hitos").update({ completado }).eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}`);
  return err(error);
}

