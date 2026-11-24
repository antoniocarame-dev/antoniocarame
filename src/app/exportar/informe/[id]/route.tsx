import { NextResponse, type NextRequest } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { supabaseServidor } from "@/lib/supabase/server";
import { cargarInforme, TITULO_TIPO, type DatosInforme } from "@/lib/informe-datos";
import { KPIS_SECTOR } from "@/lib/resultados";
import { DAFO, MUDAS, PDCA, eur, fecha, mes, numero, valorKpi } from "@/lib/utils";

export const maxDuration = 60;

const C = { ink: "#1c2521", cobre: "#b5651d", cobreTexto: "#8a4a14", gris: "#5b615c", linea: "#e4dcc9", ok: "#2f6f45", mal: "#a3322b", ambar: "#8c5a0b", fondo: "#f6f2ea" };
const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 54, paddingHorizontal: 44, fontSize: 10, fontFamily: "Helvetica", color: C.ink },
  // Interlineado solo en los párrafos: en la página rompe el número de página de react-pdf
  cuerpo: {},
  portada: { borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 14, marginBottom: 16, flexDirection: "row", justifyContent: "space-between" },
  sello: { borderWidth: 2, borderColor: C.cobre, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, fontFamily: "Courier-Bold", fontSize: 18, transform: "rotate(-4deg)" },
  eyebrow: { fontFamily: "Courier-Bold", fontSize: 8, letterSpacing: 1.5, color: C.cobreTexto },
  titulo: { fontFamily: "Courier-Bold", fontSize: 19, lineHeight: "24pt", marginTop: 6, marginBottom: 8, maxWidth: 400 },
  pequeño: { fontSize: 8.5, color: C.gris },
  h2: { flexDirection: "row", gap: 8, borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 3, marginTop: 18, marginBottom: 8 },
  h2n: { fontFamily: "Courier-Bold", fontSize: 12, color: C.cobre },
  h2t: { fontFamily: "Courier-Bold", fontSize: 12 },
  p: { marginBottom: 6, lineHeight: "14pt" },
  b: { fontFamily: "Helvetica-Bold" },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 3, fontSize: 7.5, color: C.gris },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.linea, paddingVertical: 4 },
  caja: { flex: 1, borderWidth: 0.5, borderColor: C.linea, borderRadius: 3, padding: 7 },
  etiqueta: { fontSize: 7, color: C.gris, letterSpacing: 0.8 },
  cifra: { fontFamily: "Courier-Bold", fontSize: 13 },
  pie: { position: "absolute", bottom: 24, left: 44, right: 44, fontSize: 7.5, color: C.gris, borderTopWidth: 0.5, borderTopColor: C.gris, paddingTop: 4 },
});
const colorNota = (v: number) => (v >= 75 ? C.ok : v >= 50 ? C.ambar : C.mal);

