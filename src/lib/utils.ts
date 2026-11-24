import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Database } from "./supabase/database.types";

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));

type E = Database["public"]["Enums"];
export type Tabla<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

// ---------- Formatos españoles ----------
export const TZ = "Europe/Madrid";
export const eur = (n: number | null | undefined, dec = 0) =>
  (n ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: dec, minimumFractionDigits: dec, useGrouping: "always" } as Intl.NumberFormatOptions);
export const numero = (n: number | null | undefined, dec = 1) =>
  n == null ? "—" : n.toLocaleString("es-ES", { maximumFractionDigits: dec });
export const fecha = (d: string | null | undefined, opc: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("es-ES", { timeZone: TZ, ...opc }) : "—";
export const fechaCorta = (d: string | null | undefined) => fecha(d, { day: "numeric", month: "short" });
export const hora = (d: string) => new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const mes = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const diasHasta = (d: string) => Math.round((new Date(d + "T12:00:00").getTime() - Date.now()) / 864e5);
export const valorKpi = (v: number | null | undefined, unidad: string) =>
  v == null ? "—" : unidad === "€" ? eur(v, 2) : `${numero(v, 2)}${unidad === "%" ? " %" : unidad ? " " + unidad : ""}`;

// ---------- Etiquetas ----------
export const ESTADOS_PROYECTO: Record<E["estado_proyecto"], string> = {
  diagnostico: "Diagnóstico", en_curso: "En curso", seguimiento: "Seguimiento", cerrado: "Cerrado",
};
export const SALUD: Record<E["salud_proyecto"], string> = { verde: "En línea", ambar: "Vigilar", rojo: "En riesgo" };
export const TIPOS_PROYECTO: Record<string, string> = {
  apertura: "Apertura", reestructuracion: "Reestructuración", rediseno_carta: "Rediseño de carta",
  control_costes: "Control de costes", formacion: "Formación de equipo", otro: "Otro",
};
export const TIPOS_NEGOCIO: Record<E["tipo_negocio"], string> = {
  restaurante: "Restaurante", bar: "Bar", cafeteria: "Cafetería", dark_kitchen: "Dark kitchen",
  hotel: "Hotel", grupo: "Grupo", catering: "Catering", otro: "Otro",
};
export const AREAS: Record<E["area_auditoria"], string> = {
  sala: "Sala", cocina: "Cocina", compras: "Compras", almacen: "Almacén", carta: "Carta",
  equipo: "Equipo", experiencia_cliente: "Experiencia de cliente", appcc: "APPCC",
};
export const MUDAS: Record<E["tipo_muda"], { nombre: string; ejemplo: string }> = {
  sobreproduccion: { nombre: "Sobreproducción", ejemplo: "Mise en place o raciones de más que acaban en la basura" },
  esperas: { nombre: "Esperas", ejemplo: "Platos parados en el pase, clientes esperando la cuenta" },
  transporte: { nombre: "Transporte", ejemplo: "Traslados de género innecesarios entre almacén, cámaras y locales" },
  sobreprocesos: { nombre: "Sobreprocesos", ejemplo: "Doble anotación, pasos que el cliente no valora" },
  inventario: { nombre: "Inventario", ejemplo: "Stock de más: dinero parado y caducidades" },
  movimientos: { nombre: "Movimientos", ejemplo: "Recorridos del personal por mala distribución" },
  defectos_mermas: { nombre: "Defectos y mermas", ejemplo: "Devoluciones, errores de comanda, mermas" },
};
export const DAFO: Record<E["tipo_dafo"], string> = {
  debilidad: "Debilidades", amenaza: "Amenazas", fortaleza: "Fortalezas", oportunidad: "Oportunidades",
};
export const PDCA: Record<E["fase_pdca"], { nombre: string; ayuda: string }> = {
  planificar: { nombre: "Planificar", ayuda: "Qué se cambia, quién y cómo se medirá" },
  hacer: { nombre: "Hacer", ayuda: "En prueba en el local" },
  verificar: { nombre: "Verificar", ayuda: "Comparar el KPI con el objetivo" },
  actuar: { nombre: "Actuar", ayuda: "Estandarizar o corregir" },
};
export const ESTADOS_TAREA: Record<E["estado_tarea"], string> = {
  pendiente: "Pendiente", en_curso: "En curso", bloqueada: "Bloqueada", hecha: "Hecha",
};
export const PRIORIDAD: Record<E["prioridad"], string> = { baja: "Baja", media: "Media", alta: "Alta" };
export const TIPOS_EVENTO: Record<E["tipo_evento"], string> = {
  visita: "Visita", auditoria: "Auditoría", entrega: "Entrega", reunion: "Reunión", formacion: "Formación",
};
export const ROLES: Record<E["rol_global"], string> = {
  admin: "Administrador", colaborador: "Colaborador", cliente: "Cliente", personal: "Personal del cliente",
};
export const ROLES_PROYECTO: Record<E["rol_proyecto"], string> = {
  consultor: "Consultor", colaborador: "Colaborador", cliente: "Cliente", personal: "Personal",
};
export const ESCALA = ["No existe", "Muy deficiente", "Mejorable", "Correcto", "Excelente"];

export const opciones = (r: Record<string, string | { nombre: string }>) =>
  Object.entries(r).map(([v, l]) => [v, typeof l === "string" ? l : l.nombre] as [string, string]);

/** Semáforo de un KPI: ¿está en objetivo? */
export function estadoKpi(valor: number | null | undefined, objetivo: number | null, base: number | null, sentido: "subir" | "bajar") {
  if (valor == null || objetivo == null) return "neutro" as const;
  const ok = sentido === "bajar" ? valor <= objetivo : valor >= objetivo;
  if (ok) return "ok" as const;
  if (base != null) {
    const mejora = sentido === "bajar" ? valor < base : valor > base;
    return mejora ? ("warn" as const) : ("bad" as const);
  }
  return "warn" as const;
}

/**
 * Un punto de una plantilla. Tipos:
 * - escala: valoración 0-4 · sino: Sí (4) / No (0) · medida: número con objetivo (dentro = 4, fuera = 0)
 * - texto: respuesta libre, no puntúa (toma de datos, necesidades)
 */
export type TipoItem = "escala" | "sino" | "medida" | "texto";
export type ItemAuditoria = { id: string; texto: string; peso?: number; tipo?: TipoItem; ayuda?: string; unidad?: string; min?: number | null; max?: number | null };
export const TIPOS_ITEM: Record<TipoItem, string> = { escala: "Valoración 0-4", sino: "Sí / No", medida: "Medición", texto: "Texto libre" };

/** Valor 0-4 de una medición según su objetivo (null si no hay objetivo o no se ha medido). */
export function valorMedida(it: ItemAuditoria, medida: number | null): number | null {
  if (medida == null || !Number.isFinite(medida) || (it.min == null && it.max == null)) return null;
  return (it.min == null || medida >= it.min) && (it.max == null || medida <= it.max) ? 4 : 0;
}
/** En los puntos de medición, la nota guarda el número en la 1.ª línea y el comentario debajo. */
export function partirMedida(nota: string | null | undefined): { medida: number | null; comentario: string } {
  if (!nota) return { medida: null, comentario: "" };
  const [l1, ...resto] = nota.split("\n");
  if (l1.trim() === "") return { medida: null, comentario: resto.join("\n") };
  const n = Number(l1.trim().replace(",", "."));
  return Number.isFinite(n) ? { medida: n, comentario: resto.join("\n") } : { medida: null, comentario: nota };
}
export function unirMedida(medida: number | null, comentario: string): string | null {
  const c = comentario.trim();
  if (medida == null && !c) return null;
  return c ? `${medida ?? ""}\n${c}` : String(medida);
}
export const tipoDe = (it: ItemAuditoria): TipoItem => it.tipo ?? "escala";
export const objetivoTexto = (it: ItemAuditoria) =>
  it.min != null && it.max != null ? `${numero(it.min, 2)} a ${numero(it.max, 2)} ${it.unidad ?? ""}`.trim()
  : it.max != null ? `≤ ${numero(it.max, 2)} ${it.unidad ?? ""}`.trim()
  : it.min != null ? `≥ ${numero(it.min, 2)} ${it.unidad ?? ""}`.trim() : "";
export type ContenidoAuditoria = { secciones: { titulo: string; items: ItemAuditoria[] }[] };
export const contenidoAuditoria = (c: unknown): ContenidoAuditoria =>
  c && typeof c === "object" && Array.isArray((c as ContenidoAuditoria).secciones) ? (c as ContenidoAuditoria) : { secciones: [] };
