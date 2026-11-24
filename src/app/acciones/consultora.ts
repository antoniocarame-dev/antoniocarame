"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { baseDe, type Concepto } from "@/lib/consultora";
import { err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const rv = () => { revalidatePath("/consultora", "layout"); revalidatePath("/proyectos", "layout"); revalidatePath("/panel"); };
async function soloAdmin() {
  const s = await getSesion();
  if (!s.esAdmin) throw new Error("Solo el administrador");
  return s;
}

// ---------- Horas ----------
export async function registrarHoras(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await soloAdmin();
  const horas = num(fd, "horas");
  if (!horas || horas <= 0) return { ok: false, error: "Indica las horas." };
  const { error } = await supabase.from("horas").insert({
    organizacion_id: perfil.organizacion_id, usuario_id: perfil.id, proyecto_id: txt(fd, "proyecto_id"), fecha: txt(fd, "fecha") ?? undefined,
    horas, tipo: (txt(fd, "tipo") ?? "oficina") as E["tipo_hora"], descripcion: txt(fd, "descripcion"), km: num(fd, "km"),
  });
  rv();
  return err(error);
}
export async function borrarHoras(id: string): Promise<Res> {
  const { supabase } = await soloAdmin();
  const { error } = await supabase.from("horas").delete().eq("id", id);
  rv();
  return err(error);
}

// ---------- Presupuestos ----------
export async function crearPresupuesto(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await soloAdmin();
  const negocio_id = txt(fd, "negocio_id");
  if (!negocio_id) return { ok: false, error: "Elige el cliente." };
  const año = new Date().getFullYear();
  const { data: ult } = await supabase.from("presupuestos").select("numero").like("numero", `P-${año}-%`).order("numero", { ascending: false }).limit(1);
  const n = ult?.[0] ? Number(ult[0].numero.split("-")[2]) + 1 : 1;
  const { data: org } = await supabase.from("organizaciones").select("ajustes").eq("id", perfil.organizacion_id).single();
  const irpf = Number((org?.ajustes as { irpf_pct?: number } | null)?.irpf_pct ?? 15);
  const { data, error } = await supabase.from("presupuestos").insert({
    organizacion_id: perfil.organizacion_id, negocio_id, numero: `P-${año}-${String(n).padStart(3, "0")}`, titulo: txt(fd, "titulo") ?? "Propuesta de servicios",
    conceptos: [{ descripcion: "", cantidad: 1, unidad: "servicio", precio: 0 }], irpf_pct: irpf, condiciones: "50 % a la aceptación y 50 % a la entrega. Transferencia a 15 días.",
  }).select("id").single();
  rv();
  return error ? err(error) : { ok: true, id: data.id };
}

export type PresupuestoForm = { titulo: string; fecha: string; validez_dias: number; introduccion: string | null; conceptos: Concepto[]; iva_pct: number; irpf_pct: number; condiciones: string | null; notas: string | null; negocio_id: string; proyecto_id: string | null };
export async function guardarPresupuesto(id: string, p: PresupuestoForm): Promise<Res> {
  const { supabase } = await soloAdmin();
  if (!p.titulo.trim()) return { ok: false, error: "Ponle título." };
  const { error } = await supabase.from("presupuestos").update({ ...p, conceptos: p.conceptos.filter((c) => c.descripcion.trim()) }).eq("id", id);
  rv();
  return err(error);
}
export async function estadoPresupuesto(id: string, estado: E["estado_presupuesto"]): Promise<Res> {
  const { supabase } = await soloAdmin();
  const { error } = await supabase.from("presupuestos").update({ estado, fecha_estado: new Date().toISOString().slice(0, 10) }).eq("id", id);
  rv();
  return err(error);
}
/** Al aceptar un presupuesto sin proyecto, crea el proyecto con su importe y las 4 fases estándar. */
export async function proyectoDesdePresupuesto(id: string): Promise<Res> {
  const { supabase, perfil } = await soloAdmin();
  const { data: p } = await supabase.from("presupuestos").select("*").eq("id", id).single();
  if (!p) return { ok: false, error: "No se encuentra." };
  if (p.proyecto_id) return { ok: true, id: p.proyecto_id };
  const { data: pr, error } = await supabase.from("proyectos").insert({
    organizacion_id: perfil.organizacion_id, negocio_id: p.negocio_id, titulo: p.titulo, codigo: p.numero, responsable_id: perfil.id, fecha_inicio: new Date().toISOString().slice(0, 10), alcance: p.introduccion,
  }).select("id").single();
  if (error) return err(error);
  const importe = baseDe(p.conceptos);
  await Promise.all([
    supabase.from("proyecto_miembros").insert({ proyecto_id: pr.id, usuario_id: perfil.id, rol: "consultor" }),
    supabase.from("proyecto_finanzas").insert({ proyecto_id: pr.id, importe_presupuestado: importe, horas_presupuestadas: perfil.tarifa_hora ? Math.round(importe / Number(perfil.tarifa_hora)) : 0, tarifa_hora: perfil.tarifa_hora }),
    supabase.from("fases").insert(["Diagnóstico", "Plan de acción", "Implantación", "Seguimiento"].map((nombre, i) => ({ proyecto_id: pr.id, nombre, orden: i + 1, estado: (i === 0 ? "en_curso" : "pendiente") as E["estado_fase"] }))),
    supabase.from("presupuestos").update({ proyecto_id: pr.id, estado: "aceptado", fecha_estado: new Date().toISOString().slice(0, 10) }).eq("id", id),
  ]);
  rv();
  return { ok: true, id: pr.id };
}
export async function borrarPresupuesto(id: string): Promise<Res> {
  const { supabase } = await soloAdmin();
  const { error } = await supabase.from("presupuestos").delete().eq("id", id);
  rv();
  return err(error);
}

// ---------- Facturas emitidas y cobros ----------
export async function registrarFacturaEmitida(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await soloAdmin();
  const presupuesto_id = txt(fd, "presupuesto_id");
  let negocio_id = txt(fd, "negocio_id"), proyecto_id: string | null = null;
  let irpfPres: number | null = null;
  if (presupuesto_id) {
    const { data: p } = await supabase.from("presupuestos").select("negocio_id, proyecto_id, irpf_pct").eq("id", presupuesto_id).single();
    negocio_id = p?.negocio_id ?? negocio_id; proyecto_id = p?.proyecto_id ?? null; irpfPres = p ? Number(p.irpf_pct) : null;
  }
  const base = num(fd, "base"), numero = txt(fd, "numero");
  if (!negocio_id || base == null || !numero) return { ok: false, error: "Indica cliente, número y base." };
  const fecha = txt(fd, "fecha") ?? new Date().toISOString().slice(0, 10);
  const venc = new Date(fecha + "T12:00:00"); venc.setDate(venc.getDate() + (num(fd, "dias_pago") ?? 15));
  const { data: neg } = await supabase.from("negocios").select("nombre").eq("id", negocio_id).single();
  const irpfForm = num(fd, "irpf_pct");
  const { data: org } = await supabase.from("organizaciones").select("ajustes").eq("id", perfil.organizacion_id).single();
  const irpfAjustes = Number((org?.ajustes as { irpf_pct?: number } | null)?.irpf_pct ?? 0);
  const { error } = await supabase.from("facturas_emitidas").insert({
    organizacion_id: perfil.organizacion_id, negocio_id, cliente_nombre: neg?.nombre ?? null, proyecto_id, presupuesto_id, numero, concepto: txt(fd, "concepto"), fecha,
    vencimiento: venc.toISOString().slice(0, 10), base, iva_pct: num(fd, "iva_pct") ?? 21, irpf_pct: irpfForm ?? irpfPres ?? irpfAjustes,
  });
  rv();
  return err(error);
}
export async function marcarCobrada(id: string, cobrada: boolean): Promise<Res> {
  const { supabase } = await soloAdmin();
  const { error } = await supabase.from("facturas_emitidas").update(cobrada ? { estado: "cobrada", fecha_cobro: new Date().toISOString().slice(0, 10) } : { estado: "pendiente", fecha_cobro: null }).eq("id", id);
  rv();
  return err(error);
}
export async function borrarFacturaEmitida(id: string): Promise<Res> {
  const { supabase } = await soloAdmin();
  const { error } = await supabase.from("facturas_emitidas").delete().eq("id", id);
  rv();
  return err(error);
}