/** Informe para el cliente en PDF real (archivo descargable para adjuntar al correo). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const [d, { data: perfil }] = await Promise.all([
    cargarInforme(supabase, id),
    supabase.from("perfiles").select("nombre, email, telefono").eq("id", user.id).single(),
  ]);
  if (!d) return new NextResponse("Informe no encontrado", { status: 404 });
  const { inf, p, neg, sec, costes } = d;
  let n = 0;
  const H2 = ({ children }: { children: string }) => <View style={s.h2}><Text style={s.h2n}>{String(++n).padStart(2, "0")}</Text><Text style={s.h2t}>{children}</Text></View>;
  /** Título de sección pegado a lo primero que sigue, para que no se quede solo al pie de una página. */
  const Cabeza = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => <View wrap={false}><H2>{titulo}</H2>{children}</View>;
  const pie = [d.org?.nombre, perfil?.nombre, perfil?.telefono, perfil?.email].filter(Boolean).join(" · ");
  const noDafo = d.hallazgos.filter((h) => h.tipo !== "dafo");
  const conDafo = d.hallazgos.filter((h) => h.tipo === "dafo");

  const doc = (
    <Document title={inf.titulo} author={d.org?.nombre ?? ""} subject={`${neg.nombre} · ${p.titulo}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.pie} fixed render={({ pageNumber, totalPages }) => `${pie}      ·      Página ${pageNumber} de ${totalPages}`} />
        <View style={s.cuerpo}>
        <View style={s.portada}>
          <View>
            <Text style={s.eyebrow}>{TITULO_TIPO[inf.tipo].toUpperCase()}</Text>
            <Text style={s.titulo}>{inf.titulo}</Text>
            <Text style={{ fontSize: 11 }}>{neg.nombre} · {p.titulo}</Text>
            <Text style={s.pequeño}>Periodo: {fecha(inf.periodo_desde)} – {fecha(inf.periodo_hasta)} · Emitido el {fecha(new Date().toISOString())}</Text>
          </View>
          <View><Text style={s.sello}>AC</Text></View>
        </View>

        {inf.introduccion && <Text style={[s.p, { fontSize: 11, lineHeight: "15.5pt" }]}>{inf.introduccion}</Text>}

        {sec.has("resumen") && (
          <View wrap={false}>
            <H2>Situación del proyecto</H2>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={s.caja}><Text style={s.etiqueta}>FASE ACTUAL</Text><Text style={s.cifra}>{d.faseActual ?? "—"}</Text></View>
              <View style={s.caja}><Text style={s.etiqueta}>AVANCE DE TAREAS</Text><Text style={s.cifra}>{d.tareas.length ? Math.round((d.hechas / d.tareas.length) * 100) : 0} %</Text></View>
              <View style={s.caja}><Text style={s.etiqueta}>ENTREGA PREVISTA</Text><Text style={s.cifra}>{fecha(p.fecha_fin)}</Text></View>
            </View>
            {p.objetivos && <Text style={[s.p, { marginTop: 8 }]}><Text style={s.b}>Objetivos: </Text>{p.objetivos}</Text>}
          </View>
        )}

        {sec.has("kpis") && d.kpis.length > 0 && (
          <View>
            <Cabeza titulo="Indicadores"><View style={s.th}><Text style={{ flex: 1 }}>INDICADOR</Text><Text style={{ width: 75, textAlign: "right" }}>AL EMPEZAR</Text><Text style={{ width: 75, textAlign: "right" }}>AHORA</Text><Text style={{ width: 75, textAlign: "right" }}>OBJETIVO</Text></View></Cabeza>
            {d.kpis.map((k) => (
              <View key={k.id} style={s.tr} wrap={false}>
                <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>{k.nombre}</Text>
                <Text style={{ width: 75, textAlign: "right", color: C.gris }}>{valorKpi(k.valor_base, k.unidad)}</Text>
                <Text style={{ width: 75, textAlign: "right", fontFamily: "Helvetica-Bold", color: k.estado === "ok" ? C.ok : k.estado === "bad" ? C.mal : C.ink }}>{valorKpi(k.ultimo, k.unidad)}</Text>
                <Text style={{ width: 75, textAlign: "right" }}>{valorKpi(k.objetivo, k.unidad)}</Text>
              </View>
            ))}
          </View>
        )}

        {sec.has("resultados") && (d.enPeriodo.length > 0 || (d.A1 && d.D1)) && (
          <View>
            {d.enPeriodo.length > 0 && (
              <View style={{ marginBottom: 10 }} wrap={false}>
                <H2>Resultados</H2>
                <View style={s.th}><Text style={{ flex: 1 }}>€ SIN IVA</Text>{d.enPeriodo.map((m) => <Text key={m.periodo} style={{ width: 62, textAlign: "right" }}>{mes(m.periodo).toUpperCase()}</Text>)}</View>
                {([["Ventas", (m) => m.ventas], ["Materia prima", (m) => m.costeMp], ["Personal", (m) => m.personal], ["EBITDA", (m) => m.ebitda]] as [string, (m: DatosInforme["enPeriodo"][number]) => number | null][]).map(([l, f]) => (
                  <View key={l} style={s.tr}><Text style={{ flex: 1, fontFamily: l === "EBITDA" ? "Helvetica-Bold" : "Helvetica" }}>{l}</Text>{d.enPeriodo.map((m) => <Text key={m.periodo} style={{ width: 62, textAlign: "right", fontFamily: l === "EBITDA" ? "Helvetica-Bold" : "Helvetica" }}>{f(m) != null ? eur(f(m)) : "—"}</Text>)}</View>
                ))}
                <View style={s.tr}><Text style={{ flex: 1, color: C.gris }}>Food cost</Text>{d.enPeriodo.map((m) => <Text key={m.periodo} style={{ width: 62, textAlign: "right", color: C.gris }}>{m.kpi.food_cost != null ? `${numero(m.kpi.food_cost * 100, 1)} %` : "—"}</Text>)}</View>
              </View>
            )}
            {d.A1 && d.D1 && (
              <View wrap={false}>
                {d.enPeriodo.length === 0 && <H2>Resultados</H2>}
                <Text style={[s.b, { marginBottom: 4 }]}>Antes y después del proyecto</Text>
                <View style={s.th}><Text style={{ flex: 1 }}>INDICADOR</Text><Text style={{ width: 75, textAlign: "right" }}>ANTES</Text><Text style={{ width: 75, textAlign: "right" }}>DESPUÉS</Text><Text style={{ width: 75, textAlign: "right" }}>CAMBIO</Text></View>
                {KPIS_SECTOR.filter((k) => ["food_cost", "labour_cost", "prime_cost", "ebitda_pct", "ticket_medio"].includes(k.codigo)).map((k) => {
                  const a = d.A1!.kpi[k.codigo], b = d.D1!.kpi[k.codigo];
                  const f = (v: number | null) => (v == null ? "—" : k.unidad === "%" ? `${numero(v * 100, 1)} %` : eur(v, 2));
                  const dif = a != null && b != null ? b - a : null; const bien = dif != null && (k.bajar ? dif < 0 : dif > 0);
                  return (
                    <View key={k.codigo} style={s.tr}><Text style={{ flex: 1 }}>{k.nombre}</Text><Text style={{ width: 75, textAlign: "right", color: C.gris }}>{f(a)}</Text><Text style={{ width: 75, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{f(b)}</Text>
                      <Text style={{ width: 75, textAlign: "right", color: bien ? C.ok : C.mal }}>{dif == null ? "—" : k.unidad === "%" ? `${dif > 0 ? "+" : ""}${numero(dif * 100, 1)} pt` : `${dif > 0 ? "+" : ""}${eur(dif, 2)}`}</Text></View>
                  );
                })}
                <Text style={{ marginTop: 6 }}>EBITDA medio mensual: <Text style={s.b}>{eur(d.A1.ebitdaMes)}</Text> antes y <Text style={s.b}>{eur(d.D1.ebitdaMes)}</Text> ahora.</Text>
              </View>
            )}
          </View>
        )}

        {sec.has("diagnostico") && (
          <View>
            {d.radar.length === 0 && <H2>Diagnóstico</H2>}
            {d.radar.length > 0 && (
              <View style={{ marginBottom: 8 }} wrap={false}>
                <H2>Diagnóstico</H2>
                <Text style={[s.pequeño, { marginBottom: 4 }]}>Puntuación sobre 100 por área (primera auditoría y última)</Text>
                {d.radar.map((r) => (
                  <View key={r.area} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <Text style={{ width: 110, fontSize: 9 }}>{r.area}</Text>
                    <View style={{ flex: 1, height: 9, backgroundColor: C.fondo, borderRadius: 2 }}>
                      <View style={{ position: "absolute", left: 0, top: 0, height: 9, width: `${Math.max(2, r.actual)}%`, backgroundColor: colorNota(r.actual), borderRadius: 2 }} />
                      <View style={{ position: "absolute", top: -1, height: 11, width: 1.5, left: `${r.inicial}%`, backgroundColor: C.ink }} />
                    </View>
                    <Text style={{ width: 52, textAlign: "right", fontFamily: "Courier-Bold", fontSize: 9 }}>{Math.round(r.inicial) !== Math.round(r.actual) ? `${Math.round(r.inicial)}>` : ""}{Math.round(r.actual)}</Text>
                  </View>
                ))}
                <Text style={s.pequeño}>La raya negra marca la primera auditoría.</Text>
              </View>
            )}
            {noDafo.length > 0 && (
              <View>
                <Text style={[s.b, { marginTop: 4, marginBottom: 4 }]}>Principales hallazgos y necesidades</Text>
                {noDafo.slice(0, 10).map((h) => (
                  <View key={h.id} style={{ flexDirection: "row", gap: 6, marginBottom: 4 }} wrap={false}>
                    <Text style={{ width: 92, fontFamily: "Courier-Bold", fontSize: 7.5, color: C.cobreTexto }}>{(h.muda ? MUDAS[h.muda].nombre : "Observación").toUpperCase()}</Text>
                    <Text style={{ flex: 1 }}><Text style={s.b}>{h.titulo}. </Text>{h.descripcion ?? ""}{h.coste_estimado ? ` (aprox. ${eur(Number(h.coste_estimado))}/mes)` : ""}</Text>
                  </View>
                ))}
              </View>
            )}
            {conDafo.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }} wrap={false}>
                {(["fortaleza", "debilidad", "oportunidad", "amenaza"] as const).map((x) => (
                  <View key={x} style={[s.caja, { flexBasis: "48%" }]}><Text style={[s.etiqueta, { fontFamily: "Courier-Bold" }]}>{DAFO[x].toUpperCase()}</Text>
                    {conDafo.filter((h) => h.dafo === x).map((h) => <Text key={h.id} style={{ fontSize: 9 }}>· {h.titulo}</Text>)}</View>
                ))}
              </View>
            )}
          </View>
        )}

        {sec.has("costes") && costes && (
          <View>
            <Cabeza titulo="Costes y escandallos"><Text style={s.p}>{costes.platos} platos escandallados. Food cost objetivo: {numero(costes.objetivo * 100, 0)} %. {costes.sobre.length ? `${costes.sobre.length} por encima del objetivo:` : "Todos dentro del objetivo."}</Text></Cabeza>
            {costes.sobre.length > 0 && (
              <View>
                <View style={s.th}><Text style={{ flex: 1 }}>PLATO</Text><Text style={{ width: 60, textAlign: "right" }}>COSTE</Text><Text style={{ width: 60, textAlign: "right" }}>PVP</Text><Text style={{ width: 60, textAlign: "right" }}>FOOD COST</Text><Text style={{ width: 80, textAlign: "right" }}>PVP RECOMENDADO</Text></View>
                {costes.sobre.map((e) => (
                  <View key={e.id} style={s.tr} wrap={false}><Text style={{ flex: 1 }}>{e.nombre}</Text><Text style={{ width: 60, textAlign: "right" }}>{eur(e.coste, 2)}</Text><Text style={{ width: 60, textAlign: "right" }}>{eur(e.pvp, 2)}</Text>
                    <Text style={{ width: 60, textAlign: "right", fontFamily: "Helvetica-Bold", color: C.mal }}>{numero(e.foodCost * 100, 1)} %</Text><Text style={{ width: 80, textAlign: "right" }}>{eur(e.pvpRecomendado, 2)}</Text></View>
                ))}
              </View>
            )}
            {costes.subidas.length > 0 && <Text style={{ marginTop: 6 }}><Text style={s.b}>Subidas de precio relevantes: </Text>{costes.subidas.map((x) => `${x.nombre} (+${numero(x.variacion, 1)} %)`).join(", ")}.</Text>}
          </View>
        )}

        {sec.has("acciones") && d.acciones.length > 0 && (
          <View>
            <Cabeza titulo="Plan de mejora"><View style={s.th}><Text style={{ flex: 1 }}>ACCIÓN</Text><Text style={{ width: 70 }}>FASE</Text><Text style={{ width: 95 }}>RESPONSABLE</Text><Text style={{ width: 55, textAlign: "right" }}>FECHA</Text></View></Cabeza>
            {d.acciones.map((a) => (
              <View key={a.id} style={s.tr} wrap={false}>
                <View style={{ flex: 1, paddingRight: 6 }}><Text style={s.b}>{a.titulo}</Text>{a.resultado && <Text style={{ color: C.gris, fontSize: 9 }}>{a.resultado}</Text>}</View>
                <Text style={{ width: 70 }}>{PDCA[a.fase_pdca].nombre}</Text>
                <Text style={{ width: 95 }}>{a.responsable_externo ?? (a.responsable_id ? perfil?.nombre ?? "—" : "—")}</Text>
                <Text style={{ width: 55, textAlign: "right" }}>{fecha(a.fecha_objetivo, { day: "numeric", month: "short" })}</Text>
              </View>
            ))}
          </View>
        )}

        {sec.has("estandares") && (d.estandares.length > 0 || d.formaciones.length > 0) && (
          <View wrap={d.estandares.length > 12}>
            <H2>Estándares y formación</H2>
            {d.estandares.map((e) => <Text key={e.id}>· <Text style={s.b}>{e.titulo}</Text> (v{e.version}) — {{ borrador: "en preparación", en_prueba: "en prueba", implantado: `implantado${e.fecha_implantacion ? " el " + fecha(e.fecha_implantacion) : ""}` }[e.estado]}{e.responsable_externo ? ` · responsable: ${e.responsable_externo}` : ""}</Text>)}
            {d.formaciones.length > 0 && <Text style={{ marginTop: 6 }}>Formaciones del periodo: {d.formaciones.map((f) => { const as = f.asistentes as { asistio: boolean }[]; return `${f.titulo} (${fecha(f.fecha, { day: "numeric", month: "short" })}, ${numero(Number(f.duracion_h), 1)} h, ${as.filter((a) => a.asistio).length}/${as.length} asistentes)`; }).join("; ")}.</Text>}
          </View>
        )}

        {sec.has("tareas_cliente") && d.pendCliente.length > 0 && (
          <View wrap={false}>
            <H2>Pendiente por vuestra parte</H2>
            {d.pendCliente.map((t) => (
              <View key={t.id} style={s.tr} wrap={false}><Text style={{ flex: 1 }}>[  ] {t.titulo}</Text><Text style={{ color: C.gris }}>{t.responsable_externo}{t.vence ? ` · ${fecha(t.vence, { day: "numeric", month: "short" })}` : ""}</Text></View>
            ))}
          </View>
        )}

        {sec.has("actas") && d.actas.length > 0 && (
          <View>
            {d.actas.map((a, i) => (
              <View key={a.id} style={{ marginBottom: 6 }} wrap={false}>
                {i === 0 && <H2>Reuniones del periodo</H2>}
                <Text style={s.b}>{fecha(a.fecha)} · {a.titulo}</Text>
                {a.contenido && <Text style={s.p}>{a.contenido}</Text>}
                {Array.isArray(a.acuerdos) && (a.acuerdos as { texto: string; responsable?: string }[]).map((c, i) => <Text key={i} style={{ fontSize: 9 }}>· {c.texto}{c.responsable ? ` (${c.responsable})` : ""}</Text>)}
              </View>
            ))}
          </View>
        )}

        {(inf.conclusiones || inf.proximos_pasos) && (
          <View>
            <View wrap={false}><H2>Conclusiones y próximos pasos</H2>{inf.conclusiones && <Text style={s.p}>{inf.conclusiones}</Text>}</View>
            {inf.proximos_pasos && <View wrap={false}><Text style={[s.b, { marginTop: 4, marginBottom: 2 }]}>Próximos pasos</Text><Text style={s.p}>{inf.proximos_pasos}</Text></View>}
          </View>
        )}

        </View>
      </Page>
    </Document>
  );
  const pdf = await renderToBuffer(doc);
  const nombre = `informe-${neg.nombre}-${inf.titulo}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+$/, "").toLowerCase().slice(0, 90);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${req.nextUrl.searchParams.has("ver") ? "inline" : "attachment"}; filename="${nombre}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
