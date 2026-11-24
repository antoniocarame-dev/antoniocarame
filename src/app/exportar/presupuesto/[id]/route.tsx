import { NextResponse, type NextRequest } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { supabaseServidor } from "@/lib/supabase/server";
import { conceptosDe, totalesPresupuesto } from "@/lib/consultora";
import { eur, fecha, numero } from "@/lib/utils";

const C = { ink: "#1c2521", cobre: "#b5651d", cobreTexto: "#8a4a14", gris: "#5b615c", linea: "#e4dcc9" };
const s = StyleSheet.create({
  page: { padding: 42, fontSize: 10, fontFamily: "Helvetica", color: C.ink, lineHeight: 1.4 },
  cab: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 12, marginBottom: 18 },
  sello: { borderWidth: 2, borderColor: C.cobre, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, fontFamily: "Courier-Bold", fontSize: 16, alignSelf: "flex-start", transform: "rotate(-4deg)" },
  eyebrow: { fontFamily: "Courier-Bold", fontSize: 8, letterSpacing: 1.5, color: C.cobreTexto },
  titulo: { fontFamily: "Courier-Bold", fontSize: 17, marginBottom: 8 },
  pequeño: { fontSize: 8.5, color: C.gris },
  fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.linea, paddingVertical: 6 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 4, fontSize: 8, color: C.gris },
  c1: { flex: 1, paddingRight: 8 }, c2: { width: 80, textAlign: "right" }, c3: { width: 70, textAlign: "right" }, c4: { width: 80, textAlign: "right" },
  tot: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  caja: { marginTop: 22, borderWidth: 0.5, borderColor: C.linea, borderRadius: 3, padding: 10 },
  firmas: { flexDirection: "row", gap: 40, marginTop: 40 },
  firma: { flex: 1, borderTopWidth: 0.8, borderTopColor: C.ink, paddingTop: 4, fontSize: 8.5, color: C.gris },
});

/** Presupuesto en PDF real (archivo descargable para adjuntar al correo). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const [{ data: p }, { data: org }, { data: perfil }] = await Promise.all([
    supabase.from("presupuestos").select("*, negocios(nombre, direccion, localidad, contactos(nombre, principal))").eq("id", id).maybeSingle(),
    supabase.from("organizaciones").select("nombre").single(),
    supabase.from("perfiles").select("nombre, email, telefono").eq("id", user.id).single(),
  ]);
  if (!p) return new NextResponse("Presupuesto no encontrado", { status: 404 });
  const conceptos = conceptosDe(p.conceptos);
  const { base, iva, irpf, total } = totalesPresupuesto(p.conceptos, p.iva_pct, p.irpf_pct);
  const contacto = p.negocios?.contactos?.find((c) => c.principal) ?? p.negocios?.contactos?.[0];
  const vence = new Date(p.fecha + "T12:00:00"); vence.setDate(vence.getDate() + p.validez_dias);

  const doc = (
    <Document title={`Presupuesto ${p.numero}`} author={org?.nombre ?? ""}>
      <Page size="A4" style={s.page}>
        <View style={s.cab}>
          <View>
            <Text style={s.sello}>AC</Text>
            <Text style={{ fontFamily: "Courier-Bold", fontSize: 10, marginTop: 8 }}>{org?.nombre}</Text>
            <Text style={s.pequeño}>{[perfil?.nombre, perfil?.telefono, perfil?.email].filter(Boolean).join(" · ")}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.eyebrow}>PRESUPUESTO</Text>
            <Text style={{ fontFamily: "Courier-Bold", fontSize: 15, marginBottom: 3 }}>{p.numero}</Text>
            <Text style={s.pequeño}>{fecha(p.fecha)} · válido hasta el {fecha(vence.toISOString())}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 8 }}>{p.negocios?.nombre}</Text>
            <Text style={s.pequeño}>{[p.negocios?.direccion, p.negocios?.localidad].filter(Boolean).join(", ")}</Text>
            {contacto && <Text style={s.pequeño}>A la atención de {contacto.nombre}</Text>}
          </View>
        </View>
        <Text style={s.titulo}>{p.titulo}</Text>
        {p.introduccion && <Text style={{ marginBottom: 14, fontSize: 10.5 }}>{p.introduccion}</Text>}
        <View style={s.th}><Text style={s.c1}>CONCEPTO</Text><Text style={s.c2}>CANTIDAD</Text><Text style={s.c3}>PRECIO</Text><Text style={s.c4}>IMPORTE</Text></View>
        {conceptos.map((c, i) => (
          <View key={i} style={s.fila} wrap={false}>
            <Text style={s.c1}>{c.descripcion}</Text><Text style={s.c2}>{numero(c.cantidad, 2)} {c.unidad}</Text>
            <Text style={s.c3}>{eur(c.precio, 2)}</Text><Text style={s.c4}>{eur(c.cantidad * c.precio, 2)}</Text>
          </View>
        ))}
        <View style={{ marginTop: 8 }}>
          <View style={s.tot}><Text style={{ width: 160, textAlign: "right" }}>Base imponible</Text><Text style={s.c4}>{eur(base, 2)}</Text></View>
          <View style={s.tot}><Text style={{ width: 160, textAlign: "right" }}>IVA {numero(Number(p.iva_pct), 0)} %</Text><Text style={s.c4}>{eur(iva, 2)}</Text></View>
          {irpf > 0 && <View style={s.tot}><Text style={{ width: 160, textAlign: "right" }}>Retención IRPF {numero(Number(p.irpf_pct), 0)} %</Text><Text style={s.c4}>-{eur(irpf, 2)}</Text></View>}
          <View style={[s.tot, { marginTop: 6 }]}><Text style={{ width: 160, textAlign: "right", fontFamily: "Courier-Bold", fontSize: 12 }}>Total a pagar</Text><Text style={[s.c4, { fontFamily: "Courier-Bold", fontSize: 12 }]}>{eur(total, 2)}</Text></View>
        </View>
        {p.condiciones && <View style={s.caja}><Text style={[s.eyebrow, { marginBottom: 3 }]}>CONDICIONES</Text><Text>{p.condiciones}</Text></View>}
        <View style={s.firmas} wrap={false}>
          <Text style={s.firma}>Por {org?.nombre}</Text>
          <Text style={s.firma}>Conforme, {p.negocios?.nombre}{"\n"}Fecha y firma</Text>
        </View>
      </Page>
    </Document>
  );
  const pdf = await renderToBuffer(doc);
  const nombre = `presupuesto-${p.numero}-${p.negocios?.nombre ?? ""}`.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase();
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nombre}.pdf"`, "Cache-Control": "no-store" } });
}
