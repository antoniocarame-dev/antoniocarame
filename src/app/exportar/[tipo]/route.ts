import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { libro, hoja, respuestaExcel } from "@/lib/excel";
import { cuentaResultados } from "@/lib/resultados";
import { calcularEscandallos, precioNeto, MOTIVOS_MERMA, type Escandallo } from "@/lib/costes";
import { baseDe, conceptosDe, totalFactura, TIPOS_HORA, ESTADOS_PRESUPUESTO } from "@/lib/consultora";
import { ESTADOS_TAREA, PDCA, PRIORIDAD } from "@/lib/utils";

const hoy = () => new Date().toISOString().slice(0, 10);

/** Exportación a Excel. Respeta la seguridad de la base de datos: usa la sesión de quien descarga. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const wb = libro();

  if (tipo === "consultora") {
    const [{ data: horas }, { data: presupuestos }, { data: facturas }, { data: proyectos }] = await Promise.all([
      supabase.from("horas").select("*").order("fecha"),
      supabase.from("presupuestos").select("*, negocios(nombre)").order("fecha"),
      supabase.from("facturas_emitidas").select("*, negocios(nombre)").order("fecha"),
      supabase.from("proyectos").select("id, titulo, codigo, negocios(nombre)"),
    ]);
    const proy = (id: string | null) => { const p = proyectos?.find((x) => x.id === id); return p ? `${p.negocios?.nombre} · ${p.titulo}` : "Interno"; };
    hoja(wb, "Horas", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Proyecto", ancho: 50 }, { titulo: "Tipo", ancho: 20 }, { titulo: "Horas", tipo: "num" }, { titulo: "Km", tipo: "num" }, { titulo: "Descripción", ancho: 40 }],
      (horas ?? []).map((h) => [h.fecha, proy(h.proyecto_id), TIPOS_HORA[h.tipo], Number(h.horas), h.km == null ? null : Number(h.km), h.descripcion]));
    hoja(wb, "Presupuestos", [{ titulo: "Número" }, { titulo: "Fecha", tipo: "fecha" }, { titulo: "Cliente", ancho: 32 }, { titulo: "Título", ancho: 45 }, { titulo: "Base", tipo: "eur" }, { titulo: "Estado" }, { titulo: "Proyecto", ancho: 40 }],
      (presupuestos ?? []).map((p) => [p.numero, p.fecha, p.negocios?.nombre, p.titulo, baseDe(p.conceptos), ESTADOS_PRESUPUESTO[p.estado], p.proyecto_id ? proy(p.proyecto_id) : ""]));
    hoja(wb, "Conceptos", [{ titulo: "Presupuesto" }, { titulo: "Concepto", ancho: 50 }, { titulo: "Cantidad", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Precio", tipo: "eur" }, { titulo: "Importe", tipo: "eur" }],
      (presupuestos ?? []).flatMap((p) => conceptosDe(p.conceptos).map((c) => [p.numero, c.descripcion, c.cantidad, c.unidad, c.precio, c.cantidad * c.precio])));
    hoja(wb, "Facturas emitidas", [{ titulo: "Número" }, { titulo: "Fecha", tipo: "fecha" }, { titulo: "Cliente", ancho: 32 }, { titulo: "Concepto", ancho: 40 }, { titulo: "Base", tipo: "eur" }, { titulo: "IVA %", tipo: "num" }, { titulo: "IRPF %", tipo: "num" }, { titulo: "Total", tipo: "eur" }, { titulo: "Vencimiento", tipo: "fecha" }, { titulo: "Estado" }, { titulo: "Cobrada el", tipo: "fecha" }],
      (facturas ?? []).map((f) => [f.numero, f.fecha, f.negocios?.nombre ?? f.cliente_nombre, f.concepto, Number(f.base), Number(f.iva_pct), Number(f.irpf_pct), totalFactura(f), f.vencimiento, f.estado === "cobrada" ? "Cobrada" : "Pendiente", f.fecha_cobro]));
    return respuestaExcel(wb, `consultora-${hoy()}`);
  }

  if (tipo === "cliente") {
    // Todos los datos de un cliente en un solo archivo (útil también si lo pide por protección de datos)
    const nid = req.nextUrl.searchParams.get("negocio");
    if (!nid) return new NextResponse("Falta el cliente", { status: 400 });
    const { data: neg } = await supabase.from("negocios").select("*").eq("id", nid).maybeSingle();
    if (!neg) return new NextResponse("Cliente no encontrado", { status: 404 });
    const [{ data: contactos }, { data: proyectos }, meses, { data: productos }, { data: facturas }, { data: escs }, { data: mermas }, { data: presupuestos }, { data: emitidas }] = await Promise.all([
      supabase.from("contactos").select("*").eq("negocio_id", nid),
      supabase.from("proyectos").select("*, hallazgos(*), acciones(*), tareas(*), kpis(*, kpi_valores(*))").eq("negocio_id", nid).order("fecha_inicio"),
      cuentaResultados(supabase, neg),
      supabase.from("v_productos_precio").select("*").eq("negocio_id", nid).order("nombre"),
      supabase.from("facturas").select("*, proveedores(nombre)").eq("negocio_id", nid).order("fecha"),
      supabase.from("escandallos").select("*, ingredientes_escandallo!ingredientes_escandallo_escandallo_id_fkey(*)").eq("negocio_id", nid).order("nombre"),
      supabase.from("mermas").select("*, productos(nombre), escandallos(nombre)").eq("negocio_id", nid).order("fecha"),
      supabase.from("presupuestos").select("*").eq("negocio_id", nid).order("fecha"),
      supabase.from("facturas_emitidas").select("*").eq("negocio_id", nid).order("fecha"),
    ]);
    hoja(wb, "Ficha", [{ titulo: "Dato", ancho: 24 }, { titulo: "Valor", ancho: 60 }], [
      ["Nombre", neg.nombre], ["Tipo", neg.tipo], ["Grupo", neg.grupo], ["Dirección", neg.direccion], ["Localidad", neg.localidad], ["Provincia", neg.provincia],
      ["Aforo", neg.aforo], ["Plantilla", neg.plantilla], ["Horarios", neg.horarios], ["Ticket medio", neg.ticket_medio == null ? null : Number(neg.ticket_medio)],
      ["Food cost objetivo", `${Number(neg.food_cost_objetivo) * 100} %`], ["Notas", neg.notas]]);
    hoja(wb, "Contactos", [{ titulo: "Nombre", ancho: 26 }, { titulo: "Cargo", ancho: 20 }, { titulo: "Correo", ancho: 30 }, { titulo: "Teléfono", ancho: 16 }, { titulo: "Principal" }],
      (contactos ?? []).map((c) => [c.nombre, c.cargo, c.email, c.telefono, c.principal ? "Sí" : ""]));
    hoja(wb, "Proyectos", [{ titulo: "Código" }, { titulo: "Proyecto", ancho: 45 }, { titulo: "Tipo", ancho: 18 }, { titulo: "Estado" }, { titulo: "Inicio", tipo: "fecha" }, { titulo: "Entrega", tipo: "fecha" }, { titulo: "Objetivos", ancho: 60 }],
      (proyectos ?? []).map((p) => [p.codigo, p.titulo, p.tipo, p.estado, p.fecha_inicio, p.fecha_fin, p.objetivos]));
    hoja(wb, "Hallazgos", [{ titulo: "Proyecto", ancho: 30 }, { titulo: "Hallazgo", ancho: 45 }, { titulo: "Tipo" }, { titulo: "Categoría", ancho: 18 }, { titulo: "Impacto", tipo: "num" }, { titulo: "Esfuerzo", tipo: "num" }, { titulo: "Descripción", ancho: 60 }],
      (proyectos ?? []).flatMap((p) => p.hallazgos.map((h) => [p.titulo, h.titulo, h.tipo, h.muda ?? h.dafo ?? "", h.impacto, h.esfuerzo, h.descripcion])));
    hoja(wb, "Acciones", [{ titulo: "Proyecto", ancho: 30 }, { titulo: "Acción", ancho: 45 }, { titulo: "Fase PDCA" }, { titulo: "Responsable", ancho: 20 }, { titulo: "Fecha objetivo", tipo: "fecha" }, { titulo: "Resultado", ancho: 60 }],
      (proyectos ?? []).flatMap((p) => p.acciones.map((a) => [p.titulo, a.titulo, PDCA[a.fase_pdca].nombre, a.responsable_externo ?? "Consultor", a.fecha_objetivo, a.resultado])));
    hoja(wb, "Tareas", [{ titulo: "Proyecto", ancho: 30 }, { titulo: "Tarea", ancho: 45 }, { titulo: "Estado" }, { titulo: "Responsable", ancho: 20 }, { titulo: "Vence", tipo: "fecha" }],
      (proyectos ?? []).flatMap((p) => p.tareas.map((t) => [p.titulo, t.titulo, ESTADOS_TAREA[t.estado], t.responsable_externo ?? "Consultor", t.vence])));
    hoja(wb, "KPIs", [{ titulo: "Proyecto", ancho: 30 }, { titulo: "Indicador", ancho: 28 }, { titulo: "Mes", tipo: "fecha" }, { titulo: "Valor", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Objetivo", tipo: "num" }],
      (proyectos ?? []).flatMap((p) => p.kpis.flatMap((k) => k.kpi_valores.map((v) => [p.titulo, k.nombre, v.periodo, Number(v.valor), k.unidad, k.objetivo == null ? null : Number(k.objetivo)]))));
    hoja(wb, "Cuenta de resultados", [{ titulo: "Mes", tipo: "fecha" }, { titulo: "Ventas netas", tipo: "eur" }, { titulo: "Materia prima", tipo: "eur" }, { titulo: "Personal", tipo: "eur" }, { titulo: "Otros gastos", tipo: "eur" }, { titulo: "EBITDA", tipo: "eur" }, { titulo: "Food cost", tipo: "pct" }, { titulo: "Labour cost", tipo: "pct" }],
      meses.map((m) => [m.periodo, m.ventas, m.costeMp, m.personal, (m.alquiler ?? 0) + (m.suministros ?? 0) + (m.otros ?? 0), m.ebitda, m.kpi.food_cost, m.kpi.labour_cost]));
    hoja(wb, "Productos y precios", [{ titulo: "Producto", ancho: 32 }, { titulo: "Familia", ancho: 18 }, { titulo: "Unidad" }, { titulo: "Precio actual", tipo: "eur4" }, { titulo: "Variación", tipo: "pct" }, { titulo: "Merma %", tipo: "num" }],
      (productos ?? []).map((x) => [x.nombre, x.familia, x.unidad, x.precio_actual == null ? null : Number(x.precio_actual), x.variacion_pct == null ? null : Number(x.variacion_pct) / 100, Number(x.merma_pct)]));
    hoja(wb, "Facturas de proveedores", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Proveedor", ancho: 28 }, { titulo: "Número" }, { titulo: "Base", tipo: "eur" }, { titulo: "Total", tipo: "eur" }, { titulo: "Estado" }],
      (facturas ?? []).map((f) => [f.fecha, f.proveedores?.nombre, f.numero, f.base == null ? null : Number(f.base), f.total == null ? null : Number(f.total), f.estado === "validada" ? "Validada" : "Por revisar"]));
    const calc = calcularEscandallos((escs ?? []) as Escandallo[], productos ?? [], Number(neg.food_cost_objetivo));
    hoja(wb, "Escandallos", [{ titulo: "Plato", ancho: 32 }, { titulo: "Tipo" }, { titulo: "Coste ración", tipo: "eur" }, { titulo: "PVP", tipo: "eur" }, { titulo: "Food cost", tipo: "pct" }, { titulo: "Margen", tipo: "eur" }, { titulo: "Alérgenos", ancho: 40 }],
      ((escs ?? []) as Escandallo[]).map((e) => { const c = calc.get(e.id)!; return [e.nombre, e.tipo, c.costeRacion, e.pvp == null ? null : Number(e.pvp), c.foodCost, c.margen, c.alergenos.join(", ")]; }));
    hoja(wb, "Mermas", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Producto o plato", ancho: 30 }, { titulo: "Cantidad", tipo: "num" }, { titulo: "Motivo", ancho: 20 }, { titulo: "Coste", tipo: "eur" }],
      (mermas ?? []).map((m) => [m.fecha, m.productos?.nombre ?? m.escandallos?.nombre, Number(m.cantidad), MOTIVOS_MERMA[m.motivo], Number(m.coste)]));
    hoja(wb, "Presupuestos", [{ titulo: "Número" }, { titulo: "Fecha", tipo: "fecha" }, { titulo: "Título", ancho: 45 }, { titulo: "Base", tipo: "eur" }, { titulo: "Estado" }],
      (presupuestos ?? []).map((p) => [p.numero, p.fecha, p.titulo, baseDe(p.conceptos), ESTADOS_PRESUPUESTO[p.estado]]));
    hoja(wb, "Facturas emitidas", [{ titulo: "Número" }, { titulo: "Fecha", tipo: "fecha" }, { titulo: "Concepto", ancho: 40 }, { titulo: "Base", tipo: "eur" }, { titulo: "Retención IRPF %", tipo: "num" }, { titulo: "Total", tipo: "eur" }, { titulo: "Estado" }],
      (emitidas ?? []).map((f) => [f.numero, f.fecha, f.concepto, Number(f.base), Number(f.irpf_pct), totalFactura(f), f.estado === "cobrada" ? "Cobrada" : "Pendiente"]));
    return respuestaExcel(wb, `${neg.nombre}-todos-los-datos-${hoy()}`);
  }

  // El resto de exportaciones son de un proyecto (y de su negocio)
  const pid = req.nextUrl.searchParams.get("proyecto");
  if (!pid) return new NextResponse("Falta el proyecto", { status: 400 });
  const { data: p } = await supabase.from("proyectos").select("*, negocios(*)").eq("id", pid).maybeSingle();
  if (!p?.negocios) return new NextResponse("Proyecto no encontrado", { status: 404 });
  const neg = p.negocios, nid = neg.id;
  const prefijo = `${neg.nombre}-${tipo}-${hoy()}`;

  if (tipo === "resultados") {
    const [meses, { data: ventas }] = await Promise.all([cuentaResultados(supabase, neg), supabase.from("ventas_diarias").select("*").eq("negocio_id", nid).order("fecha")]);
    hoja(wb, "Cuenta de resultados", [
      { titulo: "Mes", tipo: "fecha" }, { titulo: "Ventas netas", tipo: "eur" }, { titulo: "Materia prima", tipo: "eur" }, { titulo: "Origen MP", ancho: 16 }, { titulo: "Personal", tipo: "eur" },
      { titulo: "Alquiler", tipo: "eur" }, { titulo: "Suministros", tipo: "eur" }, { titulo: "Otros gastos", tipo: "eur" }, { titulo: "EBITDA", tipo: "eur" },
      { titulo: "Food cost", tipo: "pct" }, { titulo: "Labour cost", tipo: "pct" }, { titulo: "Prime cost", tipo: "pct" }, { titulo: "EBITDA %", tipo: "pct" },
      { titulo: "Tickets", tipo: "num" }, { titulo: "Comensales", tipo: "num" }, { titulo: "Ticket medio", tipo: "eur" }, { titulo: "RevPASH", tipo: "eur" }, { titulo: "Mermas", tipo: "eur" }, { titulo: "Mes en curso" },
    ], meses.map((m) => [m.periodo, m.ventas, m.costeMp, m.fuenteMp ? { cuenta: "Cuenta", inventario: "Inventarios", compras: "Compras del mes" }[m.fuenteMp] : "", m.personal, m.alquiler, m.suministros, m.otros, m.ebitda,
      m.kpi.food_cost, m.kpi.labour_cost, m.kpi.prime_cost, m.kpi.ebitda_pct, m.tickets, m.cubiertos, m.kpi.ticket_medio, m.kpi.revpash, m.mermas, m.enCurso ? "Sí" : ""]));
    hoja(wb, "Ventas diarias", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Ventas netas", tipo: "eur" }, { titulo: "Tickets", tipo: "num" }, { titulo: "Comensales", tipo: "num" }, { titulo: "Origen" }],
      (ventas ?? []).map((v) => [v.fecha, Number(v.ventas_netas), v.tickets, v.cubiertos, v.fuente]));
    return respuestaExcel(wb, prefijo);
  }

  if (tipo === "escandallos") {
    const [{ data: productos }, { data: escs }] = await Promise.all([
      supabase.from("v_productos_precio").select("*").eq("negocio_id", nid),
      supabase.from("escandallos").select("*, ingredientes_escandallo!ingredientes_escandallo_escandallo_id_fkey(*)").eq("negocio_id", nid).order("nombre"),
    ]);
    const lista = (escs ?? []) as Escandallo[];
    const calc = calcularEscandallos(lista, productos ?? [], Number(neg.food_cost_objetivo));
    hoja(wb, "Platos", [{ titulo: "Plato", ancho: 32 }, { titulo: "Tipo" }, { titulo: "Categoría" }, { titulo: "Raciones", tipo: "num" }, { titulo: "Coste total", tipo: "eur" }, { titulo: "Coste ración", tipo: "eur" },
      { titulo: "PVP con IVA", tipo: "eur" }, { titulo: "PVP sin IVA", tipo: "eur" }, { titulo: "Food cost", tipo: "pct" }, { titulo: "Margen", tipo: "eur" }, { titulo: "PVP recomendado", tipo: "eur" }, { titulo: "Alérgenos", ancho: 40 }],
      lista.map((e) => { const c = calc.get(e.id)!; return [e.nombre, e.tipo === "plato" ? "Plato" : "Elaboración", e.categoria, Number(e.raciones), c.costeTotal, c.costeRacion, e.pvp == null ? null : Number(e.pvp), c.neto, c.foodCost, c.margen, e.tipo === "plato" ? c.pvpRecomendado : null, c.alergenos.join(", ")]; }));
    hoja(wb, "Detalle", [{ titulo: "Plato", ancho: 32 }, { titulo: "Ingrediente", ancho: 32 }, { titulo: "Cantidad bruta", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Precio", tipo: "eur4" }, { titulo: "Merma %", tipo: "num" }, { titulo: "Coste", tipo: "eur4" }],
      lista.flatMap((e) => calc.get(e.id)!.lineas.map((l) => [e.nombre, l.nombre, l.cantidad, l.unidad, l.precioUnidad, l.merma, l.coste])));
    return respuestaExcel(wb, prefijo);
  }

  if (tipo === "compras") {
    const [{ data: productos }, { data: proveedores }, { data: precios }, { data: facturas }] = await Promise.all([
      supabase.from("v_productos_precio").select("*").eq("negocio_id", nid).order("familia").order("nombre"),
      supabase.from("proveedores").select("id, nombre"),
      supabase.from("precios").select("*, productos!inner(nombre, negocio_id, unidad)").eq("productos.negocio_id", nid).order("fecha"),
      supabase.from("facturas").select("*, proveedores(nombre), lineas_factura(*, productos(nombre))").eq("negocio_id", nid).order("fecha"),
    ]);
    const prov = (id: string | null) => proveedores?.find((x) => x.id === id)?.nombre ?? "";
    hoja(wb, "Productos y precios", [{ titulo: "Producto", ancho: 32 }, { titulo: "Familia", ancho: 18 }, { titulo: "Unidad" }, { titulo: "Proveedor habitual", ancho: 28 }, { titulo: "Precio actual", tipo: "eur4" }, { titulo: "Fecha", tipo: "fecha" },
      { titulo: "Precio anterior", tipo: "eur4" }, { titulo: "Variación", tipo: "pct" }, { titulo: "Merma %", tipo: "num" }, { titulo: "Precio neto", tipo: "eur4" }, { titulo: "Alérgenos", ancho: 30 }],
      (productos ?? []).map((x) => [x.nombre, x.familia, x.unidad, prov(x.proveedor_habitual_id), x.precio_actual == null ? null : Number(x.precio_actual), x.fecha_precio,
        x.precio_anterior == null ? null : Number(x.precio_anterior), x.variacion_pct == null ? null : Number(x.variacion_pct) / 100, Number(x.merma_pct), x.precio_actual == null ? null : precioNeto(Number(x.precio_actual), Number(x.merma_pct)), (x.alergenos ?? []).join(", ")]));
    hoja(wb, "Histórico de precios", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Producto", ancho: 32 }, { titulo: "Unidad" }, { titulo: "Proveedor", ancho: 28 }, { titulo: "Precio", tipo: "eur4" }, { titulo: "Cantidad", tipo: "num" }],
      (precios ?? []).map((x) => [x.fecha, x.productos.nombre, x.productos.unidad, prov(x.proveedor_id), Number(x.precio), x.cantidad == null ? null : Number(x.cantidad)]));
    hoja(wb, "Facturas", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Proveedor", ancho: 28 }, { titulo: "Tipo" }, { titulo: "Número" }, { titulo: "Base", tipo: "eur" }, { titulo: "IVA", tipo: "eur" }, { titulo: "Total", tipo: "eur" }, { titulo: "Estado" }],
      (facturas ?? []).map((f) => [f.fecha, f.proveedores?.nombre, f.tipo === "albaran" ? "Albarán" : "Factura", f.numero, f.base == null ? null : Number(f.base), f.iva == null ? null : Number(f.iva), f.total == null ? null : Number(f.total), f.estado === "validada" ? "Validada" : "Por revisar"]));
    hoja(wb, "Líneas de factura", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Proveedor", ancho: 28 }, { titulo: "Número" }, { titulo: "Descripción", ancho: 40 }, { titulo: "Producto", ancho: 28 }, { titulo: "Cantidad", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Precio", tipo: "eur4" }, { titulo: "IVA %", tipo: "num" }, { titulo: "Importe", tipo: "eur" }],
      (facturas ?? []).flatMap((f) => f.lineas_factura.sort((a, b) => a.orden - b.orden).map((l) => [f.fecha, f.proveedores?.nombre, f.numero, l.descripcion, l.productos?.nombre ?? "", Number(l.cantidad), l.unidad, Number(l.precio_unitario), l.iva_pct == null ? null : Number(l.iva_pct), l.importe == null ? null : Number(l.importe)])));
    return respuestaExcel(wb, prefijo);
  }

  if (tipo === "mermas") {
    const [{ data: mermas }, { data: invs }] = await Promise.all([
      supabase.from("mermas").select("*, productos(nombre, unidad), escandallos(nombre)").eq("negocio_id", nid).order("fecha"),
      supabase.from("inventarios").select("*, inventario_lineas(cantidad, precio, productos(nombre, familia, unidad))").eq("negocio_id", nid).order("fecha"),
    ]);
    hoja(wb, "Mermas", [{ titulo: "Fecha", tipo: "fecha" }, { titulo: "Producto o plato", ancho: 32 }, { titulo: "Cantidad", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Motivo", ancho: 22 }, { titulo: "Coste", tipo: "eur" }, { titulo: "Notas", ancho: 40 }],
      (mermas ?? []).map((m) => [m.fecha, m.productos?.nombre ?? m.escandallos?.nombre, Number(m.cantidad), m.productos?.unidad ?? "raciones", MOTIVOS_MERMA[m.motivo], Number(m.coste), m.notas]));
    hoja(wb, "Inventarios", [{ titulo: "Inventario", ancho: 26 }, { titulo: "Fecha", tipo: "fecha" }, { titulo: "Estado" }, { titulo: "Producto", ancho: 30 }, { titulo: "Familia", ancho: 18 }, { titulo: "Cantidad", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Precio", tipo: "eur4" }, { titulo: "Valor", tipo: "eur" }],
      (invs ?? []).flatMap((i) => i.inventario_lineas.map((l) => [i.nombre, i.fecha, i.estado === "cerrado" ? "Cerrado" : "Abierto", l.productos?.nombre, l.productos?.familia, l.cantidad == null ? null : Number(l.cantidad), l.productos?.unidad, l.precio == null ? null : Number(l.precio), l.cantidad != null && l.precio != null ? Number(l.cantidad) * Number(l.precio) : null])));
    return respuestaExcel(wb, prefijo);
  }

  if (tipo === "plan") {
    const [{ data: kpis }, { data: acciones }, { data: tareas }, { data: hallazgos }] = await Promise.all([
      supabase.from("kpis").select("*, kpi_valores(*)").eq("proyecto_id", pid),
      supabase.from("acciones").select("*").eq("proyecto_id", pid).order("fecha_objetivo"),
      supabase.from("tareas").select("*").eq("proyecto_id", pid).order("vence"),
      supabase.from("hallazgos").select("*").eq("proyecto_id", pid).order("impacto", { ascending: false }),
    ]);
    const resp = (x: { responsable_externo: string | null; responsable_id: string | null }) => x.responsable_externo ?? (x.responsable_id ? "Consultor" : "");
    hoja(wb, "KPIs", [{ titulo: "Indicador", ancho: 30 }, { titulo: "Mes", tipo: "fecha" }, { titulo: "Valor", tipo: "num" }, { titulo: "Unidad" }, { titulo: "Base", tipo: "num" }, { titulo: "Objetivo", tipo: "num" }, { titulo: "Origen" }],
      (kpis ?? []).flatMap((k) => k.kpi_valores.sort((a, b) => a.periodo.localeCompare(b.periodo)).map((v) => [k.nombre, v.periodo, Number(v.valor), k.unidad, k.valor_base == null ? null : Number(k.valor_base), k.objetivo == null ? null : Number(k.objetivo), v.fuente])));
    hoja(wb, "Hallazgos", [{ titulo: "Hallazgo", ancho: 45 }, { titulo: "Tipo" }, { titulo: "Categoría", ancho: 18 }, { titulo: "Impacto", tipo: "num" }, { titulo: "Esfuerzo", tipo: "num" }, { titulo: "€/mes estimados", tipo: "eur" }, { titulo: "Descripción", ancho: 60 }],
      (hallazgos ?? []).map((h) => [h.titulo, h.tipo, h.muda ?? h.dafo ?? "", h.impacto, h.esfuerzo, h.coste_estimado == null ? null : Number(h.coste_estimado), h.descripcion]));
    hoja(wb, "Acciones", [{ titulo: "Acción", ancho: 45 }, { titulo: "Fase PDCA" }, { titulo: "Prioridad" }, { titulo: "Responsable", ancho: 20 }, { titulo: "Fecha objetivo", tipo: "fecha" }, { titulo: "Resultado", ancho: 60 }],
      (acciones ?? []).map((a) => [a.titulo, PDCA[a.fase_pdca].nombre, PRIORIDAD[a.prioridad], resp(a), a.fecha_objetivo, a.resultado]));
    hoja(wb, "Tareas", [{ titulo: "Tarea", ancho: 45 }, { titulo: "Estado" }, { titulo: "Prioridad" }, { titulo: "Responsable", ancho: 20 }, { titulo: "Vence", tipo: "fecha" }, { titulo: "Hecha el", tipo: "fecha" }],
      (tareas ?? []).map((t) => [t.titulo, ESTADOS_TAREA[t.estado], PRIORIDAD[t.prioridad], resp(t), t.vence, t.completada_at]));
    return respuestaExcel(wb, `${neg.nombre}-plan-de-mejora-${hoy()}`);
  }

  return new NextResponse("Exportación desconocida", { status: 404 });
}
