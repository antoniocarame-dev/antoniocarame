import Link from "next/link";
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { BotonExcel } from "@/components/boton-excel";
import { Vacio } from "@/components/ui/vacio";
import { LineaKpi } from "@/components/graficos";
import { SubirFactura } from "@/components/costes/subir-factura";
import { negocioDeProyecto } from "@/lib/negocio";
import { precioNeto } from "@/lib/costes";
import * as A from "@/app/acciones/costes";
import { eur, fecha, fechaCorta, hoyISO, numero, type Tabla } from "@/lib/utils";

// La lectura de una factura con Claude puede tardar hasta un minuto
export const maxDuration = 60;

const ALERGENOS = ["Gluten", "Crustáceos", "Huevos", "Pescado", "Cacahuetes", "Soja", "Lácteos", "Frutos de cáscara", "Apio", "Mostaza", "Sésamo", "Sulfitos", "Altramuces", "Moluscos"];
const FAMILIAS = ["Pescado y marisco", "Carne", "Fruta y verdura", "Lácteos y huevos", "Secos", "Aceites", "Panadería", "Bebidas", "Congelados", "Limpieza", "Otros"];
const UNIDAD = { kg: "kg", l: "l", ud: "ud" } as const;
const SUBIDA = 5; // % a partir del cual una subida es alerta

