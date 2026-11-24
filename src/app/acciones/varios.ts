"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

// ---------- Actas ----------
export async function crearActa(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const acuerdos = String(fd.get("acuerdos") ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [texto, responsable] = l.split("|").map((x) => x.trim()); return { texto, responsable: responsable ?? "", hecho: false }; });
  const { data, error } = await supabase.from("actas").insert({
    proyecto_id, titulo: txt(fd, "titulo") ?? "Reunión", fecha: txt(fd, "fecha") ?? undefined, asistentes: txt(fd, "asistentes"),
    contenido: txt(fd, "contenido"), acuerdos, visible_cliente: bool(fd, "visible_cliente"), creado_por: perfil.id,
  }).select("id").single();
  if (error) return err(error);
  if (bool(fd, "crear_tareas") && acuerdos.length) {
    await supabase.from("tareas").insert(acuerdos.map((a) => ({ proyecto_id, titulo: a.texto, descripcion: a.responsable ? `Responsable acordado: ${a.responsable}` : null })));
  }
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return { ok: true, id: data.id };
}
export async function borrarActa(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("actas").delete().eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/actas`);
  return err(error);
}

// ---------- Agenda ----------
export async function crearEvento(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const dia = txt(fd, "dia"); const ini = txt(fd, "hora_inicio") ?? "10:00"; const fin = txt(fd, "hora_fin");
  if (!dia) return { ok: false, error: "Indica el día." };
  // El navegador envía su desfase horario (getTimezoneOffset) para guardar la hora local en UTC
  const off = num(fd, "tz_offset") ?? 0;
  const ajusta = (h: string) => new Date(new Date(`${dia}T${h}:00Z`).getTime() + off * 60000).toISOString();
  const { error } = await supabase.from("eventos").insert({
    organizacion_id: perfil.organizacion_id, proyecto_id: txt(fd, "proyecto_id"), tipo: (txt(fd, "tipo") ?? "visita") as E["tipo_evento"],
    titulo: txt(fd, "titulo") ?? "Evento", inicio: ajusta(ini), fin: fin ? ajusta(fin) : null, lugar: txt(fd, "lugar"), notas: txt(fd, "notas"), creado_por: perfil.id,
  });
  revalidatePath("/agenda"); revalidatePath("/panel");
  return err(error);
}
export async function borrarEvento(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  revalidatePath("/agenda"); revalidatePath("/panel");
  return err(error);
}

// ---------- Equipo y organización ----------
export async function guardarOrganizacion(fd: FormData): Promise<Res> {
  const { supabase, perfil, esAdmin } = await getSesion();
  if (!esAdmin) return { ok: false, error: "Solo un administrador puede cambiar estos datos." };
  const { error } = await supabase.from("organizaciones").update({ nombre: txt(fd, "nombre") ?? "Mi consultora" }).eq("id", perfil.organizacion_id);
  revalidatePath("/ajustes");
  return err(error);
}

export async function guardarPerfil(fd: FormData): Promise<Res> {
  const { supabase, user } = await getSesion();
  const { error } = await supabase.from("perfiles").update({ nombre: txt(fd, "nombre") ?? "", telefono: txt(fd, "telefono"), tarifa_hora: num(fd, "tarifa_hora") }).eq("id", user.id);
  revalidatePath("/", "layout");
  return err(error);
}
