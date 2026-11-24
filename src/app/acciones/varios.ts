"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
import { horaMadrid, madridAISO } from "@/lib/utils";
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
function filaEvento(fd: FormData): { ok: false; error: string } | { ok: true; fila: { proyecto_id: string | null; tipo: E["tipo_evento"]; titulo: string; inicio: string; fin: string | null; lugar: string | null; notas: string | null; todo_el_dia: boolean } } {
  const dia = txt(fd, "dia");
  if (!dia) return { ok: false, error: "Indica el día." };
  const todo = bool(fd, "todo_el_dia");
  const ini = txt(fd, "hora_inicio") ?? "10:00"; const fin = txt(fd, "hora_fin");
  const diaFin = txt(fd, "dia_fin");
  if (diaFin && diaFin < dia) return { ok: false, error: "El último día no puede ser anterior al primero." };
  if (!todo && fin && !diaFin && fin <= ini) return { ok: false, error: "La hora de fin debe ser posterior a la de inicio." };
  return { ok: true, fila: {
    proyecto_id: txt(fd, "proyecto_id"), tipo: (txt(fd, "tipo") ?? "visita") as E["tipo_evento"], titulo: txt(fd, "titulo") ?? "Evento",
    inicio: madridAISO(dia, todo ? "00:00" : ini),
    fin: todo ? (diaFin && diaFin > dia ? madridAISO(diaFin, "00:00") : null) : fin ? madridAISO(diaFin ?? dia, fin) : null,
    lugar: txt(fd, "lugar"), notas: txt(fd, "notas"), todo_el_dia: todo,
  } };
}
const refrescarAgenda = () => { revalidatePath("/agenda"); revalidatePath("/panel"); };

export async function crearEvento(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const f = filaEvento(fd); if (!f.ok) return f;
  const { data, error } = await supabase.from("eventos").insert({ ...f.fila, organizacion_id: perfil.organizacion_id, creado_por: perfil.id }).select("id").single();
  refrescarAgenda();
  return error ? err(error) : { ok: true, id: data.id };
}
export async function actualizarEvento(id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const f = filaEvento(fd); if (!f.ok) return f;
  const { error } = await supabase.from("eventos").update(f.fila).eq("id", id);
  refrescarAgenda();
  return err(error);
}
/** Mueve un evento a otro día conservando la hora y la duración. */
export async function moverEvento(id: string, dia: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { data: e } = await supabase.from("eventos").select("inicio, fin, todo_el_dia").eq("id", id).single();
  if (!e) return { ok: false, error: "No se encuentra el evento." };
  const inicio = madridAISO(dia, e.todo_el_dia ? "00:00" : horaMadrid(e.inicio));
  const fin = e.fin ? new Date(new Date(inicio).getTime() + (new Date(e.fin).getTime() - new Date(e.inicio).getTime())).toISOString() : null;
  const { error } = await supabase.from("eventos").update({ inicio, fin }).eq("id", id);
  refrescarAgenda();
  return err(error);
}
export async function borrarEvento(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  refrescarAgenda();
  return err(error);
}

// ---------- Equipo y organización ----------
export async function guardarOrganizacion(fd: FormData): Promise<Res> {
  const { supabase, perfil, esAdmin } = await getSesion();
  if (!esAdmin) return { ok: false, error: "Solo un administrador puede cambiar estos datos." };
  const { data: org } = await supabase.from("organizaciones").select("ajustes").eq("id", perfil.organizacion_id).single();
  const ajustes = { ...((org?.ajustes ?? {}) as Record<string, unknown>), irpf_pct: num(fd, "irpf_pct") ?? 0 };
  const { error } = await supabase.from("organizaciones").update({ nombre: txt(fd, "nombre") ?? "Mi consultora", ajustes }).eq("id", perfil.organizacion_id);
  revalidatePath("/ajustes");
  return err(error);
}

export async function guardarPerfil(fd: FormData): Promise<Res> {
  const { supabase, user } = await getSesion();
  const { error } = await supabase.from("perfiles").update({ nombre: txt(fd, "nombre") ?? "", telefono: txt(fd, "telefono"), tarifa_hora: num(fd, "tarifa_hora") }).eq("id", user.id);
  revalidatePath("/", "layout");
  return err(error);
}
