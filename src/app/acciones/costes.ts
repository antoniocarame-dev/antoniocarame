"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { leerFactura, emparejarProducto } from "@/lib/ocr";
import { leerReceta } from "@/lib/ocr-receta";
import { err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const rv = () => revalidatePath("/proyectos", "layout");

// ---------- Proveedores (comunes a todos los clientes) ----------
export async function guardarProveedor(id: string | null, fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const fila = {
    nombre: txt(fd, "nombre") ?? "Proveedor", cif: txt(fd, "cif")?.toUpperCase().replace(/\s/g, "") ?? null, categoria: txt(fd, "categoria"),
    contacto: txt(fd, "contacto"), email: txt(fd, "email"), telefono: txt(fd, "telefono"), condiciones: txt(fd, "condiciones"),
  };
  const { error } = id ? await supabase.from("proveedores").update(fila).eq("id", id)
    : await supabase.from("proveedores").insert({ ...fila, organizacion_id: perfil.organizacion_id });
  rv();
  return err(error);
}
export async function borrarProveedor(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  rv();
  return err(error);
}

// ---------- Productos y precios ----------
export async function guardarProducto(negocio_id: string, id: string | null, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const fila = {
    negocio_id, nombre: txt(fd, "nombre") ?? "Producto", familia: txt(fd, "familia") ?? "Otros",
    unidad: (txt(fd, "unidad") ?? "kg") as E["unidad_compra"], formato: txt(fd, "formato"), merma_pct: num(fd, "merma_pct") ?? 0,
    proveedor_habitual_id: txt(fd, "proveedor_habitual_id"), alergenos: fd.getAll("alergenos").map(String),
  };
  const { data, error } = id ? await supabase.from("productos").update(fila).eq("id", id).select("id").single()
    : await supabase.from("productos").insert(fila).select("id").single();
  if (error) return err(error);
  const precio = num(fd, "precio");
  if (!id && precio != null) {
    await supabase.from("precios").insert({ producto_id: data.id, proveedor_id: fila.proveedor_habitual_id, fecha: new Date().toISOString().slice(0, 10), precio });
  }
  rv();
  return { ok: true, id: data.id };
}
export async function registrarPrecio(producto_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const precio = num(fd, "precio");
  if (precio == null) return { ok: false, error: "Indica el precio." };
  const { error } = await supabase.from("precios").insert({
    producto_id, precio, fecha: txt(fd, "fecha") ?? new Date().toISOString().slice(0, 10), proveedor_id: txt(fd, "proveedor_id"),
  });
  rv();
  return err(error);
}
export async function archivarProducto(id: string, activo: boolean): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("productos").update({ activo }).eq("id", id);
  rv();
  return err(error);
}

// ---------- Facturas ----------
export async function crearFacturaManual(negocio_id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { data, error } = await supabase.from("facturas").insert({ negocio_id, fecha: new Date().toISOString().slice(0, 10) }).select("id").single();
  rv();
  return error ? err(error) : { ok: true, id: data.id };
}

/** Registra un archivo ya subido y, si hay clave de API, lo lee y propone proveedor, líneas y productos. */
export async function procesarFactura(negocio_id: string, archivo_path: string, mime: string): Promise<Res & { aviso?: string }> {
  const { supabase, perfil } = await getSesion();
  const { data: fac, error } = await supabase.from("facturas").insert({ negocio_id, archivo_path }).select("id").single();
  if (error) return err(error);

  const { data: blob, error: e2 } = await supabase.storage.from("documentos").download(archivo_path);
  if (e2 || !blob) { rv(); return { ok: true, id: fac.id, aviso: "Archivo guardado, pero no se ha podido abrir para leerlo." }; }
  const lectura = await leerFactura(blob, mime);
  if (!lectura.ok) { rv(); return { ok: true, id: fac.id, aviso: lectura.error }; }
  const d = lectura.datos;

  // Proveedor: por CIF, si no por nombre; si no existe, se crea
  const { data: provs } = await supabase.from("proveedores").select("id, nombre, cif");
  const cif = d.proveedor_cif?.toUpperCase().replace(/[\s-]/g, "") ?? null;
  let proveedor_id = provs?.find((p) => cif && p.cif === cif)?.id
    ?? provs?.find((p) => p.nombre.toLowerCase() === d.proveedor_nombre.toLowerCase())?.id ?? null;
  if (!proveedor_id && d.proveedor_nombre) {
    const { data: nuevo } = await supabase.from("proveedores").insert({ organizacion_id: perfil.organizacion_id, nombre: d.proveedor_nombre, cif }).select("id").single();
    proveedor_id = nuevo?.id ?? null;
  }

  // Productos: primero lo aprendido en facturas anteriores (misma descripción), luego por parecido
  const [{ data: productos }, { data: previas }] = await Promise.all([
    supabase.from("productos").select("id, nombre").eq("negocio_id", negocio_id).eq("activo", true),
    supabase.from("lineas_factura").select("descripcion, producto_id, facturas!inner(negocio_id)").eq("facturas.negocio_id", negocio_id).not("producto_id", "is", null),
  ]);
  const aprendido = new Map((previas ?? []).map((l) => [l.descripcion.trim().toLowerCase(), l.producto_id!]));

  await supabase.from("facturas").update({
    proveedor_id, tipo: d.tipo, numero: d.numero, fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.fecha ?? "") ? d.fecha : null,
    base: d.base_imponible, iva: d.cuota_iva, total: d.total, extraccion: d,
    notas: d.avisos.length ? d.avisos.map((a) => "· " + a).join("\n") : null,
  }).eq("id", fac.id);
  if (d.lineas.length) {
    await supabase.from("lineas_factura").insert(d.lineas.map((l, i) => ({
      factura_id: fac.id, orden: i + 1, descripcion: l.descripcion, cantidad: l.cantidad, unidad: l.unidad,
      precio_unitario: l.precio_unitario, descuento_pct: l.descuento_pct, iva_pct: l.iva_pct, importe: l.importe ?? Math.round(l.cantidad * l.precio_unitario * 100) / 100,
      producto_id: aprendido.get(l.descripcion.trim().toLowerCase()) ?? emparejarProducto(l.descripcion, productos ?? []),
    })));
  }
  rv();
  return { ok: true, id: fac.id };
}

