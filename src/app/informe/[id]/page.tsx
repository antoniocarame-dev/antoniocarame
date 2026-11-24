import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { RadarAreas } from "@/components/graficos";
import { requiereEquipo } from "@/lib/sesion";
import { KPIS_SECTOR } from "@/lib/resultados";
import { cargarInforme, TITULO_TIPO } from "@/lib/informe-datos";
import { AREAS, DAFO, MUDAS, PDCA, contenidoAuditoria, eur, fecha, mes, numero, valorKpi } from "@/lib/utils";

export const metadata = { title: "Informe" };

/** Mini gráfica de línea en SVG (sin JavaScript, imprime nítida). */
function Spark({ valores, objetivo }: { valores: number[]; objetivo?: number | null }) {
  if (valores.length < 2) return null;
  const todos = objetivo != null ? [...valores, objetivo] : valores;
  const min = Math.min(...todos), max = Math.max(...todos), W = 120, H = 32, r = max - min || 1;
  const x = (i: number) => (i / (valores.length - 1)) * (W - 4) + 2, y = (v: number) => H - 3 - ((v - min) / r) * (H - 6);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      {objetivo != null && <line x1={0} x2={W} y1={y(objetivo)} y2={y(objetivo)} stroke="#2f6f45" strokeDasharray="3 2" strokeWidth={1} />}
      <polyline fill="none" stroke="#b5651d" strokeWidth={2} points={valores.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      <circle cx={x(valores.length - 1)} cy={y(valores.at(-1)!)} r={2.5} fill="#b5651d" />
    </svg>
  );
}
const H2 = ({ n, children }: { n: number; children: React.ReactNode }) =>
  <h2 className="mb-3 mt-8 flex items-baseline gap-3 border-b border-[#1c2521] pb-1 font-mono text-[15px] font-bold break-after-avoid"><span className="text-[#b5651d]">{String(n).padStart(2, "0")}</span>{children}</h2>;

