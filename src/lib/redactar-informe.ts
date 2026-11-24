import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { KPIS_SECTOR } from "./resultados";
import { AREAS, DAFO, MUDAS, PDCA, eur, fecha, numero, valorKpi } from "./utils";
import { TITULO_TIPO, type DatosInforme } from "./informe-datos";

export const Redaccion = z.object({
  introduccion: z.string().describe("2-4 frases: qué se ha hecho en el periodo y para qué"),
  conclusiones: z.string().describe("Lo que dicen los datos y por qué, en 2-4 párrafos breves"),
  proximos_pasos: z.string().describe("Lista de 3-6 pasos concretos, una línea por paso empezando por «· », con responsable y plazo si se conocen"),
});
export type Redaccion = z.infer<typeof Redaccion>;

const pct = (v: number | null | undefined) => (v == null ? "—" : `${numero(v * 100, 1)} %`);

/** Los hechos del proyecto en texto plano: es lo único que puede usar la redacción. */
export function hechosDelInforme(d: DatosInforme): string {
  const l: string[] = [];
  l.push(`${TITULO_TIPO[d.inf.tipo]}: «${d.inf.titulo}»`);
  l.push(`Cliente: ${d.neg.nombre}${d.neg.localidad ? ` (${d.neg.localidad})` : ""}. Proyecto: ${d.p.titulo}.`);
  l.push(`Periodo del informe: ${fecha(d.inf.periodo_desde)} – ${fecha(d.inf.periodo_hasta)}.`);
  if (d.p.objetivos) l.push(`Objetivos del proyecto: ${d.p.objetivos}`);
  l.push(`Fase actual: ${d.faseActual ?? "—"}. Tareas hechas: ${d.hechas} de ${d.tareas.length}. Entrega prevista: ${fecha(d.p.fecha_fin)}.`);
  if (d.kpis.length) {
    l.push("\nINDICADORES (inicio → ahora, objetivo):");
    d.kpis.forEach((k) => l.push(`- ${k.nombre}: ${valorKpi(k.valor_base, k.unidad)} → ${valorKpi(k.ultimo, k.unidad)} (objetivo ${valorKpi(k.objetivo, k.unidad)}; ${k.estado === "ok" ? "en objetivo" : k.estado === "bad" ? "fuera de objetivo" : "en camino"})`));
  }
  if (d.enPeriodo.length) {
    l.push("\nCUENTA DE RESULTADOS POR MES (€ sin IVA):");
    d.enPeriodo.forEach((m) => l.push(`- ${m.periodo.slice(0, 7)}: ventas ${eur(m.ventas)}, materia prima ${eur(m.costeMp)}, personal ${eur(m.personal)}, EBITDA ${m.ebitda != null ? eur(m.ebitda) : "—"}, food cost ${pct(m.kpi.food_cost)}`));
  }
  if (d.A1 && d.D1) {
    l.push("\nANTES Y DESPUÉS DEL PROYECTO:");
    KPIS_SECTOR.filter((k) => ["food_cost", "labour_cost", "prime_cost", "ebitda_pct", "ticket_medio"].includes(k.codigo)).forEach((k) => {
      const f = (v: number | null) => (v == null ? "—" : k.unidad === "%" ? pct(v) : eur(v, 2));
      l.push(`- ${k.nombre}: ${f(d.A1!.kpi[k.codigo])} → ${f(d.D1!.kpi[k.codigo])}`);
    });
    l.push(`- EBITDA medio mensual: ${eur(d.A1.ebitdaMes)} → ${eur(d.D1.ebitdaMes)}`);
  }
  if (d.porArea.size) {
    l.push("\nAUDITORÍAS (puntuación sobre 100, primera → última):");
    d.porArea.forEach((v, a) => l.push(`- ${AREAS[a as keyof typeof AREAS]}: ${Math.round(v.inicial)} → ${Math.round(v.actual)}`));
  }
  const noDafo = d.hallazgos.filter((h) => h.tipo !== "dafo");
  if (noDafo.length) {
    l.push("\nHALLAZGOS Y NECESIDADES (por impacto):");
    noDafo.slice(0, 12).forEach((h) => l.push(`- ${h.muda ? MUDAS[h.muda].nombre : "Observación"}: ${h.titulo}${h.descripcion ? ` — ${h.descripcion}` : ""}${h.coste_estimado ? ` (≈ ${eur(Number(h.coste_estimado))}/mes)` : ""}`));
  }
  const dafo = d.hallazgos.filter((h) => h.tipo === "dafo" && h.dafo);
  if (dafo.length) { l.push("\nDAFO:"); dafo.forEach((h) => l.push(`- ${DAFO[h.dafo!]}: ${h.titulo}`)); }
  if (d.costes) {
    l.push(`\nCOSTES: ${d.costes.platos} platos escandallados; food cost objetivo ${pct(d.costes.objetivo)}.`);
    d.costes.sobre.forEach((e) => l.push(`- Por encima del objetivo: ${e.nombre}, food cost ${pct(e.foodCost)}, PVP ${eur(e.pvp, 2)}, PVP recomendado ${eur(e.pvpRecomendado, 2)}`));
    d.costes.subidas.forEach((x) => l.push(`- Subida de precio de compra: ${x.nombre} +${numero(x.variacion, 1)} %`));
  }
  if (d.acciones.length) {
    l.push("\nPLAN DE MEJORA:");
    d.acciones.forEach((a) => l.push(`- ${a.titulo} · ${PDCA[a.fase_pdca].nombre}${a.responsable_externo ? ` · responsable: ${a.responsable_externo}` : ""}${a.fecha_objetivo ? ` · fecha: ${fecha(a.fecha_objetivo)}` : ""}${a.resultado ? ` · resultado: ${a.resultado}` : ""}`));
  }
  if (d.estandares.length) { l.push("\nESTÁNDARES:"); d.estandares.forEach((e) => l.push(`- ${e.titulo} (${e.estado})`)); }
  if (d.formaciones.length) { l.push("\nFORMACIONES DEL PERIODO:"); d.formaciones.forEach((f) => l.push(`- ${f.titulo}, ${fecha(f.fecha)}`)); }
  if (d.pendCliente.length) { l.push("\nPENDIENTE POR PARTE DEL CLIENTE:"); d.pendCliente.forEach((t) => l.push(`- ${t.titulo}${t.responsable_externo ? ` (${t.responsable_externo})` : ""}${t.vence ? `, antes del ${fecha(t.vence)}` : ""}`)); }
  if (d.actas.length) {
    l.push("\nREUNIONES DEL PERIODO:");
    d.actas.forEach((a) => l.push(`- ${fecha(a.fecha)} · ${a.titulo}${a.contenido ? `: ${a.contenido.slice(0, 600)}` : ""}`));
  }
  return l.join("\n");
}

