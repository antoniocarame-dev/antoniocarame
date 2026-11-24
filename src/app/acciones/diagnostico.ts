"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
import type { ContenidoAuditoria } from "@/lib/utils";
import { PLANTILLAS_BASE } from "@/lib/plantillas-base";
type E = Database["public"]["Enums"];

export async function crearAuditoria(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const plantilla_id = txt(fd, "plantilla_id");
  if (!plantilla_id) return { ok: false, error: "Elige una plantilla." };
  const { data: pl, error: e1 } = await supabase.from("plantillas").select("*").eq("id", plantilla_id).single();
  if (e1 || !pl) return err(e1);
  const { data, error } = await supabase.from("auditorias").insert({
    proyecto_id, plantilla_id, area: pl.area ?? "cocina", titulo: txt(fd, "titulo") ?? pl.nombre,
    fecha: txt(fd, "fecha") ?? undefined, auditor_id: perfil.id, contenido: pl.contenido,
  }).select("id").single();
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`);
  return error ? err(error) : { ok: true, id: data.id };
}

export async function guardarRespuesta(proyecto_id: string, auditoria_id: string, item_id: string,
  cambios: { valor?: number | null; nota?: string | null; foto_path?: string | null }): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("auditoria_respuestas")
    .upsert({ auditoria_id, item_id, ...cambios, updated_at: new Date().toISOString() }, { onConflict: "auditoria_id,item_id" });
  if (error) return err(error);
  await supabase.rpc("recalcular_puntuacion", { a: auditoria_id });
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`, "layout");
  return { ok: true };
}

/** Desde un punto de la auditoría: apunta lo que necesita el local como observación del diagnóstico. */
export async function anotarNecesidad(proyecto_id: string, auditoria_id: string, texto: string, punto: string): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  if (!texto.trim()) return { ok: false, error: "Escribe qué necesitan." };
  const { data: a } = await supabase.from("auditorias").select("area").eq("id", auditoria_id).eq("proyecto_id", proyecto_id).single();
  if (!a) return { ok: false, error: "No se encuentra la auditoría." };
  const { error } = await supabase.from("hallazgos").insert({
    proyecto_id, auditoria_id, tipo: "observacion", area: a.area, titulo: texto.trim().slice(0, 200),
    descripcion: `Necesidad detectada en: ${punto}`, impacto: 3, esfuerzo: 3, creado_por: perfil.id,
  });
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`, "layout");
  return err(error);
}

export async function cerrarAuditoria(proyecto_id: string, id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  await supabase.rpc("recalcular_puntuacion", { a: id });
  const { error } = await supabase.from("auditorias").update({
    estado: (txt(fd, "estado") ?? "completada") as E["estado_auditoria"], notas: txt(fd, "notas"), visible_cliente: bool(fd, "visible_cliente"),
  }).eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`, "layout");
  return err(error);
}

export async function borrarAuditoria(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("auditorias").delete().eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`);
  return err(error);
}

export async function guardarHallazgo(proyecto_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const tipo = (txt(fd, "tipo") ?? "muda") as E["tipo_hallazgo"];
  const fila = {
    proyecto_id, tipo, titulo: txt(fd, "titulo") ?? "Hallazgo", descripcion: txt(fd, "descripcion"),
    muda: tipo === "muda" ? (txt(fd, "muda") as E["tipo_muda"]) : null,
    dafo: tipo === "dafo" ? (txt(fd, "dafo") as E["tipo_dafo"]) : null,
    area: (txt(fd, "area") as E["area_auditoria"] | null), impacto: num(fd, "impacto") ?? 3, esfuerzo: num(fd, "esfuerzo") ?? 3,
    coste_estimado: num(fd, "coste_estimado"), visible_cliente: bool(fd, "visible_cliente"),
    auditoria_id: txt(fd, "auditoria_id"),
    fotos: (fd.getAll("fotos").filter((f) => typeof f === "string" && f) as string[]),
  };
  if (tipo === "muda" && !fila.muda) return { ok: false, error: "Elige el tipo de despilfarro." };
  if (tipo === "dafo" && !fila.dafo) return { ok: false, error: "Elige el cuadrante DAFO." };
  const { error } = id
    ? await supabase.from("hallazgos").update(fila).eq("id", id)
    : await supabase.from("hallazgos").insert({ ...fila, creado_por: perfil.id });
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`);
  return err(error);
}

export async function borrarHallazgo(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("hallazgos").delete().eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/diagnostico`);
  return err(error);
}

/** Convierte un hallazgo en una acción de mejora (fase Planificar). */
export async function hallazgoAAccion(proyecto_id: string, hallazgo_id: string): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const { data: h } = await supabase.from("hallazgos").select("titulo, impacto").eq("id", hallazgo_id).single();
  if (!h) return { ok: false, error: "No se encuentra el hallazgo." };
  const { error } = await supabase.from("acciones").insert({
    proyecto_id, hallazgo_id, titulo: `Corregir: ${h.titulo}`, responsable_id: perfil.id,
    prioridad: h.impacto >= 4 ? "alta" : h.impacto >= 3 ? "media" : "baja",
  });
  revalidatePath(`/proyectos/${proyecto_id}`, "layout");
  return err(error);
}

export async function guardarPlantilla(id: string | null, nombre: string, area: E["area_auditoria"] | null,
  descripcion: string | null, contenido: ContenidoAuditoria, tipo: E["tipo_plantilla"] = "auditoria"): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  if (!nombre.trim()) return { ok: false, error: "Ponle nombre a la plantilla." };
  if (id) {
    const { data: prev } = await supabase.from("plantillas").select("version").eq("id", id).single();
    const { error } = await supabase.from("plantillas").update({ nombre, area, descripcion, contenido, version: (prev?.version ?? 1) + 1 }).eq("id", id);
    revalidatePath("/biblioteca", "layout");
    return error ? err(error) : { ok: true, id };
  }
  const { data, error } = await supabase.from("plantillas").insert({ organizacion_id: perfil.organizacion_id, tipo, nombre, area, descripcion, contenido }).select("id").single();
  revalidatePath("/biblioteca", "layout");
  return error ? err(error) : { ok: true, id: data.id };
}

export async function archivarPlantilla(id: string, activa: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("plantillas").update({ activa }).eq("id", id);
  revalidatePath("/biblioteca", "layout");
  return err(error);
}

/** Añade a la biblioteca las plantillas predefinidas que falten (por nombre). No toca las que ya tienes. */
export async function instalarPlantillasBase(): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const { data: hay, error: e1 } = await supabase.from("plantillas").select("nombre").eq("tipo", "auditoria");
  if (e1) return err(e1);
  const existentes = new Set((hay ?? []).map((p) => p.nombre.trim().toLowerCase()));
  const nuevas = PLANTILLAS_BASE.filter((p) => !existentes.has(p.nombre.toLowerCase()));
  if (!nuevas.length) return { ok: true };
  const { error } = await supabase.from("plantillas").insert(nuevas.map((p) => ({
    organizacion_id: perfil.organizacion_id, tipo: "auditoria" as const, nombre: p.nombre, area: p.area, descripcion: p.descripcion, contenido: p.contenido,
  })));
  revalidatePath("/biblioteca", "layout");
  return err(error);
}
