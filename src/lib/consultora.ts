export type Concepto = { descripcion: string; cantidad: number; unidad?: string; precio: number };

export const conceptosDe = (c: unknown): Concepto[] =>
  Array.isArray(c) ? (c as Concepto[]).map((x) => ({ descripcion: String(x.descripcion ?? ""), cantidad: Number(x.cantidad ?? 1), unidad: x.unidad ?? "", precio: Number(x.precio ?? 0) })) : [];

export const baseDe = (c: unknown) => conceptosDe(c).reduce((s, x) => s + x.cantidad * x.precio, 0);

/** Total de una factura emitida: base + IVA − retención de IRPF. */
export const totalFactura = (f: { base: number | string; iva_pct: number | string; irpf_pct: number | string }) =>
  Number(f.base) * (1 + Number(f.iva_pct) / 100 - Number(f.irpf_pct) / 100);

/** Base, IVA, retención y total a pagar de un presupuesto. */
export function totalesPresupuesto(conceptos: unknown, ivaPct: number | string, irpfPct: number | string) {
  const base = baseDe(conceptos);
  const iva = base * Number(ivaPct) / 100, irpf = base * Number(irpfPct) / 100;
  return { base, iva, irpf, total: base + iva - irpf };
}

export const COSTE_KM = 0.26; // €/km, el exento de tributación en IRPF

export const TIPOS_HORA = { visita: "Visita al local", oficina: "Trabajo de oficina", desplazamiento: "Desplazamiento", formacion: "Formación", reunion: "Reunión", otro: "Otro" } as const;
export const ESTADOS_PRESUPUESTO = { borrador: "Borrador", enviado: "Enviado", aceptado: "Aceptado", rechazado: "Rechazado" } as const;