export default async function Informe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await requiereEquipo();
  const d = await cargarInforme(supabase, id);
  if (!d) notFound();
  const { inf, p, neg, org, sec, tareas, kpis, auditorias, hallazgos, acciones, estandares, formaciones, actas, enPeriodo, A1, D1, porArea, radar, hechas, pendCliente } = d;
  const costes = d.costes;
  let n = 0;
  const num = () => ++n;

  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[14px] leading-relaxed text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 16mm 15mm } @media print { body { background: white } .break-after-avoid { break-after: avoid } section, table, li { break-inside: avoid } }`}</style>
      <div className="mb-6 flex justify-end print:hidden"><BotonImprimir /></div>

      {/* Portada */}
      <header className="mb-8 border-b-2 border-[#1c2521] pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">{TITULO_TIPO[inf.tipo]}</p>
            <h1 className="mt-2 text-balance font-mono text-[28px] font-bold leading-tight">{inf.titulo}</h1>
            <p className="mt-2 text-[15px]">{neg.nombre} · {p.titulo}</p>
            <p className="text-[13px] text-[#5b615c]">Periodo: {fecha(inf.periodo_desde)} – {fecha(inf.periodo_hasta)} · Emitido el {fecha(new Date().toISOString())}</p>
          </div>
          <span className="-rotate-[4deg] rounded-md border-2 border-[#b5651d] px-2 py-1.5 font-mono text-2xl font-bold">AC</span>
        </div>
      </header>

      {inf.introduccion && <p className="whitespace-pre-wrap text-[15px]">{inf.introduccion}</p>}

      {sec.has("resumen") && (
        <section>
          <H2 n={num()}>Situación del proyecto</H2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-[#e4dcc9] p-3"><p className="text-[11px] uppercase tracking-wider text-[#5b615c]">Fase actual</p><p className="font-mono text-lg font-bold">{d.faseActual ?? "—"}</p></div>
            <div className="rounded border border-[#e4dcc9] p-3"><p className="text-[11px] uppercase tracking-wider text-[#5b615c]">Avance de tareas</p><p className="font-mono text-lg font-bold">{tareas?.length ? Math.round((hechas / tareas.length) * 100) : 0} %</p></div>
            <div className="rounded border border-[#e4dcc9] p-3"><p className="text-[11px] uppercase tracking-wider text-[#5b615c]">Entrega prevista</p><p className="font-mono text-lg font-bold">{fecha(p.fecha_fin)}</p></div>
          </div>
          {p.objetivos && <p className="mt-3"><b>Objetivos:</b> {p.objetivos}</p>}
        </section>
      )}

      {sec.has("kpis") && !!kpis?.length && (
        <section>
          <H2 n={num()}>Indicadores</H2>
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="border-b border-[#1c2521] text-left text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-1.5">Indicador</th><th className="text-right">Al empezar</th><th className="text-right">Ahora</th><th className="text-right">Objetivo</th><th className="pl-4">Evolución</th></tr></thead>
            <tbody>{kpis.map((k) => {
              const { serie, estado: e } = k; const u = serie.at(-1);
              return (
                <tr key={k.id} className="border-b border-[#e4dcc9]">
                  <td className="py-2 font-medium">{k.nombre}</td>
                  <td className="text-right text-[#5b615c]">{valorKpi(k.valor_base, k.unidad)}</td>
                  <td className={"text-right font-bold " + (e === "ok" ? "text-[#2f6f45]" : e === "bad" ? "text-[#a3322b]" : "")}>{valorKpi(u?.valor, k.unidad)}</td>
                  <td className="text-right">{valorKpi(k.objetivo, k.unidad)}</td>
                  <td className="pl-4"><Spark valores={serie.map((v) => Number(v.valor))} objetivo={k.objetivo} /></td>
                </tr>
              );
            })}</tbody>
          </table>
          <p className="mt-1 text-[11px] text-[#5b615c]">Línea discontinua verde: objetivo.</p>
        </section>
      )}

      {sec.has("resultados") && (enPeriodo.length > 0 || (A1 && D1)) && (
        <section>
          <H2 n={num()}>Resultados</H2>
          {enPeriodo.length > 0 && (
            <table className="mb-4 w-full border-collapse text-[13px]">
              <thead><tr className="border-b border-[#1c2521] text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-1.5 text-left">€ sin IVA</th>{enPeriodo.map((m) => <th key={m.periodo} className="text-right">{mes(m.periodo)}</th>)}</tr></thead>
              <tbody>
                {([["Ventas", (m) => m.ventas], ["Materia prima", (m) => m.costeMp], ["Personal", (m) => m.personal], ["EBITDA", (m) => m.ebitda]] as [string, (m: (typeof enPeriodo)[number]) => number | null][]).map(([l, f]) => (
                  <tr key={l} className={"border-b border-[#e4dcc9] " + (l === "EBITDA" ? "font-bold" : "")}><td className="py-1.5">{l}</td>{enPeriodo.map((m) => <td key={m.periodo} className="text-right">{f(m) != null ? eur(f(m)) : "—"}</td>)}</tr>
                ))}
                <tr className="text-[#5b615c]"><td className="py-1.5">Food cost</td>{enPeriodo.map((m) => <td key={m.periodo} className="text-right">{m.kpi.food_cost != null ? `${numero(m.kpi.food_cost * 100, 1)} %` : "—"}</td>)}</tr>
              </tbody>
            </table>
          )}
          {A1 && D1 && (
            <>
              <p className="mb-2 font-semibold">Antes y después del proyecto</p>
              <table className="w-full border-collapse text-[13px]">
                <thead><tr className="border-b border-[#1c2521] text-left text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-1.5">Indicador</th><th className="text-right">Antes</th><th className="text-right">Después</th><th className="text-right">Cambio</th></tr></thead>
                <tbody>{KPIS_SECTOR.filter((k) => ["food_cost", "labour_cost", "prime_cost", "ebitda_pct", "ticket_medio"].includes(k.codigo)).map((k) => {
                  const a = A1.kpi[k.codigo], d = D1.kpi[k.codigo];
                  const f = (v: number | null) => (v == null ? "—" : k.unidad === "%" ? `${numero(v * 100, 1)} %` : eur(v, 2));
                  const dif = a != null && d != null ? d - a : null; const bien = dif != null && (k.bajar ? dif < 0 : dif > 0);
                  return <tr key={k.codigo} className="border-b border-[#e4dcc9]"><td className="py-1.5">{k.nombre}</td><td className="text-right text-[#5b615c]">{f(a)}</td><td className="text-right font-bold">{f(d)}</td>
                    <td className={"text-right font-semibold " + (bien ? "text-[#2f6f45]" : "text-[#a3322b]")}>{dif == null ? "—" : k.unidad === "%" ? `${dif > 0 ? "+" : ""}${numero(dif * 100, 1)} pt` : `${dif > 0 ? "+" : ""}${eur(dif, 2)}`}</td></tr>;
                })}</tbody>
              </table>
              <p className="mt-2">EBITDA medio mensual: <b>{eur(A1.ebitdaMes)}</b> antes → <b>{eur(D1.ebitdaMes)}</b> ahora. Con las ventas actuales, la mejora del food cost supone unos <b>{eur(((A1.kpi.food_cost ?? 0) - (D1.kpi.food_cost ?? 0)) * D1.ventasMes * 12)}</b> al año.</p>
            </>
          )}
        </section>
      )}

      {sec.has("diagnostico") && (
        <section>
          <H2 n={num()}>Diagnóstico</H2>
          {radar.length >= 3 && <div className="mx-auto w-[460px] print:w-[420px]"><RadarAreas datos={radar} /></div>}
          {!!auditorias?.length && <p className="text-[13px] text-[#5b615c]">Puntuación sobre 100 por área: {[...porArea].map(([a, v]) => `${AREAS[a as keyof typeof AREAS]} ${Math.round(v.actual)}`).join(" · ")}.</p>}
          {(hallazgos ?? []).filter((h) => h.tipo !== "dafo").length > 0 && (
            <>
              <p className="mb-1 mt-4 font-semibold">Principales despilfarros detectados</p>
              <ul className="grid gap-1.5">{(hallazgos ?? []).filter((h) => h.tipo !== "dafo").slice(0, 8).map((h) => (
                <li key={h.id} className="flex gap-2"><span className="w-28 shrink-0 font-mono text-[11px] uppercase text-[#8a4a14]">{h.muda ? MUDAS[h.muda].nombre : "Observación"}</span><span><b>{h.titulo}.</b> {h.descripcion}{h.coste_estimado ? ` (≈ ${eur(Number(h.coste_estimado))}/mes)` : ""}</span></li>
              ))}</ul>
            </>
          )}
          {(hallazgos ?? []).some((h) => h.tipo === "dafo") && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
              {(["fortaleza", "debilidad", "oportunidad", "amenaza"] as const).map((d) => (
                <div key={d} className="rounded border border-[#e4dcc9] p-2.5"><p className="font-mono text-[11px] font-bold uppercase tracking-wider">{DAFO[d]}</p>
                  <ul>{(hallazgos ?? []).filter((h) => h.dafo === d).map((h) => <li key={h.id}>· {h.titulo}</li>)}</ul></div>
              ))}
            </div>
          )}
        </section>
      )}

      {sec.has("costes") && costes && (
        <section>
          <H2 n={num()}>Costes y escandallos</H2>
          <p>{costes.platos} platos escandallados. Food cost objetivo: {numero(costes.objetivo * 100, 0)} %. {costes.sobre.length ? `${costes.sobre.length} por encima del objetivo:` : "Todos dentro del objetivo."}</p>
          {costes.sobre.length > 0 && <table className="mt-2 w-full border-collapse text-[13px]"><tbody>{costes.sobre.map((e) => (
            <tr key={e.id} className="border-b border-[#e4dcc9]"><td className="py-1.5">{e.nombre}</td><td className="text-right">coste {eur(e.coste, 2)}</td><td className="text-right">PVP {eur(e.pvp, 2)}</td><td className="text-right font-bold text-[#a3322b]">{numero(e.foodCost * 100, 1)} %</td><td className="text-right">PVP recomendado {eur(e.pvpRecomendado, 2)}</td></tr>))}</tbody></table>}
          {costes.subidas.length > 0 && <p className="mt-3"><b>Subidas de precio relevantes:</b> {costes.subidas.map((x) => `${x.nombre} (+${numero(x.variacion, 1)} %)`).join(", ")}.</p>}
        </section>
      )}

      {sec.has("acciones") && !!acciones?.length && (
        <section>
          <H2 n={num()}>Plan de mejora</H2>
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="border-b border-[#1c2521] text-left text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-1.5">Acción</th><th>Fase</th><th>Responsable</th><th>Fecha</th></tr></thead>
            <tbody>{acciones.map((a) => (
              <tr key={a.id} className="border-b border-[#e4dcc9] align-top">
                <td className="py-2 pr-3"><b>{a.titulo}</b>{a.resultado && <span className="block text-[#5b615c]">{a.resultado}</span>}</td>
                <td className="whitespace-nowrap pr-3">{PDCA[a.fase_pdca].nombre}</td>
                <td className="pr-3">{a.responsable_externo ?? (a.responsable_id ? perfil.nombre : "—")}</td>
                <td className="whitespace-nowrap">{fecha(a.fecha_objetivo, { day: "numeric", month: "short" })}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}

      {sec.has("estandares") && (!!estandares?.length || !!formaciones?.length) && (
        <section>
          <H2 n={num()}>Estándares y formación</H2>
          {!!estandares?.length && <ul className="grid gap-1">{estandares.map((e) => <li key={e.id}>· <b>{e.titulo}</b> ({{ sop: "procedimiento", checklist: "checklist", ficha: "ficha", manual: "manual" }[e.tipo]}, v{e.version}) — {{ borrador: "en preparación", en_prueba: "en prueba", implantado: `implantado ${e.fecha_implantacion ? "el " + fecha(e.fecha_implantacion) : ""}` }[e.estado]}{e.responsable_externo ? ` · responsable: ${e.responsable_externo}` : ""}{e.contenido ? ` · ${contenidoAuditoria(e.contenido).secciones.reduce((s, x) => s + x.items.length, 0)} puntos` : ""}</li>)}</ul>}
          {!!formaciones?.length && <p className="mt-3">Formaciones del periodo: {formaciones.map((f) => { const as = f.asistentes as { asistio: boolean }[]; return `${f.titulo} (${fecha(f.fecha, { day: "numeric", month: "short" })}, ${numero(Number(f.duracion_h), 1)} h, ${as.filter((a) => a.asistio).length}/${as.length} asistentes)`; }).join("; ")}.</p>}
        </section>
      )}

      {sec.has("tareas_cliente") && pendCliente.length > 0 && (
        <section>
          <H2 n={num()}>Pendiente por vuestra parte</H2>
          <ul className="grid gap-1">{pendCliente.map((t) => <li key={t.id} className="flex justify-between gap-3 border-b border-dashed border-[#e4dcc9] py-1"><span>☐ {t.titulo}</span><span className="whitespace-nowrap text-[#5b615c]">{t.responsable_externo}{t.vence ? ` · ${fecha(t.vence, { day: "numeric", month: "short" })}` : ""}</span></li>)}</ul>
        </section>
      )}

      {sec.has("actas") && !!actas?.length && (
        <section>
          <H2 n={num()}>Reuniones del periodo</H2>
          {actas.map((a) => (
            <div key={a.id} className="mb-3"><p className="font-semibold">{fecha(a.fecha)} · {a.titulo}</p>{a.contenido && <p>{a.contenido}</p>}
              {Array.isArray(a.acuerdos) && a.acuerdos.length > 0 && <ul className="text-[13px]">{(a.acuerdos as { texto: string; responsable?: string }[]).map((c, i) => <li key={i}>· {c.texto}{c.responsable ? ` (${c.responsable})` : ""}</li>)}</ul>}</div>
          ))}
        </section>
      )}

      {(inf.conclusiones || inf.proximos_pasos) && (
        <section>
          <H2 n={num()}>Conclusiones y próximos pasos</H2>
          {inf.conclusiones && <p className="whitespace-pre-wrap">{inf.conclusiones}</p>}
          {inf.proximos_pasos && <><p className="mt-3 font-semibold">Próximos pasos</p><p className="whitespace-pre-wrap">{inf.proximos_pasos}</p></>}
        </section>
      )}

      <footer className="mt-10 flex justify-between border-t border-dashed border-[#5b615c] pt-2 text-[11px] text-[#5b615c]">
        <span>{org?.nombre}</span><span>{perfil.nombre}{perfil.telefono ? ` · ${perfil.telefono}` : ""}{perfil.email ? ` · ${perfil.email}` : ""}</span>
      </footer>
    </main>
  );
}
