"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { ContenidoAuditoria } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const rv = (p: string) => revalidatePath(`/proyectos/${p}`, "layout");

/** Crea un estándar en el proyecto, copiando una plantilla de la biblioteca o en blanco. */
export async function crearEstandar(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const plantilla_id = txt(fd, "plantilla_id");
  let fila: { tipo: E["tipo_estandar"]; titulo: string; area: E["area_auditoria"] | null; contenido: ContenidoAuditoria } = {
    tipo: (txt(fd, "tipo") ?? "sop") as E["tipo_estandar"], titulo: txt(fd, "titulo") ?? "Nuevo estándar", area: null, contenido: { secciones: [] },
  };
  if (plantilla_id) {
    const { data: pl } = await supabase.from("plantillas").select("*").eq("id", plantilla_id).single();
    if (pl) fila = { tipo: pl.tipo === "checklist" ? "checklist" : "sop", titulo: txt(fd, "titulo") ?? pl.nombre, area: pl.area, contenido: pl.contenido as ContenidoAuditoria };
  }
  const { data, error } = await supabase.from("estandares").insert({ proyecto_id, plantilla_id, ...fila }).select("id").single();
  rv(proyecto_id);
  return error ? err(error) : { ok: true, id: data.id };
}

export type EstandarForm = {
  tipo: E["tipo_estandar"]; titulo: string; area: E["area_auditoria"] | null; estado: E["estado_estandar"];
  responsable_externo: string | null; fecha_implantacion: string | null; visible_cliente: boolean; contenido: ContenidoAuditoria;
};
export async function guardarEstandar(proyecto_id: string, id: string, e: EstandarForm, nuevaVersion: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  if (!e.titulo.trim()) return { ok: false, error: "Ponle título." };
  const { data: prev } = await supabase.from("estandares").select("version").eq("id", id).single();
  const { error } = await supabase.from("estandares").update({ ...e, version: (prev?.version ?? 1) + (nuevaVersion ? 1 : 0) }).eq("id", id);
  rv(proyecto_id);
  return err(error);
}
export async function borrarEstandar(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("estandares").delete().eq("id", id);
  rv(proyecto_id);
  return err(error);
}
/** Lleva un estándar que ha funcionado a la biblioteca para reutilizarlo con otros clientes. */
export async function estandarABiblioteca(id: string): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const { data: e } = await supabase.from("estandares").select("*").eq("id", id).single();
  if (!e) return { ok: false, error: "No se encuentra." };
  const { error } = await supabase.from("plantillas").insert({
    organizacion_id: perfil.organizacion_id, tipo: e.tipo === "checklist" ? "checklist" : "sop", area: e.area, nombre: e.titulo, contenido: e.contenido,
    descripcion: "Creada desde un proyecto",
  });
  revalidatePath("/biblioteca");
  return err(error);
}

// ---------- Formaciones ----------
const asistentesDe = (fd: FormData) => String(fd.get("asistentes") ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
  const [nombre, puesto, falta] = l.split("|").map((x) => x.trim());
  return { nombre, puesto: puesto ?? "", asistio: !/^(no|falta|ausente)$/i.test(falta ?? "") };
});

export async function guardarFormacion(proyecto_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const fila = {
    proyecto_id, titulo: txt(fd, "titulo") ?? "Formación", fecha: txt(fd, "fecha") ?? undefined, formador: txt(fd, "formador"),
    duracion_h: num(fd, "duracion_h") ?? 1, contenido: txt(fd, "contenido"), estandar_id: txt(fd, "estandar_id"),
    valoracion: num(fd, "valoracion"), asistentes: asistentesDe(fd), visible_cliente: bool(fd, "visible_cliente"),
  };
  const { error } = id ? await supabase.from("formaciones").update(fila).eq("id", id) : await supabase.from("formaciones").insert(fila);
  rv(proyecto_id);
  return err(error);
}
export async function borrarFormacion(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("formaciones").delete().eq("id", id);
  rv(proyecto_id);
  return err(error);
}
