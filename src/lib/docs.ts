import "server-only";
import { fecha } from "./utils";
import type { Doc } from "@/components/documentos";
import type { getSesion } from "./sesion";

type S = Awaited<ReturnType<typeof getSesion>>;

export async function cargarDocs(s: S, filtro: { proyecto_id?: string; negocio_id?: string }) {
  let q = s.supabase.from("documentos").select("*, perfiles(nombre), documento_versiones(version, storage_path, created_at)").order("nombre");
  q = filtro.proyecto_id ? q.eq("proyecto_id", filtro.proyecto_id) : q.eq("negocio_id", filtro.negocio_id!).is("proyecto_id", null);
  const { data } = await q;
  const docs: Doc[] = (data ?? []).map((d) => ({
    id: d.id, nombre: d.nombre, carpeta: d.carpeta, version: d.version, tamano: d.tamano, storage_path: d.storage_path,
    visible_cliente: d.visible_cliente, subido: d.perfiles?.nombre ?? "—", fecha: fecha(d.updated_at), propio: d.subido_por === s.user.id,
    versiones: d.documento_versiones.sort((a, b) => b.version - a.version).map((v) => ({ version: v.version, storage_path: v.storage_path, fecha: fecha(v.created_at) })),
  }));
  const base = filtro.proyecto_id ? ["Diagnóstico", "Plan de mejora", "Informes", "Facturas y albaranes", "Recibido del cliente"] : ["Contratos", "Presupuestos", "Licencias", "Planos"];
  const carpetas = [...new Set([...base, ...docs.map((d) => d.carpeta)])];
  return { docs, carpetas };
}

export async function comentariosDocs(s: S, proyecto_id: string) {
  const { data } = await s.supabase.from("comentarios").select("*, perfiles(nombre)").eq("proyecto_id", proyecto_id).eq("entidad", "documento").order("created_at");
  const r: Record<string, { id: string; texto: string; autor: string; fecha: string }[]> = {};
  (data ?? []).forEach((c) => (r[c.entidad_id] ??= []).push({ id: c.id, texto: c.texto, autor: c.perfiles?.nombre ?? "—", fecha: fecha(c.created_at) }));
  return r;
}
