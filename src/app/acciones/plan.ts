"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const rv = (p: string) => revalidatePath(`/proyectos/${p}`, "layout");

/** "yo" → la tarea es mía; "ext:Nombre" → la hace alguien del cliente. */
function responsable(fd: FormData, yo: string): { responsable_id: string | null; responsable_externo: string | null } {
  const v = txt(fd, "responsable");
  if (v === "yo") return { responsable_id: yo, responsable_externo: null };
  if (v?.startsWith("ext:")) return { responsable_id: null, responsable_externo: v.slice(4) };
  return { responsable_id: null, responsable_externo: null };
}

export async function guardarKpi(proyecto_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const fila = {
    proyecto_id, nombre: txt(fd, "nombre") ?? "KPI", codigo: txt(fd, "codigo"), unidad: txt(fd, "unidad") ?? "%",
    valor_base: num(fd, "valor_base"), objetivo: num(fd, "objetivo"), sentido: (txt(fd, "sentido") ?? "bajar") as E["sentido_kpi"],
    visible_cliente: bool(fd, "visible_cliente"),
  };
  const { error } = id ? await supabase.from("kpis").update(fila).eq("id", id) : await supabase.from("kpis").insert(fila);
  rv(proyecto_id);
  return err(error);
}
export async function registrarValorKpi(proyecto_id: string, kpi_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const valor = num(fd, "valor"); const mesSel = txt(fd, "periodo");
  if (valor == null || !mesSel) return { ok: false, error: "Indica mes y valor." };
  const { error } = await supabase.from("kpi_valores").upsert({ kpi_id, periodo: mesSel + "-01", valor, nota: txt(fd, "nota") }, { onConflict: "kpi_id,periodo" });
  rv(proyecto_id);
  return err(error);
}
export async function borrarKpi(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("kpis").delete().eq("id", id);
  rv(proyecto_id);
  return err(error);
}

export async function guardarAccion(proyecto_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase, user } = await getSesion();
  const fila = {
    proyecto_id, titulo: txt(fd, "titulo") ?? "Acción", descripcion: txt(fd, "descripcion"),
    fase_pdca: (txt(fd, "fase_pdca") ?? "planificar") as E["fase_pdca"], ...responsable(fd, user.id),
    fecha_objetivo: txt(fd, "fecha_objetivo"), prioridad: (txt(fd, "prioridad") ?? "media") as E["prioridad"],
    kpi_id: txt(fd, "kpi_id"), hallazgo_id: txt(fd, "hallazgo_id"), resultado: txt(fd, "resultado"), visible_cliente: bool(fd, "visible_cliente"),
  };
  const { error } = id ? await supabase.from("acciones").update(fila).eq("id", id) : await supabase.from("acciones").insert(fila);
  rv(proyecto_id);
  return err(error);
}
export async function moverAccion(proyecto_id: string, id: string, fase_pdca: E["fase_pdca"]): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("acciones").update({ fase_pdca }).eq("id", id);
  rv(proyecto_id);
  return err(error);
}
export async function borrarAccion(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("acciones").delete().eq("id", id);
  rv(proyecto_id);
  return err(error);
}

export async function guardarTarea(proyecto_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase, user } = await getSesion();
  const fila = {
    proyecto_id, titulo: txt(fd, "titulo") ?? "Tarea", descripcion: txt(fd, "descripcion"),
    estado: (txt(fd, "estado") ?? "pendiente") as E["estado_tarea"], prioridad: (txt(fd, "prioridad") ?? "media") as E["prioridad"],
    ...responsable(fd, user.id), vence: txt(fd, "vence"), accion_id: txt(fd, "accion_id"),
  };
  const { error } = id ? await supabase.from("tareas").update(fila).eq("id", id) : await supabase.from("tareas").insert(fila);
  rv(proyecto_id);
  return err(error);
}
export async function estadoTarea(proyecto_id: string, id: string, estado: E["estado_tarea"]): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("tareas").update({ estado }).eq("id", id);
  rv(proyecto_id);
  return err(error);
}
export async function borrarTarea(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("tareas").delete().eq("id", id);
  rv(proyecto_id);
  return err(error);
}

export async function comentar(proyecto_id: string, entidad: E["entidad_comentario"], entidad_id: string, fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const texto = txt(fd, "texto");
  if (!texto) return { ok: false, error: "Escribe el comentario." };
  const { error } = await supabase.from("comentarios").insert({ proyecto_id, entidad, entidad_id, texto, autor_id: perfil.id });
  rv(proyecto_id);
  return err(error);
}
