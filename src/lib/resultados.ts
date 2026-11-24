import "server-only";
import type { getSesion } from "./sesion";
import type { Tabla } from "./utils";

type S = Awaited<ReturnType<typeof getSesion>>["supabase"];

export type Mes = {
  periodo: string;               // AAAA-MM-01
  ventas: number | null; tickets: number; cubiertos: number; diasAbiertos: number;
  compras: number; costeMp: number | null; fuenteMp: "cuenta" | "inventario" | "compras" | null;
  personal: number | null; alquiler: number | null; suministros: number | null; otros: number | null;
  mermas: number; ebitda: number | null; completo: boolean; enCurso: boolean; notas: string | null;
  kpi: { food_cost: number | null; labour_cost: number | null; prime_cost: number | null; ticket_medio: number | null;
    gasto_cubierto: number | null; revpash: number | null; rotacion: number | null; mermas: number | null; ebitda_pct: number | null };
};

/** Indicadores del sector: código, nombre, unidad, si es mejor bajar, y referencia orientativa. */
export const KPIS_SECTOR = [
  { codigo: "food_cost", nombre: "Food cost", unidad: "%", bajar: true, ref: "28-32 %" },
  { codigo: "labour_cost", nombre: "Labour cost", unidad: "%", bajar: true, ref: "30-35 %" },
  { codigo: "prime_cost", nombre: "Prime cost", unidad: "%", bajar: true, ref: "≤ 65 %" },
  { codigo: "ebitda_pct", nombre: "EBITDA sobre ventas", unidad: "%", bajar: false, ref: "≥ 12 %" },
  { codigo: "ticket_medio", nombre: "Ticket medio", unidad: "€", bajar: false, ref: "" },
  { codigo: "gasto_cubierto", nombre: "Gasto por comensal", unidad: "€", bajar: false, ref: "" },
  { codigo: "revpash", nombre: "RevPASH", unidad: "€", bajar: false, ref: "ventas por plaza y hora" },
  { codigo: "rotacion", nombre: "Rotación de mesas", unidad: "veces", bajar: false, ref: "comensales por plaza y servicio" },
  { codigo: "mermas", nombre: "Mermas sobre ventas", unidad: "%", bajar: true, ref: "≤ 3 %" },
] as const;
export type CodigoKpi = (typeof KPIS_SECTOR)[number]["codigo"];

const ym = (d: string) => d.slice(0, 7);
const sumar = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const dia = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const finDeMes = (p: string) => { const x = new Date(p + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + 1, 0); return x.toISOString().slice(0, 10); };