const INSTRUCCIONES = `Eres el consultor de hostelería que firma este informe (consultora gastronómica en España, método lean/kaizen).
Redacta para la propiedad del restaurante: castellano de España, tono profesional, cercano y directo, en primera persona del plural («hemos revisado…»), tratando al cliente de «vosotros».
Reglas:
- Usa SOLO los datos facilitados. No inventes cifras, nombres, fechas ni resultados. Si falta un dato, no lo menciones.
- Las cifras, con formato español (1.234,5 €; 31,2 %).
- Conclusiones: qué ha mejorado, qué no y la causa probable, priorizando lo que más dinero supone.
- Próximos pasos: acciones concretas y medibles que se desprendan de los datos.
- Sin títulos, sin markdown, sin negritas. Párrafos cortos.`;

export async function redactarInforme(d: DatosInforme, indicaciones: string | null): Promise<{ ok: true; datos: Redaccion } | { ok: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "La redacción automática no está configurada: falta la clave ANTHROPIC_API_KEY en Vercel." };
  }
  const client = new Anthropic();
  try {
    const r = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 6000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCCIONES,
      output_config: { effort: "low", format: betaZodOutputFormat(Redaccion) },
      messages: [{ role: "user", content: `Datos del proyecto:\n\n${hechosDelInforme(d)}${indicaciones ? `\n\nIndicaciones del consultor para este informe: ${indicaciones}` : ""}\n\nRedacta la introducción, las conclusiones y los próximos pasos.` }],
    });
    if (r.stop_reason === "refusal") return { ok: false, error: "No se ha podido redactar este informe." };
    if (!r.parsed_output) return { ok: false, error: "No se ha podido redactar el informe. Inténtalo de nuevo." };
    return { ok: true, datos: r.parsed_output };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: "La clave de la API de Claude no es válida." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: "Demasiadas peticiones seguidas. Prueba en un minuto." };
    if (e instanceof Anthropic.APIError) return { ok: false, error: `Error del servicio de redacción (${e.status}). Prueba de nuevo.` };
    return { ok: false, error: "No se ha podido conectar con el servicio de redacción." };
  }
}
