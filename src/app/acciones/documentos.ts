"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { err, type Res } from "./comun";

type Subida = { proyecto_id?: string | null; negocio_id?: string | null; carpeta: string; nombre: string; storage_path: string;
  mime: string; tamano: number; visible_cliente: boolean; documento_id?: string | null };

/** Registra un archivo ya subido a Storage desde el navegador. Si documento_id existe, crea versión nueva. */
export async function registrarDocumento(d: Subida): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  if (d.documento_id) {
    const { data: doc } = await supabase.from("documentos").select("*").eq("id", d.documento_id).single();
    if (!doc) return { ok: false, error: "No se encuentra el documento." };
    const { error: e1 } = await supabase.from("documento_versiones").insert({
      documento_id: doc.id, version: doc.version, storage_path: doc.storage_path, tamano: doc.tamano, subido_por: doc.subido_por,
    });
    if (e1) return err(e1);
    const { error } = await supabase.from("documentos").update({
      storage_path: d.storage_path, mime: d.mime, tamano: d.tamano, version: doc.version + 1, subido_por: perfil.id,
    }).eq("id", doc.id);
    revalidar(d);
    return err(error);
  }
  const { error } = await supabase.from("documentos").insert({
    organizacion_id: perfil.organizacion_id, proyecto_id: d.proyecto_id ?? null, negocio_id: d.negocio_id ?? null,
    carpeta: d.carpeta || "General", nombre: d.nombre, storage_path: d.storage_path, mime: d.mime, tamano: d.tamano,
    visible_cliente: d.visible_cliente, subido_por: perfil.id,
  });
  revalidar(d);
  return err(error);
}

function revalidar(d: { proyecto_id?: string | null; negocio_id?: string | null }) {
  if (d.proyecto_id) revalidatePath(`/proyectos/${d.proyecto_id}/documentos`);
  if (d.negocio_id) revalidatePath(`/negocios/${d.negocio_id}`);
  revalidatePath("/portal", "layout");
}

export async function enlaceDescarga(storage_path: string): Promise<{ url?: string; error?: string }> {
  const { supabase } = await getSesion();
  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(storage_path, 120, { download: true });
  return error ? { error: "No tienes acceso a este archivo o ya no existe." } : { url: data.signedUrl };
}

export async function visibilidadDocumento(id: string, visible_cliente: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  const { data, error } = await supabase.from("documentos").update({ visible_cliente }).eq("id", id).select("proyecto_id, negocio_id").single();
  if (data) revalidar(data);
  return err(error);
}

export async function borrarDocumento(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { data: doc } = await supabase.from("documentos").select("*, documento_versiones(storage_path)").eq("id", id).single();
  if (!doc) return { ok: false, error: "No se encuentra el documento." };
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) return err(error);
  await supabase.storage.from("documentos").remove([doc.storage_path, ...doc.documento_versiones.map((v) => v.storage_path)]);
  revalidar(doc);
  return { ok: true };
}
