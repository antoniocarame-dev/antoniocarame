import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Kpi } from "@/components/piezas";
import { SubPestanas } from "@/components/subpestanas";
import { Vacio } from "@/components/ui/vacio";
import { getSesion } from "@/lib/sesion";
import * as A from "@/app/acciones/estandares";
import { AREAS, contenidoAuditoria, fecha, hoyISO, numero, type Tabla } from "@/lib/utils";

const TIPO = { sop: "Procedimiento", checklist: "Checklist", ficha: "Ficha", manual: "Manual" } as const;
const ESTADO = { borrador: ["Borrador", "neutro"], en_prueba: ["En prueba", "warn"], implantado: ["Implantado", "ok"] } as const;
type Asistente = { nombre: string; puesto?: string; asistio: boolean };

export default async function Estandares({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const { v = "estandares" } = await searchParams;
  const { supabase, perfil } = await getSesion();
  const [{ data: estandares }, { data: formaciones }, { data: plantillas }] = await Promise.all([
    supabase.from("estandares").select("*").eq("proyecto_id", id).order("tipo").order("titulo"),
    supabase.from("formaciones").select("*").eq("proyecto_id", id).order("fecha", { ascending: false }),
    supabase.from("plantillas").select("id, nombre, tipo").in("tipo", ["sop", "checklist"]).eq("activa", true).order("nombre"),
  ]);
  const base = `/proyectos/${id}/estandares`;
  const implantados = (estandares ?? []).filter((e) => e.estado === "implantado").length;
  const horas = (formaciones ?? []).reduce((s, f) => s + Number(f.duracion_h), 0);
  const asist = (formaciones ?? []).flatMap((f) => f.asistentes as Asistente[]);
  const personas = new Set(asist.filter((a) => a.asistio).map((a) => a.nombre)).size;

  const camposFormacion = (f?: Tabla<"formaciones">) => (
    <>
      <Campo label="Formación" className="sm:col-span-2"><Input name="titulo" required defaultValue={f?.titulo} /></Campo>
      <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={f?.fecha ?? hoyISO()} /></Campo>
      <Campo label="Duración (horas)"><Input name="duracion_h" type="number" step="0.25" min="0.25" defaultValue={f?.duracion_h ?? 1} /></Campo>
      <Campo label="Formador"><Input name="formador" defaultValue={f?.formador ?? perfil.nombre} /></Campo>
      <Campo label="Estándar que se forma"><Select name="estandar_id" defaultValue={f?.estandar_id ?? ""} vacio="Ninguno" opciones={(estandares ?? []).map((e) => [e.id, e.titulo])} /></Campo>
      <Campo label="Asistentes" className="sm:col-span-2" ayuda="Uno por línea: «Nombre | Puesto». Añade «| no» si faltó.">
        <Textarea name="asistentes" className="min-h-28" defaultValue={((f?.asistentes ?? []) as Asistente[]).map((a) => `${a.nombre} | ${a.puesto ?? ""}${a.asistio ? "" : " | no"}`).join("\n")} placeholder={"Rocío Gil | Jefa de cocina\nPaco Mena | Ayudante | no"} />
      </Campo>
      <Campo label="Contenido" className="sm:col-span-2"><Textarea name="contenido" defaultValue={f?.contenido ?? ""} /></Campo>
      <Campo label="Valoración del equipo (0-10)"><Input name="valoracion" type="number" step="0.5" min="0" max="10" defaultValue={f?.valoracion ?? ""} /></Campo>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="visible_cliente" defaultChecked={f?.visible_cliente ?? true} className="size-4" />Incluir en los informes</label>
    </>
  );

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Estándares" valor={estandares?.length ?? 0} ayuda={`${implantados} implantados`} />
        <Kpi label="En prueba" valor={(estandares ?? []).filter((e) => e.estado === "en_prueba").length} ayuda="pendientes de verificar" />
        <Kpi label="Horas de formación" valor={numero(horas, 1)} ayuda={`${formaciones?.length ?? 0} sesiones`} />
        <Kpi label="Personas formadas" valor={personas} ayuda={asist.length ? `${numero((asist.filter((a) => a.asistio).length / asist.length) * 100, 0)} % de asistencia` : undefined} />
      </div>
      <SubPestanas base={base} actual={v} items={[["estandares", "Procedimientos y checklists"], ["formacion", "Formación"]]} />

      {v === "estandares" && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <DialogoForm titulo="Nuevo estándar" descripcion="Parte de una plantilla de tu biblioteca y adáptala a este local, o empieza en blanco." trigger={<Button size="sm"><Plus />Estándar</Button>}
              action={async (fd) => { "use server"; return A.crearEstandar(id, fd); }} boton="Crear">
              <Campo label="Desde plantilla" className="sm:col-span-2"><Select name="plantilla_id" vacio="En blanco" opciones={(plantillas ?? []).map((p) => [p.id, `${p.tipo === "sop" ? "SOP" : "Checklist"} · ${p.nombre}`])} /></Campo>
              <Campo label="Título" ayuda="Si lo dejas vacío, el de la plantilla"><Input name="titulo" /></Campo>
              <Campo label="Tipo (si es en blanco)"><Select name="tipo" opciones={Object.entries(TIPO)} /></Campo>
            </DialogoForm>
          </div>
          {estandares?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estandares.map((e) => {
                const c = contenidoAuditoria(e.contenido);
                const est = ESTADO[e.estado];
                const formados = (formaciones ?? []).filter((f) => f.estandar_id === e.id);
                return (
                  <Link key={e.id} href={`${base}/${e.id}`} className="rounded-md border bg-card p-4 hover:border-primary">
                    <div className="flex items-center justify-between gap-2"><span className="eyebrow">{TIPO[e.tipo]}{e.area ? ` · ${AREAS[e.area]}` : ""}</span><Badge tono={est[1]}>{est[0]}</Badge></div>
                    <h3 className="mt-1.5 font-semibold">{e.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">v{e.version} · {c.secciones.reduce((s, x) => s + x.items.length, 0)} {e.tipo === "sop" ? "pasos" : "puntos"}{e.responsable_externo ? ` · ${e.responsable_externo}` : ""}</p>
                    <p className="mt-2 border-t border-dashed pt-2 text-xs text-muted-foreground">{e.fecha_implantacion ? `Implantado el ${fecha(e.fecha_implantacion)}` : "Sin implantar"} · {formados.length ? `${formados.length} formación${formados.length > 1 ? "es" : ""}` : "sin formación"}</p>
                  </Link>
                );
              })}
            </div>
          ) : <Vacio titulo="Sin estándares">Escribe cómo se hacen las cosas: lo que funciona en la prueba se implanta y se forma al equipo.</Vacio>}
        </div>
      )}

      {v === "formacion" && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <DialogoForm titulo="Registrar formación" ancho="max-w-2xl" trigger={<Button size="sm"><Plus />Formación</Button>} action={async (fd) => { "use server"; return A.guardarFormacion(id, null, fd); }}>{camposFormacion()}</DialogoForm>
          </div>
          {formaciones?.length ? formaciones.map((f) => {
            const as = f.asistentes as Asistente[];
            const est = estandares?.find((e) => e.id === f.estandar_id);
            return (
              <Card key={f.id}>
                <CardHeader>
                  <div><p className="eyebrow">{fecha(f.fecha)} · {numero(Number(f.duracion_h), 2)} h{f.formador ? ` · ${f.formador}` : ""}</p><CardTitle className="mt-1">{f.titulo}</CardTitle>{est && <p className="text-xs text-muted-foreground">Estándar: {est.titulo}</p>}</div>
                  <span className="flex items-center gap-1">
                    {f.valoracion != null && <Badge tono={Number(f.valoracion) >= 8 ? "ok" : "warn"}>{numero(Number(f.valoracion), 1)}/10</Badge>}
                    <DialogoForm titulo="Editar formación" ancho="max-w-2xl" trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button>} action={async (fd) => { "use server"; return A.guardarFormacion(id, f.id, fd); }}>{camposFormacion(f)}</DialogoForm>
                    <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar" accion={async () => { "use server"; return A.borrarFormacion(id, f.id); }}><Trash2 /></BotonAccion>
                  </span>
                </CardHeader>
                {f.contenido && <p className="mb-3 text-sm">{f.contenido}</p>}
                <ul className="flex flex-wrap gap-1.5">{as.map((a, i) => <li key={i}><Badge tono={a.asistio ? "ok" : "bad"}>{a.nombre}{a.puesto ? ` · ${a.puesto}` : ""}{a.asistio ? "" : " · faltó"}</Badge></li>)}</ul>
              </Card>
            );
          }) : <Vacio titulo="Sin formaciones">Registra cada sesión con quién asistió: sirve de evidencia ante inspecciones y para ver quién falta por formar.</Vacio>}
        </div>
      )}
    </div>
  );
}
