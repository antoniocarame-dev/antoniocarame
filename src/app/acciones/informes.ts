"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { err, txt, type Res } from "./comun";
import { SECCIONES_INFORME, POR_TIPO } from "@/lib/informes";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

export async function crearInforme(proyecto_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const tipo = (txt(fd, "tipo") ?? "seguimiento") as E["tipo_informe"];
  const { data, error } = await supabase.from("informes").insert({
    proyecto_id, tipo, titulo: txt(fd, "titulo") ?? "Informe", periodo_desde: txt(fd, "periodo_desde"), periodo_hasta: txt(fd, "periodo_hasta"),
    secciones: POR_TIPO[tipo],
  }).select("id").single();
  revalidatePath(`/proyectos/${proyecto_id}/informes`);
  return error ? err(error) : { ok: true, id: data.id };
}

export async function guardarInforme(proyecto_id: string, id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("informes").update({
    titulo: txt(fd, "titulo") ?? "Informe", periodo_desde: txt(fd, "periodo_desde"), periodo_hasta: txt(fd, "periodo_hasta"),
    introduccion: txt(fd, "introduccion"), conclusiones: txt(fd, "conclusiones"), proximos_pasos: txt(fd, "proximos_pasos"),
    secciones: fd.getAll("secciones").map(String).filter((s) => s in SECCIONES_INFORME),
  }).eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/informes`, "layout");
  revalidatePath(`/informe/${id}`);
  return err(error);
}

export async function marcarEnviado(proyecto_id: string, id: string, enviado: boolean, destinatario: string | null): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("informes").update(enviado
    ? { estado: "enviado", enviado_at: new Date().toISOString(), enviado_a: destinatario }
    : { estado: "borrador", enviado_at: null, enviado_a: null }).eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/informes`, "layout");
  return err(error);
}

export async function borrarInforme(proyecto_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("informes").delete().eq("id", id);
  revalidatePath(`/proyectos/${proyecto_id}/informes`);
  return err(error);
}
