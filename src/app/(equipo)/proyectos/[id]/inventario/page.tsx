import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { FormAccion } from "@/components/form-accion";
import { BotonAccion } from "@/components/boton-accion";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { BotonExcel } from "@/components/boton-excel";
import { Vacio } from "@/components/ui/vacio";
import { cargarEscandallos } from "@/lib/negocio";
import { consumoTeorico, MOTIVOS_MERMA } from "@/lib/costes";
import * as A from "@/app/acciones/inventario";
import { eur, fecha, fechaCorta, hoyISO, mes, numero } from "@/lib/utils";

export default async function InventarioYMermas({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string; desde?: string; hasta?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const v = sp.v ?? "mermas";
  const { supabase, negocio, productos, escandallos, calculos, ventas } = await cargarEscandallos(id);
  const nid = negocio.id;
  const base = `/proyectos/${id}/inventario`;
  const [{ data: mermas }, { data: inventarios }] = await Promise.all([
    supabase.from("mermas").select("*").eq("negocio_id", nid).order("fecha", { ascending: false }),
    supabase.from("inventarios").select("*, inventario_lineas(producto_id, cantidad, precio)").eq("negocio_id", nid).order("fecha", { ascending: false }),
  ]);
  const prod = new Map(productos.map((p) => [p.id!, p]));
  const esc = new Map(escandallos.map((e) => [e.id, e]));
  const costeRacion = Object.fromEntries(escandallos.map((e) => [e.id, calculos.get(e.id)?.costeRacion ?? 0]));

  // Mermas: este mes y por motivo (últimos 90 días)
  const mesActual = hoyISO().slice(0, 7);
  const hace90 = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const delMes = (mermas ?? []).filter((m) => m.fecha.startsWith(mesActual));
  const ult90 = (mermas ?? []).filter((m) => m.fecha >= hace90);
  const porMotivo = Object.entries(ult90.reduce<Record<string, number>>((a, m) => ({ ...a, [m.motivo]: (a[m.motivo] ?? 0) + Number(m.coste) }), {})).sort((a, b) => b[1] - a[1]);
  const maxMotivo = Math.max(1, ...porMotivo.map(([, c]) => c));
  const { data: comprasMes } = await supabase.from("facturas").select("base").eq("negocio_id", nid).eq("estado", "validada").gte("fecha", mesActual + "-01");
  const compras = (comprasMes ?? []).reduce((s, f) => s + Number(f.base ?? 0), 0);
  const costeMes = delMes.reduce((s, m) => s + Number(m.coste), 0);

  // Consumo real vs teórico entre dos inventarios cerrados
  const cerrados = (inventarios ?? []).filter((i) => i.estado === "cerrado").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const fin = cerrados.find((i) => i.id === sp.hasta) ?? cerrados.at(-1);
  const ini = cerrados.find((i) => i.id === sp.desde) ?? cerrados.filter((i) => fin && i.fecha < fin.fecha).at(-1);
  let consumo: { filas: { pid: string; nombre: string; unidad: string; inicial: number; compras: number; final: number; real: number; teorico: number | null; precio: number }[]; meses: string[]; mermasPeriodo: number } | null = null;
  if (ini && fin && ini.fecha < fin.fecha) {
    const { data: lineasCompra } = await supabase.from("lineas_factura").select("producto_id, cantidad, facturas!inner(negocio_id, fecha, estado)")
      .eq("facturas.negocio_id", nid).eq("facturas.estado", "validada").gt("facturas.fecha", ini.fecha).lte("facturas.fecha", fin.fecha).not("producto_id", "is", null);
    const comprado = new Map<string, number>();
    (lineasCompra ?? []).forEach((l) => comprado.set(l.producto_id!, (comprado.get(l.producto_id!) ?? 0) + Number(l.cantidad)));
    const meses = [...new Set(ventas.filter((x) => x.periodo > ini.fecha && x.periodo <= fin.fecha).map((x) => x.periodo))];
    const uds = new Map<string, number>();
    ventas.filter((x) => meses.includes(x.periodo)).forEach((x) => uds.set(x.escandallo_id, (uds.get(x.escandallo_id) ?? 0) + x.unidades));
    const teo = consumoTeorico(escandallos, uds);
    const qIni = new Map(ini.inventario_lineas.map((l) => [l.producto_id, Number(l.cantidad ?? 0)]));
    const qFin = new Map(fin.inventario_lineas.map((l) => [l.producto_id, { c: Number(l.cantidad ?? 0), p: Number(l.precio ?? 0) }]));
    const ids = new Set([...qIni.keys(), ...qFin.keys(), ...comprado.keys()]);
    const filas = [...ids].map((pid) => {
      const p = prod.get(pid);
      const inicial = qIni.get(pid) ?? 0, final = qFin.get(pid)?.c ?? 0, c = comprado.get(pid) ?? 0;
      return { pid, nombre: p?.nombre ?? "—", unidad: p?.unidad ?? "", inicial, compras: c, final, real: inicial + c - final,
        teorico: meses.length ? teo.get(pid) ?? 0 : null, precio: qFin.get(pid)?.p || Number(p?.precio_actual ?? 0) };
    }).filter((f) => f.real !== 0 || (f.teorico ?? 0) !== 0).sort((a, b) => (b.real - (b.teorico ?? 0)) * b.precio - (a.real - (a.teorico ?? 0)) * a.precio);
    const mermasPeriodo = (mermas ?? []).filter((m) => m.fecha > ini.fecha && m.fecha <= fin.fecha).reduce((s, m) => s + Number(m.coste), 0);
    consumo = { filas, meses, mermasPeriodo };
  }
  const valorReal = consumo?.filas.reduce((s, f) => s + f.real * f.precio, 0) ?? 0;
  const valorTeo = consumo?.filas.reduce((s, f) => s + (f.teorico ?? 0) * f.precio, 0) ?? 0;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Mermas del mes" valor={eur(costeMes)} tono={costeMes ? "warn" : undefined} ayuda={`${delMes.length} registros`} />
        <Kpi label="Mermas sobre compras" valor={compras ? `${numero((costeMes / compras) * 100, 1)} %` : "—"} ayuda="del mes en curso" />
        <Kpi label="Último inventario" valor={cerrados.at(-1) ? eur(cerrados.at(-1)!.inventario_lineas.reduce((s, l) => s + Number(l.cantidad ?? 0) * Number(l.precio ?? 0), 0)) : "—"} ayuda={cerrados.at(-1) ? `${cerrados.at(-1)!.nombre} · ${fecha(cerrados.at(-1)!.fecha)}` : "sin inventarios cerrados"} />
        <Kpi label="Desviación de consumo" valor={consumo?.meses.length ? eur(valorReal - valorTeo) : "—"} tono={consumo?.meses.length && valorReal - valorTeo > 0 ? "bad" : undefined} ayuda={consumo?.meses.length ? "real menos teórico" : "hacen falta 2 inventarios y ventas"} />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SubPestanas base={base} actual={v} items={[["mermas", "Mermas"], ["inventarios", "Inventarios"], ["consumo", "Consumo real vs. teórico"]]} />
        <BotonExcel href={`/exportar/mermas?proyecto=${id}`} />
      </div>

      {v === "mermas" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="grid content-start gap-4">
            <Card>
              <CardHeader><CardTitle>Registrar merma</CardTitle></CardHeader>
              <FormAccion action={async (fd) => { "use server"; return A.registrarMerma(nid, fd, costeRacion); }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Qué se ha perdido" className="sm:col-span-2">
                    <select name="origen" required className="h-9 rounded-sm border border-input bg-card px-2.5 text-sm">
                      <option value="">Elige producto o plato</option>
                      <optgroup label="Platos (raciones)">{escandallos.filter((e) => e.tipo === "plato").map((e) => <option key={e.id} value={`e:${e.id}`}>{e.nombre}</option>)}</optgroup>
                      <optgroup label="Productos">{productos.filter((p) => p.activo).map((p) => <option key={p.id} value={`p:${p.id}`}>{p.nombre} ({p.unidad})</option>)}</optgroup>
                    </select>
                  </Campo>
                  <Campo label="Cantidad" ayuda="kg, litros, unidades o raciones"><Input name="cantidad" type="number" step="0.001" min="0" required /></Campo>
                  <Campo label="Motivo"><Select name="motivo" opciones={Object.entries(MOTIVOS_MERMA)} /></Campo>
                  <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
                  <Campo label="Nota"><Input name="notas" /></Campo>
                </div>
                <div className="mt-3 flex justify-end"><Button type="submit">Registrar</Button></div>
              </FormAccion>
              <p className="mt-2 text-xs text-muted-foreground">Se valora sola: productos al último precio de compra y platos al coste de su escandallo.</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Por motivo</CardTitle><span className="text-xs text-muted-foreground">últimos 90 días</span></CardHeader>
              {porMotivo.length ? (
                <ul className="grid gap-2 text-sm">
                  {porMotivo.map(([m, c]) => (
                    <li key={m}>
                      <div className="flex justify-between"><span>{MOTIVOS_MERMA[m]}</span><span className="tnum font-medium">{eur(c)}</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand" style={{ width: `${(c / maxMotivo) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Sin mermas registradas.</p>}
            </Card>
          </div>
          <Card className="p-0">
            <div className="px-5 pt-5"><CardTitle>Registro</CardTitle></div>
            {mermas?.length ? (
              <ul className="mt-2 divide-y text-sm">
                {mermas.map((m) => {
                  const nombre = m.producto_id ? prod.get(m.producto_id)?.nombre : m.escandallo_id ? esc.get(m.escandallo_id)?.nombre : "—";
                  const ud = m.producto_id ? prod.get(m.producto_id)?.unidad : "raciones";
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="tnum w-14 shrink-0 text-xs text-muted-foreground">{fechaCorta(m.fecha)}</span>
                      <div className="min-w-0 flex-1"><p className="font-medium">{nombre} <span className="font-normal text-muted-foreground">· {numero(Number(m.cantidad), 2)} {ud}</span></p>{m.notas && <p className="text-xs text-muted-foreground">{m.notas}</p>}</div>
                      <Badge tono={m.motivo === "sobreproduccion" || m.motivo === "caducidad" ? "warn" : "neutro"}>{MOTIVOS_MERMA[m.motivo]}</Badge>
                      <span className="tnum w-20 text-right font-medium">{eur(Number(m.coste), 2)}</span>
                      <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar" accion={async () => { "use server"; return A.borrarMerma(m.id); }}><Trash2 /></BotonAccion>
                    </li>
                  );
                })}
              </ul>
            ) : <div className="p-5"><Vacio titulo="Sin mermas">Pide al equipo que registre lo que se tira: es la forma de saber dónde se va el margen.</Vacio></div>}
          </Card>
        </div>
      )}

      {v === "inventarios" && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <DialogoForm titulo="Nuevo inventario" descripcion="Se crea con todos los productos activos para contarlos." trigger={<Button size="sm"><Plus />Inventario</Button>}
              action={async (fd) => { "use server"; return A.crearInventario(nid, fd); }} boton="Empezar recuento">
              <Campo label="Nombre"><Input name="nombre" required defaultValue={`Cierre de ${new Date().toLocaleDateString("es-ES", { month: "long" })}`} /></Campo>
              <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
            </DialogoForm>
          </div>
          {inventarios?.length ? (
            <Card className="p-0"><ul className="divide-y">
              {inventarios.map((i) => {
                const valor = i.inventario_lineas.reduce((s, l) => s + Number(l.cantidad ?? 0) * (l.precio != null ? Number(l.precio) : Number(prod.get(l.producto_id)?.precio_actual ?? 0)), 0);
                const contadas = i.inventario_lineas.filter((l) => l.cantidad != null).length;
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1"><Link href={`${base}/${i.id}`} className="font-medium hover:text-primary-ink">{i.nombre}</Link><p className="text-xs text-muted-foreground">{fecha(i.fecha)} · {contadas}/{i.inventario_lineas.length} productos contados</p></div>
                    <Badge tono={i.estado === "cerrado" ? "ok" : "warn"}>{i.estado === "cerrado" ? "Cerrado" : "Contando"}</Badge>
                    <span className="tnum w-24 text-right font-semibold">{eur(valor)}</span>
                    <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar inventario" accion={async () => { "use server"; return A.borrarInventario(i.id); }}><Trash2 /></BotonAccion>
                  </li>
                );
              })}
            </ul></Card>
          ) : <Vacio titulo="Sin inventarios">Haz un recuento a final de mes. Con dos seguidos verás el consumo real.</Vacio>}
        </div>
      )}

      {v === "consumo" && (
        consumo ? (
          <div className="grid gap-4">
            <form className="flex flex-wrap items-end gap-2" action={base}>
              <input type="hidden" name="v" value="consumo" />
              <Campo label="Desde"><Select name="desde" defaultValue={ini!.id} opciones={cerrados.map((i) => [i.id, `${i.nombre} (${fechaCorta(i.fecha)})`])} /></Campo>
              <Campo label="Hasta"><Select name="hasta" defaultValue={fin!.id} opciones={cerrados.map((i) => [i.id, `${i.nombre} (${fechaCorta(i.fecha)})`])} /></Campo>
              <Button variant="outline" type="submit">Calcular</Button>
            </form>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Consumo real" valor={eur(valorReal)} ayuda="inicial + compras − final" />
              <Kpi label="Consumo teórico" valor={consumo.meses.length ? eur(valorTeo) : "—"} ayuda={consumo.meses.length ? `ventas de ${consumo.meses.map((m) => mes(m)).join(", ")} × escandallos` : "sin ventas registradas en el periodo"} />
              <Kpi label="Diferencia" valor={consumo.meses.length ? eur(valorReal - valorTeo) : "—"} tono={valorReal - valorTeo > 0 ? "bad" : "ok"} ayuda={valorReal ? `${numero(((valorReal - valorTeo) / valorReal) * 100, 1)} % del consumo` : undefined} />
              <Kpi label="Sin explicar" valor={consumo.meses.length ? eur(valorReal - valorTeo - consumo.mermasPeriodo) : "—"} tono={valorReal - valorTeo - consumo.mermasPeriodo > 0 ? "warn" : undefined} ayuda={`descontando ${eur(consumo.mermasPeriodo)} de mermas registradas`} />
            </div>
            <Card className="p-0"><div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2">Producto</th><th className="px-2 text-right">Inicial</th><th className="px-2 text-right">+ Compras</th><th className="px-2 text-right">− Final</th><th className="px-2 text-right">Real</th><th className="px-2 text-right">Teórico</th><th className="px-2 text-right">Desviación</th><th className="px-5 text-right">Valor</th>
                </tr></thead>
                <tbody>
                  {consumo.filas.map((f) => {
                    const dev = f.teorico != null ? f.real - f.teorico : null;
                    const pctDev = dev != null && f.teorico ? dev / f.teorico : null;
                    return (
                      <tr key={f.pid} className="border-b last:border-0">
                        <td className="px-5 py-2 font-medium">{f.nombre}</td>
                        <td className="tnum px-2 text-right">{numero(f.inicial, 2)}</td>
                        <td className="tnum px-2 text-right">{numero(f.compras, 2)}</td>
                        <td className="tnum px-2 text-right">{numero(f.final, 2)}</td>
                        <td className="tnum px-2 text-right font-medium">{numero(f.real, 2)} {f.unidad}</td>
                        <td className="tnum px-2 text-right text-muted-foreground">{f.teorico != null ? `${numero(f.teorico, 2)} ${f.unidad}` : "—"}</td>
                        <td className="px-2 text-right">{pctDev != null ? <Badge tono={pctDev > 0.1 ? "bad" : pctDev > 0.03 ? "warn" : "ok"}>{pctDev > 0 ? "+" : ""}{numero(pctDev * 100, 0)} %</Badge> : dev != null && dev > 0 ? <Badge tono="warn">sin escandallo</Badge> : "—"}</td>
                        <td className={"tnum px-5 text-right " + (dev != null && dev * f.precio > 20 ? "font-semibold text-bad" : "")}>{dev != null ? eur(dev * f.precio) : eur(f.real * f.precio)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Teórico = raciones vendidas × cantidad bruta del escandallo (las elaboraciones se descomponen en sus productos). Una desviación alta apunta a raciones más grandes que la ficha, mermas sin registrar, invitaciones o pérdidas. En «Valor», lo que cuesta la desviación.</p></Card>
          </div>
        ) : <Vacio titulo="Hacen falta dos inventarios cerrados">El consumo real sale de inventario inicial + compras validadas − inventario final. Con ventas por plato del mismo mes, se compara con el teórico de los escandallos.</Vacio>
      )}
    </div>
  );
}