export type LineaForm = { producto_id: string | null; descripcion: string; cantidad: number; unidad: string | null; precio_unitario: number; descuento_pct: number; iva_pct: number | null };
export type CabeceraForm = { proveedor_id: string | null; tipo: E["tipo_documento_compra"]; numero: string | null; fecha: string | null; base: number | null; iva: number | null; total: number | null; notas: string | null };

/** Guarda la factura revisada (sustituye las líneas) y, si se pide, la valida para registrar precios. */
export async function guardarFactura(id: string, cab: CabeceraForm, lineas: LineaForm[], validar: boolean): Promise<Res & { precios?: number }> {
  const { supabase } = await getSesion();
  if (validar && !cab.fecha) return { ok: false, error: "Pon la fecha de la factura antes de validarla: es la fecha de los precios." };
  const { error } = await supabase.from("facturas").update({ ...cab, estado: "pendiente" }).eq("id", id);
  if (error) return err(error);
  await supabase.from("precios").delete().in("linea_factura_id", (await supabase.from("lineas_factura").select("id").eq("factura_id", id)).data?.map((l) => l.id) ?? []);
  await supabase.from("lineas_factura").delete().eq("factura_id", id);
  const filas = lineas.filter((l) => l.descripcion.trim()).map((l, i) => ({
    factura_id: id, orden: i + 1, ...l, importe: Math.round(l.cantidad * l.precio_unitario * 100) / 100,
  }));
  if (filas.length) {
    const { error: e2 } = await supabase.from("lineas_factura").insert(filas);
    if (e2) return err(e2);
  }
  let precios: number | undefined;
  if (validar) {
    const { data, error: e3 } = await supabase.rpc("validar_factura", { f: id });
    if (e3) return err(e3);
    precios = data ?? 0;
  }
  rv();
  return { ok: true, precios };
}

export async function crearProductoRapido(negocio_id: string, nombre: string, unidad: E["unidad_compra"], proveedor_id: string | null): Promise<Res> {
  const { supabase } = await getSesion();
  const { data, error } = await supabase.from("productos").insert({ negocio_id, nombre, unidad, proveedor_habitual_id: proveedor_id }).select("id").single();
  rv();
  return error ? err(error) : { ok: true, id: data.id };
}

export async function borrarFactura(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { data: f } = await supabase.from("facturas").select("archivo_path").eq("id", id).single();
  const { error } = await supabase.from("facturas").delete().eq("id", id);
  if (!error && f?.archivo_path) await supabase.storage.from("documentos").remove([f.archivo_path]);
  rv();
  return err(error);
}

// ---------- Escandallos ----------
export type IngredienteForm = { producto_id: string | null; sub_escandallo_id: string | null; cantidad: number; merma_pct: number | null };
export type EscandalloForm = {
  tipo: E["tipo_escandallo"]; nombre: string; categoria: string | null; raciones: number; rendimiento: number | null;
  unidad_rendimiento: E["unidad_compra"] | null; pvp: number | null; iva_pct: number; elaboracion: string | null;
};