/** Cuenta de resultados mensual y KPIs de un negocio, a partir de ventas, facturas, inventarios, mermas y la cuenta. */
export async function cuentaResultados(supabase: S, negocio: Tabla<"negocios">) {
  const nid = negocio.id;
  const [{ data: ventas }, { data: cuentas }, { data: facturas }, { data: invs }, { data: mermas }] = await Promise.all([
    supabase.from("ventas_diarias").select("*").eq("negocio_id", nid).order("fecha"),
    supabase.from("cuentas_resultados").select("*").eq("negocio_id", nid),
    supabase.from("facturas").select("fecha, base").eq("negocio_id", nid).eq("estado", "validada"),
    supabase.from("inventarios").select("fecha, inventario_lineas(cantidad, precio)").eq("negocio_id", nid).eq("estado", "cerrado"),
    supabase.from("mermas").select("fecha, coste").eq("negocio_id", nid),
  ]);
  const inventarios = (invs ?? []).map((i) => ({ fecha: i.fecha, valor: sumar(i.inventario_lineas.map((l) => Number(l.cantidad ?? 0) * Number(l.precio ?? 0))) }));
  const comprasEntre = (desdeExcl: string, hastaIncl: string) => sumar((facturas ?? []).filter((f) => f.fecha && f.fecha > desdeExcl && f.fecha <= hastaIncl).map((f) => Number(f.base ?? 0)));
  const hoy = new Date().toISOString().slice(0, 7);

  const periodos = [...new Set([...(ventas ?? []).map((v) => ym(v.fecha)), ...(cuentas ?? []).map((c) => ym(c.periodo))])].sort();
  const aforo = negocio.aforo ?? 0;
  const meses: Mes[] = periodos.map((p) => {
    const periodo = p + "-01", fin = finDeMes(periodo);
    const vs = (ventas ?? []).filter((v) => ym(v.fecha) === p);
    const c = (cuentas ?? []).find((x) => ym(x.periodo) === p);
    const tickets = sumar(vs.map((v) => v.tickets ?? 0)), cubiertos = sumar(vs.map((v) => v.cubiertos ?? 0));
    const ventasNetas = c?.ventas_netas != null ? Number(c.ventas_netas) : vs.length ? sumar(vs.map((v) => Number(v.ventas_netas))) : null;
    const compras = comprasEntre(dia(periodo, -1), fin);

    // Materia prima: lo que diga la cuenta; si no, consumo por inventarios; si no, compras del mes
    let costeMp: number | null = null, fuenteMp: Mes["fuenteMp"] = null;
    if (c?.coste_mp != null) { costeMp = Number(c.coste_mp); fuenteMp = "cuenta"; }
    else {
      const ini = inventarios.filter((i) => i.fecha >= dia(periodo, -5) && i.fecha <= dia(periodo, 1)).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
      const fi = inventarios.filter((i) => i.fecha >= dia(fin, -4) && i.fecha <= dia(fin, 2)).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
      if (ini && fi) { costeMp = ini.valor + comprasEntre(ini.fecha, fi.fecha) - fi.valor; fuenteMp = "inventario"; }
      else if (compras > 0) { costeMp = compras; fuenteMp = "compras"; }
    }
    const n = (x: number | string | null | undefined) => (x == null ? null : Number(x));
    const personal = n(c?.personal), alquiler = n(c?.alquiler), suministros = n(c?.suministros), otros = n(c?.otros_gastos);
    const merm = sumar((mermas ?? []).filter((m) => ym(m.fecha) === p).map((m) => Number(m.coste)));
    const enCurso = p >= hoy;
    const ebitda = ventasNetas != null && costeMp != null && personal != null ? ventasNetas - costeMp - personal - (alquiler ?? 0) - (suministros ?? 0) - (otros ?? 0) : null;
    const r = (a: number | null, b: number | null) => (a != null && b ? a / b : null);
    // En el mes en curso las compras aún no reflejan el consumo: no se calculan ratios de materia prima con ellas
    const mpFiable = !(enCurso && fuenteMp === "compras");
    const diasAbiertos = vs.filter((v) => Number(v.ventas_netas) > 0).length;
    return {
      periodo, ventas: ventasNetas, tickets, cubiertos, diasAbiertos, compras, costeMp, fuenteMp, personal, alquiler, suministros, otros,
      mermas: merm, ebitda, enCurso, notas: c?.notas ?? null,
      completo: !enCurso && ventasNetas != null && costeMp != null && personal != null,
      kpi: {
        food_cost: mpFiable ? r(costeMp, ventasNetas) : null, labour_cost: r(personal, ventasNetas),
        prime_cost: mpFiable && costeMp != null && personal != null ? r(costeMp + personal, ventasNetas) : null,
        ticket_medio: tickets ? (ventasNetas ?? 0) / tickets : null, gasto_cubierto: cubiertos ? (ventasNetas ?? 0) / cubiertos : null,
        revpash: aforo && diasAbiertos ? (ventasNetas ?? 0) / (aforo * Number(negocio.horas_apertura_dia) * diasAbiertos) : null,
        rotacion: aforo && diasAbiertos && cubiertos ? cubiertos / (aforo * negocio.servicios_dia * diasAbiertos) : null,
        mermas: merm && ventasNetas ? merm / ventasNetas : null, ebitda_pct: r(ebitda, ventasNetas),
      },
    };
  });
  return meses;
}

/** Agrega varios meses (ratios ponderados por ventas) para comparar periodos. */
export function agregar(meses: Mes[]) {
  if (!meses.length) return null;
  const v = sumar(meses.map((m) => m.ventas ?? 0));
  const s = (f: (m: Mes) => number | null) => sumar(meses.map((m) => f(m) ?? 0));
  const tickets = s((m) => m.tickets), cub = s((m) => m.cubiertos);
  return {
    meses: meses.length, ventasMes: v / meses.length, ebitdaMes: s((m) => m.ebitda) / meses.length,
    kpi: {
      food_cost: v ? s((m) => m.costeMp) / v : null, labour_cost: v ? s((m) => m.personal) / v : null,
      prime_cost: v ? (s((m) => m.costeMp) + s((m) => m.personal)) / v : null, ebitda_pct: v ? s((m) => m.ebitda) / v : null,
      ticket_medio: tickets ? v / tickets : null, gasto_cubierto: cub ? v / cub : null,
      revpash: sumar(meses.map((m) => m.kpi.revpash ?? 0)) / meses.length || null,
      rotacion: sumar(meses.map((m) => m.kpi.rotacion ?? 0)) / meses.length || null,
      mermas: s((m) => m.mermas) && v ? s((m) => m.mermas) / v : null,
    } as Record<CodigoKpi, number | null>,
  };
}
