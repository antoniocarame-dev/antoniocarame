import Link from "next/link";
import { ArrowRight, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Puntuacion } from "@/components/piezas";
import { Vacio } from "@/components/ui/vacio";
import { RadarAreas, MatrizPrioridades } from "@/components/graficos";
import { HallazgoDialogo } from "@/components/diagnostico/hallazgo-dialogo";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import * as A from "@/app/acciones/diagnostico";
import { AREAS, DAFO, MUDAS, eur, fecha, hoyISO, type Tabla } from "@/lib/utils";

export default async function Diagnostico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const [{ data: auditorias }, { data: hallazgos }, { data: plantillas }, { data: perfiles }] = await Promise.all([
    supabase.from("auditorias").select("*").eq("proyecto_id", id).order("fecha", { ascending: false }),
    supabase.from("hallazgos").select("*").eq("proyecto_id", id).order("impacto", { ascending: false }),
    editar ? supabase.from("plantillas").select("id, nombre, area").eq("activa", true).eq("tipo", "auditoria").order("nombre") : Promise.resolve({ data: [] as { id: string; nombre: string; area: null }[] }),
    supabase.from("perfiles").select("id, nombre"),
  ]);
  const fotos = [...new Set((hallazgos ?? []).flatMap((h) => h.fotos))];
  const { data: firmadas } = fotos.length ? await supabase.storage.from("documentos").createSignedUrls(fotos, 3600) : { data: [] };
  const urls: Record<string, string> = Object.fromEntries((firmadas ?? []).flatMap((f) => (f.signedUrl && f.path ? [[f.path, f.signedUrl]] : [])));

  // Radar: última y primera puntuación por área
  const porArea = new Map<string, { actual: number; inicial: number }>();
  [...(auditorias ?? [])].filter((a) => a.puntuacion != null).sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((a) => {
    const prev = porArea.get(a.area);
    porArea.set(a.area, { inicial: prev?.inicial ?? Number(a.puntuacion), actual: Number(a.puntuacion) });
  });
  const radar = [...porArea].map(([area, v]) => ({ area: AREAS[area as keyof typeof AREAS], ...v }));
  const media = radar.length ? radar.reduce((s, r) => s + r.actual, 0) / radar.length : null;
  const mudas = (hallazgos ?? []).filter((h) => h.tipo === "muda");
  const costeMudas = mudas.reduce((s, h) => s + Number(h.coste_estimado ?? 0), 0);
  const nombre = (pid: string | null) => perfiles?.find((p) => p.id === pid)?.nombre ?? "—";

  const tarjetaHallazgo = (h: Tabla<"hallazgos">) => (
    <li key={h.id} className="rounded-sm border bg-card p-2.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        {editar ? (
          <HallazgoDialogo proyectoId={id} hallazgo={h} titulo="Editar hallazgo" fotosUrls={urls}
            trigger={<button className="text-left font-medium leading-snug hover:text-primary-ink">{h.titulo}</button>} />
        ) : <span className="font-medium leading-snug">{h.titulo}</span>}
        <span className="flex shrink-0 gap-1"><Badge tono={h.impacto >= 4 ? "bad" : h.impacto >= 3 ? "warn" : "neutro"}>I{h.impacto}</Badge><Badge>E{h.esfuerzo}</Badge></span>
      </div>
      {h.descripcion && <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground">{h.descripcion}</p>}
      {h.fotos.length > 0 && <div className="mt-2 flex gap-1.5">{h.fotos.slice(0, 4).map((f) => urls[f] && <img key={f} src={urls[f]} alt="" className="size-12 rounded-sm object-cover" />)}</div>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{h.area ? AREAS[h.area] : ""}{h.coste_estimado ? ` · ${eur(Number(h.coste_estimado))}/mes` : ""}{!h.visible_cliente ? " · interno" : ""}</span>
        {editar && (
          <span className="flex gap-1">
            <BotonAccion size="sm" variant="ghost" title="Crear acción de mejora" accion={async () => { "use server"; return A.hallazgoAAccion(id, h.id); }}>Acción<ArrowRight /></BotonAccion>
            <BotonAccion size="icon" variant="ghost" confirmar="¿Borrar?" title="Borrar" accion={async () => { "use server"; return A.borrarHallazgo(id, h.id); }}><Trash2 /></BotonAccion>
          </span>
        )}
      </div>
    </li>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader><CardTitle>Puntuación por áreas</CardTitle>{media != null && <Puntuacion v={media} />}</CardHeader>
          <RadarAreas datos={radar} />
          <p className="text-xs text-muted-foreground">Escala de 0 a 100. La línea discontinua es la primera auditoría de cada área.</p>
        </Card>
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <CardTitle>Auditorías</CardTitle>
            {editar && (
              <DialogoForm titulo="Nueva auditoría" descripcion="Se copia la plantilla tal cual está hoy, para que cambios futuros no alteren auditorías pasadas."
                trigger={<Button size="sm"><Plus />Nueva auditoría</Button>} boton="Empezar"
                action={async (fd) => { "use server"; return A.crearAuditoria(id, fd); }}>
                <Campo label="Plantilla" className="sm:col-span-2"><Select name="plantilla_id" required vacio="Elige plantilla" opciones={(plantillas ?? []).map((p) => [p.id, p.nombre])} /></Campo>
                <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
                <Campo label="Título (opcional)"><Input name="titulo" placeholder="Ej. Cocina · servicio de cena" /></Campo>
              </DialogoForm>
            )}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Auditoría</th><th className="px-2">Fecha</th><th className="px-2">Auditor</th><th className="px-2">Estado</th><th className="px-5 text-right">Nota</th></tr></thead>
              <tbody>
                {auditorias?.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/60">
                    <td className="px-5 py-2.5"><Link className="font-medium hover:text-primary-ink" href={`/proyectos/${id}/diagnostico/${a.id}`}>{a.titulo}</Link><p className="text-xs text-muted-foreground">{AREAS[a.area]}</p></td>
                    <td className="tnum whitespace-nowrap px-2">{fecha(a.fecha)}</td>
                    <td className="px-2">{nombre(a.auditor_id)}</td>
                    <td className="px-2"><Badge tono={a.estado === "completada" ? "ok" : "warn"}>{a.estado === "completada" ? "Completada" : "En curso"}</Badge></td>
                    <td className="px-5 text-right"><Puntuacion v={a.puntuacion == null ? null : Number(a.puntuacion)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditorias?.length && <div className="p-5"><Vacio titulo="Sin auditorías"><ClipboardCheck className="mx-auto mb-2 size-5" />Empieza por cocina y compras: es donde más margen se pierde.</Vacio></div>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Despilfarros · 7 mudas</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">{mudas.length} detectados{costeMudas ? ` · ${eur(costeMudas)}/mes estimados` : ""}</p>
          </div>
          {editar && <HallazgoDialogo proyectoId={id} trigger={<Button size="sm"><Plus />Registrar hallazgo</Button>} />}
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(MUDAS) as (keyof typeof MUDAS)[]).map((m) => {
            const lista = mudas.filter((h) => h.muda === m);
            return (
              <section key={m} className="rounded-md bg-muted/70 p-2.5">
                <h3 className="flex justify-between font-mono text-[11px] font-bold uppercase tracking-widest"><span>{MUDAS[m].nombre}</span><span className="text-muted-foreground">{lista.length}</span></h3>
                <p className="mb-2 text-xs text-muted-foreground">{MUDAS[m].ejemplo}</p>
                <ul className="grid gap-2">{lista.map(tarjetaHallazgo)}</ul>
              </section>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>DAFO</CardTitle></CardHeader>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(["fortaleza", "debilidad", "oportunidad", "amenaza"] as const).map((d) => (
              <section key={d} className={"rounded-md p-2.5 " + (d === "fortaleza" || d === "oportunidad" ? "bg-ok-soft/60" : "bg-bad-soft/60")}>
                <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest">{DAFO[d]}</h3>
                <ul className="grid gap-2">{(hallazgos ?? []).filter((h) => h.dafo === d).map(tarjetaHallazgo)}</ul>
              </section>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Matriz de prioridades</CardTitle><span className="text-xs text-muted-foreground">Impacto frente a esfuerzo</span></CardHeader>
          <MatrizPrioridades puntos={(hallazgos ?? []).filter((h) => h.tipo !== "dafo" || h.dafo === "debilidad").map((h) => ({ id: h.id, titulo: h.titulo, impacto: h.impacto, esfuerzo: h.esfuerzo }))} />
          <p className="eyebrow mb-1 mt-3">Victorias rápidas</p>
          <ul className="text-sm">
            {(hallazgos ?? []).filter((h) => h.impacto >= 4 && h.esfuerzo <= 2 && (h.tipo !== "dafo" || h.dafo === "debilidad")).map((h) => <li key={h.id} className="py-0.5">· {h.titulo}</li>)}
          </ul>
        </Card>
      </div>

      {(hallazgos ?? []).some((h) => h.tipo === "observacion") && (
        <Card><CardHeader><CardTitle>Observaciones</CardTitle></CardHeader>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(hallazgos ?? []).filter((h) => h.tipo === "observacion").map(tarjetaHallazgo)}</ul>
        </Card>
      )}
    </div>
  );
}
