import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { baseDe, COSTE_KM, ESTADOS_PRESUPUESTO, TIPOS_HORA, totalFactura } from "@/lib/consultora";
import * as A from "@/app/acciones/consultora";
import { FormHoras } from "@/components/consultora/form-horas";
import { cn, diasHasta, eur, fecha, fechaCorta, hoyISO, mes, numero } from "@/lib/utils";

export const metadata = { title: "Consultora" };

export default async function Consultora({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v = "resumen" } = await searchParams;
  const { supabase, esAdmin, perfil } = await requiereEquipo();
  if (!esAdmin) redirect("/panel");
  const [{ data: horas }, { data: presupuestos }, { data: facturas }, { data: proyectos }, { data: negocios }, { data: finanzas }] = await Promise.all([
    supabase.from("horas").select("*").order("fecha", { ascending: false }),
    supabase.from("presupuestos").select("*, negocios(nombre)").order("fecha", { ascending: false }),
    supabase.from("facturas_emitidas").select("*, negocios(nombre)").order("fecha", { ascending: false }),
    supabase.from("proyectos").select("id, titulo, estado, codigo, negocios(nombre)").order("fecha_inicio", { ascending: false }),
    supabase.from("negocios").select("id, nombre").order("nombre"),
    supabase.from("proyecto_finanzas").select("*"),
  ]);
  const nombreProy = (id: string | null) => { const p = proyectos?.find((x) => x.id === id); return p ? `${p.negocios?.nombre} · ${p.titulo}` : "Interno"; };
  const tarifa = Number(perfil.tarifa_hora ?? 0);
  const mesActual = hoyISO().slice(0, 7);
  const año = hoyISO().slice(0, 4);
  const horasMes = (horas ?? []).filter((h) => h.fecha.startsWith(mesActual));
  const hMes = horasMes.reduce((s, h) => s + Number(h.horas), 0);
  const hFact = horasMes.filter((h) => h.proyecto_id).reduce((s, h) => s + Number(h.horas), 0);
  const pendientes = (facturas ?? []).filter((f) => f.estado === "pendiente");
  const pendiente = pendientes.reduce((s, f) => s + totalFactura(f), 0);
  const vencidas = pendientes.filter((f) => f.vencimiento && diasHasta(f.vencimiento) < 0);
  const facturadoAño = (facturas ?? []).filter((f) => f.fecha.startsWith(año)).reduce((s, f) => s + Number(f.base), 0);
  const enviados = (presupuestos ?? []).filter((p) => p.estado === "enviado");
  const decididos = (presupuestos ?? []).filter((p) => p.estado === "aceptado" || p.estado === "rechazado");
  const conversion = decididos.length ? decididos.filter((p) => p.estado === "aceptado").length / decididos.length : null;

  // Rentabilidad por proyecto
  const rent = (proyectos ?? []).map((p) => {
    const hs = (horas ?? []).filter((h) => h.proyecto_id === p.id);
    const h = hs.reduce((s, x) => s + Number(x.horas), 0), km = hs.reduce((s, x) => s + Number(x.km ?? 0), 0);
    const fin = finanzas?.find((f) => f.proyecto_id === p.id);
    const aceptado = (presupuestos ?? []).filter((x) => x.proyecto_id === p.id && x.estado === "aceptado").reduce((s, x) => s + baseDe(x.conceptos), 0);
    const ingresos = aceptado || Number(fin?.importe_presupuestado ?? 0);
    const facturado = (facturas ?? []).filter((f) => f.proyecto_id === p.id).reduce((s, f) => s + Number(f.base), 0);
    const cobrado = (facturas ?? []).filter((f) => f.proyecto_id === p.id && f.estado === "cobrada").reduce((s, f) => s + Number(f.base), 0);
    const t = Number(fin?.tarifa_hora ?? tarifa);
    const coste = h * t + km * COSTE_KM;
    const hPres = Number(fin?.horas_presupuestadas ?? 0);
    // Mientras el proyecto no ha consumido lo previsto, el €/h se calcula sobre las horas presupuestadas
    const previsto = p.estado !== "cerrado" && h < hPres;
    const hRef = previsto ? hPres : h;
    return { p, h, hPres, ingresos, facturado, cobrado, coste, margen: ingresos - coste, eurHora: hRef ? ingresos / hRef : null, previsto };
  }).filter((r) => r.h || r.ingresos);
  const base = "/consultora";
  const opcionesProy = (proyectos ?? []).filter((p) => p.estado !== "cerrado").map((p) => ({ id: p.id, nombre: `${p.negocios?.nombre} · ${p.titulo}` }));

  return (
    <>
      <Cabecera eyebrow="Tu negocio" titulo="Consultora" sub="Horas, propuestas, facturación y lo que te deja cada proyecto. La factura legal se emite en tu programa de facturación; aquí se registra para seguir cobros y márgenes.">
        <DialogoForm titulo="Registrar horas" trigger={<Button variant="outline"><Plus />Horas</Button>} action={async (fd) => { "use server"; return A.registrarHoras(fd); }}><FormHoras proyectos={opcionesProy} /></DialogoForm>
        <DialogoForm titulo="Nuevo presupuesto" trigger={<Button><Plus />Presupuesto</Button>} boton="Crear y editar"
          action={async (fd) => { "use server"; const r = await A.crearPresupuesto(fd); if (r.ok) redirect(`/consultora/presupuestos/${r.id}`); return r; }}>
          <Campo label="Cliente"><Select name="negocio_id" required vacio="Elige negocio" opciones={(negocios ?? []).map((n) => [n.id, n.nombre])} /></Campo>
          <Campo label="Título"><Input name="titulo" required placeholder="Control de costes y reorganización de cocina" /></Campo>
        </DialogoForm>
      </Cabecera>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Horas este mes" valor={numero(hMes, 1)} ayuda={`${numero(hFact, 1)} en proyectos · ${hMes ? numero((hFact / hMes) * 100, 0) : 0} % facturable`} />
        <Kpi label={`Facturado ${año}`} valor={eur(facturadoAño)} ayuda="base imponible" />
        <Kpi label="Pendiente de cobro" valor={eur(pendiente)} tono={vencidas.length ? "bad" : pendiente ? "warn" : "ok"} ayuda={vencidas.length ? `${vencidas.length} facturas vencidas` : `${pendientes.length} facturas`} />
        <Kpi label="Propuestas en el aire" valor={eur(enviados.reduce((s, p) => s + baseDe(p.conceptos), 0))} ayuda={`${enviados.length} ${enviados.length === 1 ? "enviada" : "enviadas"}${conversion != null ? ` · ${numero(conversion * 100, 0)} % aceptadas` : ""}`} />
      </div>
      <SubPestanas base={base} actual={v} items={[["resumen", "Rentabilidad"], ["horas", "Horas"], ["presupuestos", "Presupuestos", enviados.length], ["facturacion", "Facturación y cobros", vencidas.length]]} />

      {v === "resumen" && (
        <Card className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2">Proyecto</th><th className="px-2 text-right">Horas</th><th className="px-2 text-right">Ingresos</th><th className="px-2 text-right">Facturado / cobrado</th><th className="px-2 text-right">Coste</th><th className="px-2 text-right">Margen</th><th className="px-5 text-right">€ por hora real</th>
            </tr></thead>
            <tbody>
              {rent.map((r) => {
                const desv = r.hPres ? r.h / r.hPres : null;
                return (
                  <tr key={r.p.id} className="border-b last:border-0">
                    <td className="px-5 py-2.5"><Link href={`/proyectos/${r.p.id}`} className="font-medium hover:text-primary-ink">{r.p.titulo}</Link><p className="text-xs text-muted-foreground">{r.p.negocios?.nombre} · {r.p.codigo}</p></td>
                    <td className="tnum px-2 text-right">{numero(r.h, 1)}{r.hPres ? <span className="block text-xs text-muted-foreground">de {numero(r.hPres, 0)}{desv && desv > 1 ? <span className="text-bad"> (+{numero((desv - 1) * 100, 0)} %)</span> : ""}</span> : null}</td>
                    <td className="tnum px-2 text-right">{eur(r.ingresos)}</td>
                    <td className="tnum px-2 text-right">{eur(r.facturado)}<span className="block text-xs text-muted-foreground">{eur(r.cobrado)} cobrado</span></td>
                    <td className="tnum px-2 text-right text-muted-foreground">{eur(r.coste)}</td>
                    <td className={cn("tnum px-2 text-right font-semibold", r.margen < 0 ? "text-bad" : "text-ok")}>{eur(r.margen)}</td>
                    <td className={cn("tnum px-5 text-right font-medium", r.eurHora != null && tarifa && r.eurHora < tarifa && "text-bad")}>{r.eurHora != null ? eur(r.eurHora, 2) : "—"}{r.previsto && <span className="block text-xs font-normal text-muted-foreground">previsto</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-5 pb-4 pt-2 text-xs text-muted-foreground">Ingresos: presupuestos aceptados del proyecto. Coste: horas × tu tarifa interna ({eur(tarifa)}/h, en Ajustes) + kilómetros × {numero(COSTE_KM, 2)} €. En rojo, los proyectos donde cobras menos por hora que tu tarifa: se te ha ido de horas o lo presupuestaste bajo. «Previsto»: proyecto en curso que aún no ha gastado sus horas; se calcula sobre las presupuestadas.</p></Card>
      )}

      {v === "horas" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="p-0">
            {horas?.length ? <ul className="divide-y text-sm">
              {horas.slice(0, 60).map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="tnum w-14 shrink-0 text-xs text-muted-foreground">{fechaCorta(h.fecha)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{nombreProy(h.proyecto_id)}</p><p className="truncate text-xs text-muted-foreground">{TIPOS_HORA[h.tipo]}{h.descripcion ? ` · ${h.descripcion}` : ""}{h.km ? ` · ${numero(Number(h.km), 0)} km` : ""}</p></div>
                  <span className="tnum font-mono font-bold">{numero(Number(h.horas), 2)} h</span>
                  <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar" accion={async () => { "use server"; return A.borrarHoras(h.id); }}><Trash2 /></BotonAccion>
                </li>
              ))}
            </ul> : <div className="p-5"><Vacio titulo="Sin horas">Apunta cada visita y cada rato de oficina: es la única forma de saber si un proyecto te compensa.</Vacio></div>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Por mes</CardTitle></CardHeader>
            <ul className="grid gap-2 text-sm">
              {Object.entries((horas ?? []).reduce<Record<string, { t: number; p: number }>>((a, h) => { const k = h.fecha.slice(0, 7); a[k] ??= { t: 0, p: 0 }; a[k].t += Number(h.horas); if (h.proyecto_id) a[k].p += Number(h.horas); return a; }, {}))
                .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).map(([k, x]) => (
                <li key={k}>
                  <div className="flex justify-between"><span>{mes(k + "-01")}</span><span className="tnum">{numero(x.t, 1)} h · {numero(x.p, 1)} en proyectos</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand" style={{ width: `${Math.min(100, (x.t / 160) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">La barra llena son 160 h al mes.</p>
          </Card>
        </div>
      )}

      {v === "presupuestos" && (presupuestos?.length ? (
        <Card className="p-0"><ul className="divide-y">
          {presupuestos.map((p) => {
            const vence = new Date(p.fecha + "T12:00:00"); vence.setDate(vence.getDate() + p.validez_dias);
            const caducado = p.estado === "enviado" && vence < new Date();
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="tnum w-24 font-mono text-xs text-muted-foreground">{p.numero}</span>
                <div className="min-w-0 flex-1"><Link href={`/consultora/presupuestos/${p.id}`} className="font-medium hover:text-primary-ink">{p.titulo}</Link><p className="text-xs text-muted-foreground">{p.negocios?.nombre} · {fecha(p.fecha)}{p.proyecto_id ? " · con proyecto" : ""}</p></div>
                <span className="tnum w-24 text-right font-semibold">{eur(baseDe(p.conceptos))}</span>
                <Badge tono={p.estado === "aceptado" ? "ok" : p.estado === "rechazado" ? "bad" : caducado ? "bad" : p.estado === "enviado" ? "primary" : "neutro"}>{caducado ? "Caducado" : ESTADOS_PRESUPUESTO[p.estado]}</Badge>
              </li>
            );
          })}
        </ul></Card>
      ) : <Vacio titulo="Sin presupuestos">Crea tu primera propuesta: sale en PDF con tu sello y, al aceptarla, se convierte en proyecto.</Vacio>)}

      {v === "facturacion" && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <DialogoForm titulo="Registrar factura emitida" descripcion="Apunta aquí la factura que has emitido en tu programa de facturación." trigger={<Button size="sm"><Plus />Factura emitida</Button>}
              action={async (fd) => { "use server"; return A.registrarFacturaEmitida(fd); }}>
              <Campo label="Presupuesto" className="sm:col-span-2"><Select name="presupuesto_id" vacio="Sin presupuesto" opciones={(presupuestos ?? []).filter((p) => p.estado === "aceptado").map((p) => [p.id, `${p.numero} · ${p.negocios?.nombre} · ${p.titulo}`])} /></Campo>
              <Campo label="Cliente (si no hay presupuesto)"><Select name="negocio_id" vacio="—" opciones={(negocios ?? []).map((n) => [n.id, n.nombre])} /></Campo>
              <Campo label="Número de factura"><Input name="numero" required placeholder="F-2026-025" /></Campo>
              <Campo label="Concepto" className="sm:col-span-2"><Input name="concepto" /></Campo>
              <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
              <Campo label="Días para el pago"><Input name="dias_pago" type="number" min="0" defaultValue={15} /></Campo>
              <Campo label="Base imponible (€)"><Input name="base" type="number" step="0.01" min="0" required /></Campo>
              <Campo label="IVA (%)"><Input name="iva_pct" type="number" step="1" defaultValue={21} /></Campo>
              <Campo label="Retención IRPF (%)" ayuda="Si facturas como autónomo a una empresa: 15 % (7 % los primeros años)"><Input name="irpf_pct" type="number" step="1" defaultValue={0} /></Campo>
            </DialogoForm>
          </div>
          {facturas?.length ? (
            <Card className="p-0"><div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Factura</th><th className="px-2">Cliente</th><th className="px-2 text-right">Base</th><th className="px-2 text-right">Total</th><th className="px-2">Vencimiento</th><th className="px-2">Estado</th><th className="px-5" /></tr></thead>
                <tbody>
                  {facturas.map((f) => {
                    const d = f.vencimiento ? diasHasta(f.vencimiento) : null;
                    return (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="px-5 py-2.5"><p className="font-mono text-xs">{f.numero}</p><p className="text-xs text-muted-foreground">{fecha(f.fecha)}{f.concepto ? ` · ${f.concepto}` : ""}</p></td>
                        <td className="px-2">{f.negocios?.nombre}</td>
                        <td className="tnum px-2 text-right">{eur(Number(f.base), 2)}</td>
                        <td className="tnum px-2 text-right font-medium">{eur(totalFactura(f), 2)}</td>
                        <td className="px-2 text-xs">{f.estado === "cobrada" ? `Cobrada ${fechaCorta(f.fecha_cobro)}` : d != null ? <span className={d < 0 ? "font-semibold text-bad" : ""}>{d < 0 ? `Vencida hace ${-d} d` : `en ${d} d`}</span> : "—"}</td>
                        <td className="px-2"><Badge tono={f.estado === "cobrada" ? "ok" : d != null && d < 0 ? "bad" : "warn"}>{f.estado === "cobrada" ? "Cobrada" : "Pendiente"}</Badge></td>
                        <td className="whitespace-nowrap px-5 text-right">
                          <BotonAccion variant={f.estado === "cobrada" ? "ghost" : "outline"} accion={async () => { "use server"; return A.marcarCobrada(f.id, f.estado !== "cobrada"); }}>{f.estado === "cobrada" ? "Deshacer" : <><Check />Cobrada</>}</BotonAccion>
                          <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar" accion={async () => { "use server"; return A.borrarFacturaEmitida(f.id); }}><Trash2 /></BotonAccion>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></Card>
          ) : <Vacio titulo="Sin facturas registradas">Registra las facturas que emites para saber qué te deben y desde cuándo.</Vacio>}
        </div>
      )}
    </>
  );
}