export default async function Costes({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const { v = "facturas" } = await searchParams;
  const { supabase, negocio } = await negocioDeProyecto(id);
  const nid = negocio.id;
  const hace120 = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
  const [{ data: productos }, { data: proveedores }, { data: facturas }, { data: precios }, { data: usos }] = await Promise.all([
    supabase.from("v_productos_precio").select("*").eq("negocio_id", nid).order("familia").order("nombre"),
    supabase.from("proveedores").select("*").order("nombre"),
    supabase.from("facturas").select("*, proveedores(nombre), lineas_factura(id, producto_id)").eq("negocio_id", nid).order("fecha", { ascending: false, nullsFirst: true }),
    supabase.from("precios").select("producto_id, proveedor_id, fecha, precio, cantidad, productos!inner(negocio_id)").eq("productos.negocio_id", nid).order("fecha"),
    supabase.from("ingredientes_escandallo").select("producto_id, escandallos!ingredientes_escandallo_escandallo_id_fkey!inner(negocio_id, nombre)").eq("escandallos.negocio_id", nid).not("producto_id", "is", null),
  ]);
  const prov = (pid: string | null) => proveedores?.find((p) => p.id === pid)?.nombre ?? "—";
  const base = `/proyectos/${id}/costes`;
  const mesActual = hoyISO().slice(0, 7);
  const validadas = (facturas ?? []).filter((f) => f.estado === "validada");
  const comprasMes = validadas.filter((f) => f.fecha?.startsWith(mesActual)).reduce((s, f) => s + Number(f.base ?? 0), 0);
  const pendientes = (facturas ?? []).filter((f) => f.estado === "pendiente");
  const subidas = (productos ?? []).filter((p) => Number(p.variacion_pct ?? 0) >= SUBIDA).sort((a, b) => Number(b.variacion_pct) - Number(a.variacion_pct));
  const platosDe = (pid: string) => [...new Set((usos ?? []).filter((u) => u.producto_id === pid).map((u) => u.escandallos.nombre))];

  // Comparativa: último precio de cada proveedor por producto en los últimos 120 días
  const comparativa = (productos ?? []).flatMap((p) => {
    const porProv = new Map<string, { precio: number; fecha: string }>();
    (precios ?? []).filter((x) => x.producto_id === p.id && x.proveedor_id && x.fecha >= hace120).forEach((x) => porProv.set(x.proveedor_id!, { precio: Number(x.precio), fecha: x.fecha }));
    if (porProv.size < 2) return [];
    const lista = [...porProv].map(([pv, d]) => ({ proveedor_id: pv, ...d })).sort((a, b) => a.precio - b.precio);
    const habitual = lista.find((l) => l.proveedor_id === p.proveedor_habitual_id) ?? lista[lista.length - 1];
    const consumo90 = (precios ?? []).filter((x) => x.producto_id === p.id && x.fecha >= new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)).reduce((s, x) => s + Number(x.cantidad ?? 0), 0);
    const dif = habitual.precio - lista[0].precio;
    return [{ p, lista, habitual, mejor: lista[0], dif, ahorro: dif * consumo90 * 4, consumo90 }];
  }).sort((a, b) => b.ahorro - a.ahorro);

  const camposProducto = (p?: Partial<Tabla<"productos">>) => (
    <>
      <Campo label="Producto" className="sm:col-span-2"><Input name="nombre" required defaultValue={p?.nombre} /></Campo>
      <Campo label="Familia"><Select name="familia" defaultValue={p?.familia ?? "Otros"} opciones={FAMILIAS.map((f) => [f, f])} /></Campo>
      <Campo label="Unidad de compra"><Select name="unidad" defaultValue={p?.unidad ?? "kg"} opciones={[["kg", "kg"], ["l", "litro"], ["ud", "unidad"]]} /></Campo>
      <Campo label="Merma (%)" ayuda="Limpieza, espinas, cáscara, pelado…"><Input name="merma_pct" type="number" step="0.5" min="0" max="95" defaultValue={p?.merma_pct ?? 0} /></Campo>
      <Campo label="Formato"><Input name="formato" defaultValue={p?.formato ?? ""} placeholder="caja 5 kg" /></Campo>
      <Campo label="Proveedor habitual" className="sm:col-span-2"><Select name="proveedor_habitual_id" defaultValue={p?.proveedor_habitual_id ?? ""} vacio="Sin proveedor" opciones={(proveedores ?? []).map((x) => [x.id, x.nombre])} /></Campo>
      {!p?.id && <Campo label="Precio actual (€ sin IVA por unidad)"><Input name="precio" type="number" step="0.0001" min="0" /></Campo>}
      <fieldset className="sm:col-span-2"><legend className="mb-1 text-[12.5px] font-medium text-muted-foreground">Alérgenos</legend>
        <div className="flex flex-wrap gap-1.5">{ALERGENOS.map((a) => <label key={a} className="flex items-center gap-1.5 rounded-sm border border-input px-2 py-1 text-xs"><input type="checkbox" name="alergenos" value={a} defaultChecked={p?.alergenos?.includes(a)} />{a}</label>)}</div>
      </fieldset>
    </>
  );
  const camposProveedor = (p?: Tabla<"proveedores">) => (
    <>
      <Campo label="Proveedor"><Input name="nombre" required defaultValue={p?.nombre} /></Campo>
      <Campo label="CIF"><Input name="cif" defaultValue={p?.cif ?? ""} /></Campo>
      <Campo label="Qué sirve"><Input name="categoria" defaultValue={p?.categoria ?? ""} /></Campo>
      <Campo label="Comercial"><Input name="contacto" defaultValue={p?.contacto ?? ""} /></Campo>
      <Campo label="Correo"><Input name="email" type="email" defaultValue={p?.email ?? ""} /></Campo>
      <Campo label="Teléfono"><Input name="telefono" defaultValue={p?.telefono ?? ""} /></Campo>
      <Campo label="Condiciones" className="sm:col-span-2"><Textarea name="condiciones" defaultValue={p?.condiciones ?? ""} placeholder="Reparto, pedido mínimo, forma de pago" /></Campo>
    </>
  );

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Compras del mes" valor={eur(comprasMes)} ayuda="facturas validadas, sin IVA" />
        <Kpi label="Por revisar" valor={pendientes.length} tono={pendientes.length ? "warn" : "ok"} ayuda="facturas y albaranes" />
        <Kpi label={`Subidas ≥ ${SUBIDA} %`} valor={subidas.length} tono={subidas.length ? "bad" : "ok"} ayuda="último precio frente al anterior" />
        <Kpi label="Ahorro posible" valor={eur(comparativa.reduce((s, c) => s + Math.max(0, c.ahorro), 0))} ayuda="al año, comprando al mejor precio" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SubPestanas base={base} actual={v} items={[["facturas", "Facturas", pendientes.length], ["productos", "Productos y precios", subidas.length], ["comparativa", "Comparativa"], ["proveedores", "Proveedores"]]} />
        <BotonExcel href={`/exportar/compras?proyecto=${id}`} />
      </div>

      {v === "facturas" && (
        <div className="grid gap-4">
          <SubirFactura negocioId={nid} proyectoId={id} />
          {facturas?.length ? (
            <Card className="p-0"><div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Fecha</th><th className="px-2">Proveedor</th><th className="px-2">Documento</th><th className="px-2 text-right">Base</th><th className="px-2 text-right">Total</th><th className="px-2">Líneas</th><th className="px-5">Estado</th></tr></thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id} className="border-b last:border-0 hover:bg-muted/60">
                      <td className="tnum whitespace-nowrap px-5 py-2.5">{fecha(f.fecha)}</td>
                      <td className="px-2"><Link href={`${base}/facturas/${f.id}`} className="font-medium hover:text-primary-ink">{f.proveedores?.nombre ?? "Sin proveedor"}</Link></td>
                      <td className="px-2 text-muted-foreground">{f.tipo === "albaran" ? "Albarán" : "Factura"} {f.numero ?? ""}</td>
                      <td className="tnum px-2 text-right">{f.base != null ? eur(Number(f.base), 2) : "—"}</td>
                      <td className="tnum px-2 text-right">{f.total != null ? eur(Number(f.total), 2) : "—"}</td>
                      <td className="px-2 text-xs text-muted-foreground">{f.lineas_factura.length} · {f.lineas_factura.filter((l) => !l.producto_id).length ? <span className="text-warn">{f.lineas_factura.filter((l) => !l.producto_id).length} sin producto</span> : "todas enlazadas"}</td>
                      <td className="px-5"><Badge tono={f.estado === "validada" ? "ok" : "warn"}>{f.estado === "validada" ? "Validada" : "Por revisar"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></Card>
          ) : <Vacio titulo="Sin facturas">Sube la primera factura o albarán: es la forma más rápida de tener los precios reales.</Vacio>}
        </div>
      )}

      {v === "productos" && (
        <div className="grid gap-4">
          {subidas.length > 0 && (
            <Card className="border-bad/40">
              <CardHeader><CardTitle className="flex items-center gap-2 text-bad"><TrendingUp className="size-4" />Subidas de precio</CardTitle><span className="text-xs text-muted-foreground">Los escandallos ya usan el precio nuevo</span></CardHeader>
              <ul className="divide-y text-sm">
                {subidas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0"><b>{p.nombre}</b> <span className="text-muted-foreground">{eur(Number(p.precio_anterior), 2)} → {eur(Number(p.precio_actual), 2)}/{p.unidad} · {fechaCorta(p.fecha_precio)}</span>
                      {platosDe(p.id!).length > 0 && <span className="block text-xs text-muted-foreground">Afecta a: {platosDe(p.id!).join(", ")}</span>}</span>
                    <Badge tono="bad">+{numero(Number(p.variacion_pct), 1)} %</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="flex justify-end">
            <DialogoForm titulo="Nuevo producto" ancho="max-w-2xl" trigger={<Button size="sm"><Plus />Producto</Button>} action={async (fd) => { "use server"; return A.guardarProducto(nid, null, fd); }}>{camposProducto()}</DialogoForm>
          </div>
          {productos?.length ? (
            <Card className="p-0"><div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Producto</th><th className="px-2">Proveedor</th><th className="px-2 text-right">Precio</th><th className="px-2">Variación</th><th className="px-2 text-right">Merma</th><th className="px-2 text-right">Precio neto</th><th className="px-2">Evolución</th><th className="px-5"></th></tr></thead>
                <tbody>
                  {productos.map((p) => {
                    const serie = (precios ?? []).filter((x) => x.producto_id === p.id).map((x) => ({ periodo: fechaCorta(x.fecha), valor: Number(x.precio) }));
                    const varp = Number(p.variacion_pct ?? 0);
                    return (
                      <tr key={p.id} className={"border-b last:border-0 " + (p.activo ? "" : "opacity-50")}>
                        <td className="px-5 py-2"><p className="font-medium">{p.nombre}</p><p className="text-xs text-muted-foreground">{p.familia}{p.formato ? ` · ${p.formato}` : ""}{platosDe(p.id!).length ? ` · en ${platosDe(p.id!).length} ${platosDe(p.id!).length === 1 ? "plato" : "platos"}` : ""}</p></td>
                        <td className="px-2 text-muted-foreground">{prov(p.proveedor_habitual_id)}</td>
                        <td className="tnum whitespace-nowrap px-2 text-right">{p.precio_actual != null ? `${eur(Number(p.precio_actual), 2)}/${UNIDAD[p.unidad!]}` : <span className="text-warn">Sin precio</span>}</td>
                        <td className="px-2">{p.variacion_pct != null ? <Badge tono={varp >= SUBIDA ? "bad" : varp > 0 ? "warn" : varp < 0 ? "ok" : "neutro"}>{varp > 0 ? "+" : ""}{numero(varp, 1)} %</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                        <td className="tnum px-2 text-right">{numero(Number(p.merma_pct), 1)} %</td>
                        <td className="tnum whitespace-nowrap px-2 text-right font-medium">{p.precio_actual != null ? eur(precioNeto(Number(p.precio_actual), Number(p.merma_pct)), 2) : "—"}</td>
                        <td className="w-28 px-2">{serie.length > 1 ? <LineaKpi datos={serie} unidad="€" mini alto={32} /> : null}</td>
                        <td className="whitespace-nowrap px-5 text-right">
                          <DialogoForm titulo={`Precio de ${p.nombre}`} trigger={<Button variant="ghost" size="sm">Precio</Button>} action={async (fd) => { "use server"; return A.registrarPrecio(p.id!, fd); }}>
                            <Campo label={`€ sin IVA por ${p.unidad}`}><Input name="precio" type="number" step="0.0001" min="0" required /></Campo>
                            <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
                            <Campo label="Proveedor" className="sm:col-span-2"><Select name="proveedor_id" defaultValue={p.proveedor_habitual_id ?? ""} vacio="—" opciones={(proveedores ?? []).map((x) => [x.id, x.nombre])} /></Campo>
                          </DialogoForm>
                          <DialogoForm titulo="Editar producto" ancho="max-w-2xl" trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button>} action={async (fd) => { "use server"; return A.guardarProducto(nid, p.id!, fd); }}>{camposProducto(p as Tabla<"productos">)}</DialogoForm>
                          <BotonAccion variant="ghost" size="sm" accion={async () => { "use server"; return A.archivarProducto(p.id!, !p.activo); }}>{p.activo ? "Archivar" : "Activar"}</BotonAccion>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></Card>
          ) : <Vacio titulo="Sin productos">Se crean al validar facturas o a mano. Cada producto guarda su histórico de precios.</Vacio>}
          <p className="text-xs text-muted-foreground">Precio neto = precio de compra ÷ (1 − merma). Es el coste real de cada kg o litro que llega al plato.</p>
        </div>
      )}

      {v === "comparativa" && (
        comparativa.length ? (
          <Card className="p-0"><div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Producto</th><th className="px-2">Precios por proveedor (últimos 120 días)</th><th className="px-2 text-right">Diferencia</th><th className="px-5 text-right">Ahorro anual estimado</th></tr></thead>
              <tbody>
                {comparativa.map((c) => (
                  <tr key={c.p.id} className="border-b last:border-0">
                    <td className="px-5 py-2.5 font-medium">{c.p.nombre}</td>
                    <td className="px-2"><ul className="grid gap-0.5">{c.lista.map((l) => (
                      <li key={l.proveedor_id} className="flex items-center gap-2"><span className="tnum w-20 font-mono">{eur(l.precio, 2)}</span><span>{prov(l.proveedor_id)}</span>
                        {l === c.mejor && <Badge tono="ok">Mejor</Badge>}{l.proveedor_id === c.p.proveedor_habitual_id && <Badge>Habitual</Badge>}<span className="text-xs text-muted-foreground">{fechaCorta(l.fecha)}</span></li>
                    ))}</ul></td>
                    <td className="tnum px-2 text-right">{c.dif > 0 ? `${eur(c.dif, 2)}/${c.p.unidad}` : "—"}</td>
                    <td className="tnum px-5 text-right font-semibold">{c.ahorro > 0 ? eur(c.ahorro) : c.dif > 0 ? <span className="text-xs font-normal text-muted-foreground">sin consumo registrado</span> : "Ya compra al mejor"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div><p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Ahorro = diferencia con el proveedor habitual × consumo de los últimos 90 días (según facturas) × 4. Compara también calidad, calibre y servicio antes de cambiar.</p></Card>
        ) : <Vacio titulo="Sin datos para comparar">Aparecen aquí los productos con precios de dos o más proveedores en los últimos 4 meses.</Vacio>
      )}

      {v === "proveedores" && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Tus proveedores son comunes a todos los clientes. Compras de {negocio.nombre} entre paréntesis.</p>
            <DialogoForm titulo="Nuevo proveedor" trigger={<Button size="sm"><Plus />Proveedor</Button>} action={async (fd) => { "use server"; return A.guardarProveedor(null, fd); }}>{camposProveedor()}</DialogoForm>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {proveedores?.map((p) => {
              const compras = validadas.filter((f) => f.proveedor_id === p.id).reduce((s, f) => s + Number(f.base ?? 0), 0);
              return (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="font-semibold">{p.nombre}</p><p className="text-xs text-muted-foreground">{[p.categoria, p.cif].filter(Boolean).join(" · ")}</p></div>
                    <span className="flex">
                      <DialogoForm titulo="Editar proveedor" trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button>} action={async (fd) => { "use server"; return A.guardarProveedor(p.id, fd); }}>{camposProveedor(p)}</DialogoForm>
                      <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar proveedor" accion={async () => { "use server"; return A.borrarProveedor(p.id); }}><Trash2 /></BotonAccion>
                    </span>
                  </div>
                  <p className="mt-2 select-all break-all text-sm">{[p.contacto, p.telefono, p.email].filter(Boolean).join(" · ")}</p>
                  {p.condiciones && <p className="mt-1 text-xs text-muted-foreground">{p.condiciones}</p>}
                  <p className="mt-2 border-t border-dashed pt-2 text-sm">Compras a este cliente: <b className="tnum">{eur(compras)}</b></p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
