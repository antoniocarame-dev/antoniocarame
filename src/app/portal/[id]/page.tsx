import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cabecera } from "@/components/shell";
import { Kpi, EstadoProyecto, EstadoTarea, Puntuacion, Prioridad } from "@/components/piezas";
import { SelectAccion } from "@/components/boton-accion";
import { Comentarios } from "@/components/comentarios";
import { Documentos } from "@/components/documentos";
import { LineaKpi, RadarAreas } from "@/components/graficos";
import { getSesion } from "@/lib/sesion";
import { cargarDocs, comentariosDocs } from "@/lib/docs";
import { estadoTarea, comentar } from "@/app/acciones/plan";
import { AREAS, DAFO, MUDAS, PDCA, diasHasta, estadoKpi, fecha, fechaCorta, mes, valorKpi } from "@/lib/utils";

type Acuerdo = { texto: string; responsable?: string };

export default async function PortalProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSesion();
  const { supabase, user } = s;
  const [{ data: p }, { data: fases }, { data: tareas }, { data: kpis }, { data: auditorias }, { data: hallazgos }, { data: acciones }, { data: actas }, { data: miembros }, { data: coms }, docs, comsDocs] = await Promise.all([
    supabase.from("proyectos").select("*, negocios(nombre)").eq("id", id).maybeSingle(),
    supabase.from("fases").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("tareas").select("*").eq("proyecto_id", id).order("vence", { nullsFirst: false }),
    supabase.from("kpis").select("*, kpi_valores(periodo, valor)").eq("proyecto_id", id),
    supabase.from("auditorias").select("area, fecha, puntuacion").eq("proyecto_id", id).order("fecha"),
    supabase.from("hallazgos").select("*").eq("proyecto_id", id).order("impacto", { ascending: false }),
    supabase.from("acciones").select("*").eq("proyecto_id", id),
    supabase.from("actas").select("*").eq("proyecto_id", id).order("fecha", { ascending: false }),
    supabase.from("proyecto_miembros").select("usuario_id, perfiles(nombre)").eq("proyecto_id", id),
    supabase.from("comentarios").select("*, perfiles(nombre)").eq("proyecto_id", id).eq("entidad", "tarea").order("created_at"),
    cargarDocs(s, { proyecto_id: id }),
    comentariosDocs(s, id),
  ]);
  if (!p) notFound();
  const nombre = (u: string | null) => miembros?.find((m) => m.usuario_id === u)?.perfiles?.nombre ?? "Sin asignar";
  const mias = (tareas ?? []).filter((t) => t.responsable_id === user.id);
  const hechas = (tareas ?? []).filter((t) => t.estado === "hecha").length;
  const porArea = new Map<string, { actual: number; inicial: number }>();
  (auditorias ?? []).filter((a) => a.puntuacion != null).forEach((a) => {
    const prev = porArea.get(a.area); porArea.set(a.area, { inicial: prev?.inicial ?? Number(a.puntuacion), actual: Number(a.puntuacion) });
  });
  const radar = [...porArea].map(([a, v]) => ({ area: AREAS[a as keyof typeof AREAS], ...v }));
  const media = radar.length ? radar.reduce((x, r) => x + r.actual, 0) / radar.length : null;

  return (
    <>
      <Link href="/portal" className="text-sm text-muted-foreground hover:text-foreground">← Mis proyectos</Link>
      <Cabecera eyebrow={p.negocios?.nombre} titulo={p.titulo} sub={<span className="inline-flex items-center gap-2">{fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)} <EstadoProyecto estado={p.estado} /></span>} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Avance" valor={`${tareas?.length ? Math.round((hechas / tareas.length) * 100) : 0} %`} ayuda={`${hechas} de ${tareas?.length ?? 0} tareas hechas`} />
        <Kpi label="Fase" valor={<span className="text-base">{fases?.find((f) => f.estado === "en_curso")?.nombre ?? "—"}</span>} />
        <Kpi label="Tus tareas abiertas" valor={mias.filter((t) => t.estado !== "hecha").length} tono={mias.some((t) => t.estado !== "hecha" && t.vence && diasHasta(t.vence) < 0) ? "bad" : undefined} />
        <Kpi label="Nota del diagnóstico" valor={media == null ? "—" : `${Math.round(media)}/100`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>Tus tareas</CardTitle><span className="text-xs text-muted-foreground">Cambia el estado cuando avances</span></CardHeader>
          <ul className="divide-y">
            {mias.map((t) => {
              const d = t.vence ? diasHasta(t.vence) : null;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className={"font-medium " + (t.estado === "hecha" ? "text-muted-foreground line-through" : "")}>{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.vence ? `Para el ${fecha(t.vence)}` : "Sin fecha"}{t.estado !== "hecha" && d != null && d < 0 ? <span className="text-bad"> · vencida</span> : null}</p>
                  </div>
                  <span className="flex items-center gap-1">
                    <Comentarios titulo={t.titulo} permitirInterno={false}
                      lista={(coms ?? []).filter((c) => c.entidad_id === t.id).map((c) => ({ id: c.id, texto: c.texto, autor: c.perfiles?.nombre ?? "—", fecha: fecha(c.created_at), interno: c.interno }))}
                      accion={async (fd) => { "use server"; return comentar(id, "tarea", t.id, fd); }} />
                    <SelectAccion label="Estado" valor={t.estado} opciones={[["pendiente", "Pendiente"], ["en_curso", "En curso"], ["bloqueada", "Bloqueada"], ["hecha", "Hecha"]]}
                      accion={async (v) => { "use server"; return estadoTarea(id, t.id, v as "pendiente"); }} />
                  </span>
                </li>
              );
            })}
            {!mias.length && <li className="py-2 text-sm text-muted-foreground">No tienes tareas asignadas.</li>}
          </ul>
          <details className="mt-3 border-t pt-3">
            <summary className="cursor-pointer text-sm font-medium">Todas las tareas del proyecto ({tareas?.length ?? 0})</summary>
            <ul className="mt-2 divide-y text-sm">
              {tareas?.filter((t) => t.responsable_id !== user.id).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0">{t.titulo}<span className="block text-xs text-muted-foreground">{nombre(t.responsable_id)}{t.vence ? ` · ${fechaCorta(t.vence)}` : ""}</span></span><EstadoTarea estado={t.estado} /></li>
              ))}
            </ul>
          </details>
        </Card>
        <Card>
          <CardHeader><CardTitle>Diagnóstico por áreas</CardTitle>{media != null && <Puntuacion v={media} />}</CardHeader>
          <RadarAreas datos={radar} />
        </Card>
      </div>

      {!!kpis?.length && (
        <section className="mt-6">
          <h2 className="mb-3 font-mono text-base font-bold">Tus indicadores</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k) => {
              const serie = [...k.kpi_valores].sort((a, b) => a.periodo.localeCompare(b.periodo));
              const ult = serie.at(-1); const e = estadoKpi(ult?.valor, k.objetivo, k.valor_base, k.sentido);
              return (
                <Card key={k.id} className="p-4">
                  <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{k.nombre}</p><p className="text-xs text-muted-foreground">Al empezar {valorKpi(k.valor_base, k.unidad)} · objetivo {valorKpi(k.objetivo, k.unidad)}</p></div>
                    <Badge tono={e === "ok" ? "ok" : e === "warn" ? "warn" : e === "bad" ? "bad" : "neutro"}>{valorKpi(ult?.valor, k.unidad)}</Badge></div>
                  {serie.length > 1 && <LineaKpi datos={serie.map((v) => ({ periodo: mes(v.periodo), valor: Number(v.valor) }))} objetivo={k.objetivo} unidad={k.unidad} alto={140} />}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lo que hemos encontrado</CardTitle></CardHeader>
          <ul className="divide-y text-sm">
            {hallazgos?.filter((h) => h.tipo !== "dafo").map((h) => (
              <li key={h.id} className="py-2.5"><p className="font-medium">{h.titulo}</p><p className="text-xs text-muted-foreground">{h.muda ? MUDAS[h.muda].nombre : "Observación"}{h.area ? ` · ${AREAS[h.area]}` : ""}</p></li>
            ))}
          </ul>
          {hallazgos?.some((h) => h.tipo === "dafo") && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-sm">
              {(["fortaleza", "debilidad", "oportunidad", "amenaza"] as const).map((d) => (
                <div key={d}><p className="eyebrow mb-1">{DAFO[d]}</p><ul>{hallazgos.filter((h) => h.dafo === d).map((h) => <li key={h.id}>· {h.titulo}</li>)}</ul></div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader><CardTitle>Plan de mejora</CardTitle></CardHeader>
          <ul className="divide-y text-sm">
            {acciones?.map((a) => (
              <li key={a.id} className="py-2.5">
                <div className="flex items-start justify-between gap-2"><p className="font-medium">{a.titulo}</p><Badge tono={a.fase_pdca === "actuar" ? "ok" : a.fase_pdca === "verificar" ? "primary" : "neutro"}>{PDCA[a.fase_pdca].nombre}</Badge></div>
                <p className="text-xs text-muted-foreground">{nombre(a.responsable_id)}{a.fecha_objetivo ? ` · ${fechaCorta(a.fecha_objetivo)}` : ""} · <Prioridad p={a.prioridad} /></p>
                {a.resultado && <p className="mt-1 border-l-2 border-ok pl-2 text-[13px] text-muted-foreground">{a.resultado}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-mono text-base font-bold">Documentos</h2>
        <Documentos ambito={{ proyecto_id: id }} docs={docs.docs} carpetas={docs.carpetas} editar={false} esCliente comentarios={comsDocs}
          comentar={async (docId, fd) => { "use server"; return comentar(id, "documento", docId, fd); }} />
      </section>

      {!!actas?.length && (
        <section className="mt-6">
          <h2 className="mb-3 font-mono text-base font-bold">Actas de reunión</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {actas.map((a) => (
              <Card key={a.id}><p className="eyebrow">{fecha(a.fecha)}</p><p className="mt-1 font-semibold">{a.titulo}</p>{a.contenido && <p className="mt-2 whitespace-pre-wrap text-sm">{a.contenido}</p>}
                {Array.isArray(a.acuerdos) && a.acuerdos.length > 0 && <ul className="mt-2 border-t border-dashed pt-2 text-sm">{(a.acuerdos as Acuerdo[]).map((c, i) => <li key={i}>· {c.texto}{c.responsable ? <span className="text-muted-foreground"> · {c.responsable}</span> : null}</li>)}</ul>}
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