export async function guardarEscandallo(negocio_id: string, id: string | null, e: EscandalloForm, ings: IngredienteForm[]): Promise<Res> {
  const { supabase } = await getSesion();
  if (!e.nombre.trim()) return { ok: false, error: "Ponle nombre." };
  if (e.tipo === "elaboracion" && !e.rendimiento) return { ok: false, error: "Indica cuánto rinde la elaboración (p. ej. 2 kg) para poder usarla en otros platos." };
  const fila = { ...e, negocio_id, raciones: e.raciones > 0 ? e.raciones : 1 };
  const r = id ? await supabase.from("escandallos").update(fila).eq("id", id).select("id").single()
    : await supabase.from("escandallos").insert(fila).select("id").single();
  if (r.error) return err(r.error);
  const eid = r.data.id;
  await supabase.from("ingredientes_escandallo").delete().eq("escandallo_id", eid);
  const filas = ings.filter((i) => (i.producto_id || i.sub_escandallo_id) && i.cantidad > 0)
    .map((i, n) => ({ escandallo_id: eid, orden: n + 1, ...i }));
  if (filas.length) {
    const { error } = await supabase.from("ingredientes_escandallo").insert(filas);
    if (error) return err(error);
  }
  rv();
  return { ok: true, id: eid };
}

export async function borrarEscandallo(id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("escandallos").delete().eq("id", id);
  rv();
  if (error?.code === "23503") return { ok: false, error: "Esta elaboración se usa en otros platos. Quítala de ellos antes de borrarla." };
  return err(error);
}

export async function guardarVentas(periodo: string, unidades: Record<string, number>): Promise<Res> {
  const { supabase } = await getSesion();
  const filas = Object.entries(unidades).filter(([, u]) => Number.isFinite(u) && u >= 0).map(([escandallo_id, u]) => ({ escandallo_id, periodo: periodo + "-01", unidades: Math.round(u) }));
  const { error } = await supabase.from("ventas_plato").upsert(filas, { onConflict: "escandallo_id,periodo" });
  rv();
  return err(error);
}

/**
 * Crea un escandallo a partir de una receta leída por OCR. Enlaza cada ingrediente con el producto
 * o la elaboración más parecida; los que no existen se crean como productos sin precio.
 */
export async function importarReceta(negocio_id: string, archivo_path: string, mime: string): Promise<Res & { aviso?: string }> {
  const { supabase } = await getSesion();
  const { data: blob, error: e1 } = await supabase.storage.from("documentos").download(archivo_path);
  if (e1 || !blob) return { ok: false, error: "No se ha podido abrir el archivo subido." };
  const lectura = await leerReceta(blob, mime);
  if (!lectura.ok) return { ok: false, error: lectura.error };
  const r = lectura.datos;

  const [{ data: productos }, { data: elabs }] = await Promise.all([
    supabase.from("productos").select("id, nombre").eq("negocio_id", negocio_id).eq("activo", true),
    supabase.from("escandallos").select("id, nombre").eq("negocio_id", negocio_id).eq("tipo", "elaboracion"),
  ]);
  const prods = [...(productos ?? [])];
  const nuevos: string[] = [], sinCantidad: string[] = [];
  const ings: { producto_id: string | null; sub_escandallo_id: string | null; cantidad: number }[] = [];
  for (const i of r.ingredientes) {
    const nombre = i.nombre.trim();
    if (!nombre) continue;
    const exacto = (xs: { id: string; nombre: string }[]) => xs.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())?.id;
    const sub = exacto(elabs ?? []) ?? emparejarProducto(nombre, elabs ?? []);
    let prod = sub ? null : exacto(prods) ?? emparejarProducto(nombre, prods);
    if (!sub && !prod) {
      const { data: nuevo } = await supabase.from("productos").insert({ negocio_id, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), unidad: i.unidad }).select("id, nombre").single();
      if (nuevo) { prod = nuevo.id; prods.push(nuevo); nuevos.push(nuevo.nombre); }
    }
    if (i.cantidad == null) sinCantidad.push(nombre);
    ings.push({ producto_id: sub ? null : prod ?? null, sub_escandallo_id: sub ?? null, cantidad: i.cantidad ?? 0 });
  }
  const esElab = r.tipo === "elaboracion";
  const { data: esc, error } = await supabase.from("escandallos").insert({
    negocio_id, tipo: r.tipo, nombre: r.nombre, categoria: r.categoria, raciones: r.raciones && r.raciones > 0 ? r.raciones : 1,
    rendimiento: esElab ? r.rendimiento ?? 1 : null, unidad_rendimiento: esElab ? r.unidad_rendimiento ?? "kg" : null, pvp: r.pvp, elaboracion: r.elaboracion,
  }).select("id").single();
  if (error) return err(error);
  const filas = ings.filter((i) => i.producto_id || i.sub_escandallo_id).map((i, n) => ({ escandallo_id: esc.id, orden: n + 1, ...i }));
  if (filas.length) await supabase.from("ingredientes_escandallo").insert(filas);
  rv();
  const avisos = [
    nuevos.length ? `Productos nuevos sin precio (ponles precio en Costes y compras o valida una factura): ${nuevos.join(", ")}.` : "",
    sinCantidad.length ? `Sin cantidad, revisa: ${sinCantidad.join(", ")}.` : "",
    !r.pvp && !esElab ? "La receta no trae PVP: añádelo para ver el food cost." : "",
    ...r.avisos,
  ].filter(Boolean);
  return { ok: true, id: esc.id, aviso: avisos.join(" ") || undefined };
}
