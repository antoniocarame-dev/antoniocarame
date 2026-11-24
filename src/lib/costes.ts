import type { Tabla } from "./utils";
import type { Database } from "./supabase/database.types";

export type ProductoPrecio = Database["public"]["Views"]["v_productos_precio"]["Row"];
export type Escandallo = Tabla<"escandallos"> & { ingredientes_escandallo: Tabla<"ingredientes_escandallo">[] };

export type Linea = {
  id: string; tipo: "producto" | "elaboracion"; nombre: string; cantidad: number; unidad: string;
  precioUnidad: number; merma: number; coste: number; sinPrecio: boolean;
};
export type Calculo = {
  costeTotal: number; costeRacion: number; costePorUnidad: number | null;
  neto: number | null; foodCost: number | null; margen: number | null; pvpRecomendado: number | null;
  lineas: Linea[]; alergenos: string[]; sinPrecio: string[]; ciclo: boolean;
};

/** Coste neto por unidad útil: precio de compra / (1 - merma). */
export const precioNeto = (precio: number, mermaPct: number) => precio / (1 - Math.min(mermaPct, 95) / 100);

/**
 * Calcula todos los escandallos de un negocio con el último precio de compra.
 * Las elaboraciones se usan como ingrediente con su coste por unidad de rendimiento.
 */
export function calcularEscandallos(escandallos: Escandallo[], productos: ProductoPrecio[], foodCostObjetivo: number) {
  const prod = new Map(productos.map((p) => [p.id!, p]));
  const esc = new Map(escandallos.map((e) => [e.id, e]));
  const memo = new Map<string, Calculo>();

  const calc = (id: string, pila: string[] = []): Calculo => {
    if (memo.has(id)) return memo.get(id)!;
    const e = esc.get(id)!;
    if (pila.includes(id)) {
      return { costeTotal: 0, costeRacion: 0, costePorUnidad: 0, neto: null, foodCost: null, margen: null, pvpRecomendado: null, lineas: [], alergenos: [], sinPrecio: [], ciclo: true };
    }
    const lineas: Linea[] = [];
    const alergenos = new Set<string>();
    const sinPrecio = new Set<string>();
    let ciclo = false;
    for (const ing of [...e.ingredientes_escandallo].sort((a, b) => a.orden - b.orden)) {
      const cantidad = Number(ing.cantidad);
      if (ing.producto_id) {
        const p = prod.get(ing.producto_id);
        if (!p) continue;
        const merma = ing.merma_pct != null ? Number(ing.merma_pct) : Number(p.merma_pct ?? 0);
        const precio = Number(p.precio_actual ?? 0);
        if (!p.precio_actual) sinPrecio.add(p.nombre!);
        (p.alergenos ?? []).forEach((a) => alergenos.add(a));
        lineas.push({ id: ing.id, tipo: "producto", nombre: p.nombre!, cantidad, unidad: p.unidad!, precioUnidad: precio, merma, coste: cantidad * precioNeto(precio, merma), sinPrecio: !p.precio_actual });
      } else if (ing.sub_escandallo_id) {
        const sub = esc.get(ing.sub_escandallo_id);
        if (!sub) continue;
        const c = calc(sub.id, [...pila, id]);
        ciclo ||= c.ciclo;
        c.alergenos.forEach((a) => alergenos.add(a));
        c.sinPrecio.forEach((a) => sinPrecio.add(a));
        const pu = c.costePorUnidad ?? c.costeRacion;
        lineas.push({ id: ing.id, tipo: "elaboracion", nombre: sub.nombre, cantidad, unidad: sub.unidad_rendimiento ?? "ración", precioUnidad: pu, merma: 0, coste: cantidad * pu, sinPrecio: c.sinPrecio.length > 0 });
      }
    }
    const costeTotal = lineas.reduce((s, l) => s + l.coste, 0);
    const raciones = Number(e.raciones) || 1;
    const costeRacion = costeTotal / raciones;
    const costePorUnidad = e.rendimiento ? costeTotal / Number(e.rendimiento) : null;
    const iva = Number(e.iva_pct ?? 10);
    const neto = e.pvp ? Number(e.pvp) / (1 + iva / 100) : null;
    const r: Calculo = {
      costeTotal, costeRacion, costePorUnidad, neto,
      foodCost: neto ? costeRacion / neto : null,
      margen: neto != null ? neto - costeRacion : null,
      pvpRecomendado: foodCostObjetivo > 0 ? (costeRacion / foodCostObjetivo) * (1 + iva / 100) : null,
      lineas, alergenos: [...alergenos].sort(), sinPrecio: [...sinPrecio], ciclo,
    };
    memo.set(id, r);
    return r;
  };
  escandallos.forEach((e) => calc(e.id));
  return memo;
}

export type Clase = "estrella" | "caballo" | "puzzle" | "perro";
export const CLASES: Record<Clase, { nombre: string; que: string; tono: "ok" | "warn" | "primary" | "bad" }> = {
  estrella: { nombre: "Estrella", que: "Se vende mucho y deja buen margen. Mantener, cuidar la calidad y destacarlo.", tono: "ok" },
  caballo: { nombre: "Caballo", que: "Se vende mucho pero deja poco. Revisar escandallo, ración o subir precio poco a poco.", tono: "warn" },
  puzzle: { nombre: "Puzzle", que: "Buen margen, poca venta. Mejor posición en carta, descripción o recomendación en sala.", tono: "primary" },
  perro: { nombre: "Perro", que: "Poca venta y poco margen. Candidato a salir de la carta o a rediseñarse.", tono: "bad" },
};

/**
 * Ingeniería de menú (Kasavana y Smith): popularidad frente a margen de contribución.
 * Umbral de popularidad: 70 % del reparto equitativo (0,7 / n). Umbral de margen: margen medio ponderado.
 */
export function ingenieriaMenu(platos: { id: string; nombre: string; unidades: number; margen: number; foodCost: number | null }[]) {
  const conVentas = platos.filter((p) => p.unidades > 0);
  const total = conVentas.reduce((s, p) => s + p.unidades, 0);
  const n = conVentas.length;
  const margenMedio = total ? conVentas.reduce((s, p) => s + p.margen * p.unidades, 0) / total : 0;
  const umbral = n ? 0.7 / n : 0;
  const filas = conVentas.map((p) => {
    const mix = p.unidades / total;
    const popular = mix >= umbral;
    const rentable = p.margen >= margenMedio;
    const clase: Clase = popular && rentable ? "estrella" : popular ? "caballo" : rentable ? "puzzle" : "perro";
    return { ...p, mix, clase, contribucion: p.margen * p.unidades };
  });
  return { filas, total, margenMedio, umbral, contribucionTotal: filas.reduce((s, f) => s + f.contribucion, 0) };
}
