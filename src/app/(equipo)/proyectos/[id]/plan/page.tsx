import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion, SelectAccion } from "@/components/boton-accion";
import { Prioridad } from "@/components/piezas";
import { BotonExcel } from "@/components/boton-excel";
import { Comentarios } from "@/components/comentarios";
import { LineaKpi } from "@/components/graficos";
import { Vacio } from "@/components/ui/vacio";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import * as A from "@/app/acciones/plan";
import { ESTADOS_TAREA, PDCA, PRIORIDAD, diasHasta, estadoKpi, fecha, fechaCorta, mes, opciones, valorKpi, type Tabla } from "@/lib/utils";

const PRESETS: [string, string, string, string][] = [
  ["food_cost", "Food cost", "%", "bajar"], ["labour_cost", "Labour cost", "%", "bajar"], ["prime_cost", "Prime cost", "%", "bajar"],
  ["ticket_medio", "Ticket medio", "€", "subir"], ["mermas", "Mermas sobre ventas", "%", "bajar"], ["revpash", "RevPASH", "€", "subir"],
  ["rotacion_mesas", "Rotación de mesas", "veces", "subir"], ["tiempo_pase", "Tiempo de pase", "min", "bajar"], ["resenas", "Valoración en reseñas", "pts", "subir"],
];

export default async function Plan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const [{ data: kpis }, { data: acciones }, { data: tareas }, { data: hallazgos }, { data: proy }, { data: comentarios }] = await Promise.all([
    supabase.from("kpis").select("*, kpi_valores(*)").eq("proyecto_id", id).order("created_at"),
    supabase.from("acciones").select("*").eq("proyecto_id", id).order("fecha_objetivo", { nullsFirst: false }),
    supabase.from("tareas").select("*").eq("proyecto_id", id).order("vence", { nullsFirst: false }),
    supabase.from("hallazgos").select("id, titulo").eq("proyecto_id", id),
    supabase.from("proyectos").select("negocios(contactos(nombre, cargo))").eq("id", id).single(),
    supabase.from("comentarios").select("*, perfiles(nombre)").eq("proyecto_id", id).order("created_at"),
  ]);
  // Responsables: yo o un contacto del cliente (por nombre)
  const contactos = proy?.negocios?.contactos ?? [];
  const personas: [string, string][] = [["yo", `Yo (${perfil.nombre})`], ...contactos.map((c) => [`ext:${c.nombre}`, `${c.nombre}${c.cargo ? ` · ${c.cargo}` : ""}`] as [string, string])];
  type R = { responsable_id: string | null; responsable_externo: string | null };
  const valorResp = (x?: R) => !x ? "yo" : x.responsable_externo ? `ext:${x.responsable_externo}` : x.responsable_id ? "yo" : "";
  const opcionesResp = (x?: R) => x?.responsable_externo && !contactos.some((c) => c.nombre === x.responsable_externo) ? [...personas, [`ext:${x.responsable_externo}`, x.responsable_externo] as [string, string]] : personas;
  const nombre = (x: R) => x.responsable_externo ?? (x.responsable_id ? "Yo" : "Sin asignar");
  const coms = (entidad: string, eid: string) => (comentarios ?? []).filter((c) => c.entidad === entidad && c.entidad_id === eid)
    .map((c) => ({ id: c.id, texto: c.texto, autor: c.perfiles?.nombre ?? "—", fecha: fecha(c.created_at) }));
  const mesActual = new Date().toISOString().slice(0, 7);

  const camposAccion = (a?: Tabla<"acciones">) => (
    <>
      <Campo label="Acción" className="sm:col-span-2"><Input name="titulo" required defaultValue={a?.titulo} /></Campo>
      <Campo label="Fase PDCA"><Select name="fase_pdca" defaultValue={a?.fase_pdca ?? "planificar"} opciones={opciones(PDCA)} /></Campo>
      <Campo label="Prioridad"><Select name="prioridad" defaultValue={a?.prioridad ?? "media"} opciones={opciones(PRIORIDAD)} /></Campo>
      <Campo label="Responsable" ayuda="Tú o alguien del cliente (contactos del negocio)"><Select name="responsable" defaultValue={valorResp(a)} vacio="Sin asignar" opciones={opcionesResp(a)} /></Campo>
      <Campo label="Fecha objetivo"><Input name="fecha_objetivo" type="date" defaultValue={a?.fecha_objetivo ?? ""} /></Campo>
      <Campo label="KPI que debe mejorar"><Select name="kpi_id" defaultValue={a?.kpi_id ?? ""} vacio="Ninguno" opciones={(kpis ?? []).map((k) => [k.id, k.nombre])} /></Campo>
      <Campo label="Hallazgo de origen"><Select name="hallazgo_id" defaultValue={a?.hallazgo_id ?? ""} vacio="Ninguno" opciones={(hallazgos ?? []).map((h) => [h.id, h.titulo])} /></Campo>
      <Campo label="Descripción" className="sm:col-span-2"><Textarea name="descripcion" defaultValue={a?.descripcion ?? ""} /></Campo>
      <Campo label="Resultado (verificar / actuar)" className="sm:col-span-2"><Textarea name="resultado" defaultValue={a?.resultado ?? ""} placeholder="Qué ha pasado con el KPI y qué se estandariza" /></Campo>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="visible_cliente" defaultChecked={a?.visible_cliente ?? true} className="size-4" />Incluir en los informes</label>
    </>
  );
  const camposTarea = (t?: Tabla<"tareas">) => (
    <>
      <Campo label="Tarea" className="sm:col-span-2"><Input name="titulo" required defaultValue={t?.titulo} /></Campo>
      <Campo label="Responsable" ayuda="Lo asignado al cliente sale en los informes"><Select name="responsable" defaultValue={valorResp(t)} vacio="Sin asignar" opciones={opcionesResp(t)} /></Campo>
      <Campo label="Vence"><Input name="vence" type="date" defaultValue={t?.vence ?? ""} /></Campo>
      <Campo label="Estado"><Select name="estado" defaultValue={t?.estado ?? "pendiente"} opciones={opciones(ESTADOS_TAREA)} /></Campo>
      <Campo label="Prioridad"><Select name="prioridad" defaultValue={t?.prioridad ?? "media"} opciones={opciones(PRIORIDAD)} /></Campo>
      <Campo label="Acción del plan" className="sm:col-span-2"><Select name="accion_id" defaultValue={t?.accion_id ?? ""} vacio="Ninguna" opciones={(acciones ?? []).map((a) => [a.id, a.titulo])} /></Campo>
      <Campo label="Detalle" className="sm:col-span-2"><Textarea name="descripcion" defaultValue={t?.descripcion ?? ""} /></Campo>
    </>
  );

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-mono text-base font-bold">Indicadores</h2><p className="text-sm text-muted-foreground">Cada acción del plan debería mover uno de estos números.</p></div>
          <span className="ml-auto"><BotonExcel href={`/exportar/plan?proyecto=${id}`}>Plan en Excel</BotonExcel></span>
          {editar && (
            <DialogoForm titulo="Nuevo KPI" descripcion={`Habituales: ${PRESETS.map((p) => p[1]).join(", ")}.`} trigger={<Button size="sm"><Plus />KPI</Button>}
              action={async (fd) => { "use server"; return A.guardarKpi(id, null, fd); }}>
              <Campo label="Nombre"><Input name="nombre" required list="kpi-presets" placeholder="Food cost" /></Campo>
              <datalist id="kpi-presets">{PRESETS.map((p) => <option key={p[0]} value={p[1]} />)}</datalist>
              <Campo label="Unidad"><Select name="unidad" opciones={[["%", "%"], ["€", "€"], ["min", "minutos"], ["pts", "puntos"], ["veces", "veces"], ["ud", "unidades"]]} /></Campo>
              <Campo label="Valor antes de empezar"><Input name="valor_base" type="number" step="any" /></Campo>
              <Campo label="Objetivo"><Input name="objetivo" type="number" step="any" /></Campo>
              <Campo label="Es mejor si…"><Select name="sentido" opciones={[["bajar", "Baja"], ["subir", "Sube"]]} /></Campo>
              <Campo label="Código interno"><Select name="codigo" vacio="Otro" opciones={PRESETS.map((p) => [p[0], p[1]])} /></Campo>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="visible_cliente" defaultChecked className="size-4" />Incluir en los informes</label>
            </DialogoForm>
          )}
        </div>
        {kpis?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k) => {
              const serie = [...k.kpi_valores].sort((a, b) => a.periodo.localeCompare(b.periodo));
              const ult = serie.at(-1);
              const e = estadoKpi(ult?.valor, k.objetivo, k.valor_base, k.sentido);
              const vinculadas = (acciones ?? []).filter((a) => a.kpi_id === k.id).length;
              return (
                <Card key={k.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-semibold">{k.nombre}</p><p className="text-xs text-muted-foreground">Base {valorKpi(k.valor_base, k.unidad)} · objetivo {valorKpi(k.objetivo, k.unidad)} · {vinculadas} acciones</p></div>
                    <Badge tono={e === "ok" ? "ok" : e === "warn" ? "warn" : e === "bad" ? "bad" : "neutro"}>{valorKpi(ult?.valor, k.unidad)}</Badge>
                  </div>
                  {serie.length > 1 ? <LineaKpi datos={serie.map((v) => ({ periodo: mes(v.periodo), valor: Number(v.valor) }))} objetivo={k.objetivo} unidad={k.unidad} alto={150} />
                    : <p className="py-8 text-center text-sm text-muted-foreground">Registra al menos dos meses para ver la evolución.</p>}
                  {editar && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t pt-2">
                      <DialogoForm titulo={`Registrar ${k.nombre}`} trigger={<Button variant="outline" size="sm"><Plus />Valor del mes</Button>}
                        action={async (fd) => { "use server"; return A.registrarValorKpi(id, k.id, fd); }}>
                        <Campo label="Mes"><Input name="periodo" type="month" defaultValue={mesActual} required /></Campo>
                        <Campo label={`Valor (${k.unidad})`}><Input name="valor" type="number" step="any" required /></Campo>
                        <Campo label="Nota" className="sm:col-span-2"><Input name="nota" placeholder="De dónde sale el dato" /></Campo>
                      </DialogoForm>
                      <DialogoForm titulo="Editar KPI" trigger={<Button variant="ghost" size="sm"><Pencil />Editar</Button>} action={async (fd) => { "use server"; return A.guardarKpi(id, k.id, fd); }}>
                        <Campo label="Nombre"><Input name="nombre" required defaultValue={k.nombre} /></Campo>
                        <Campo label="Unidad"><Input name="unidad" defaultValue={k.unidad} /></Campo>
                        <Campo label="Valor base"><Input name="valor_base" type="number" step="any" defaultValue={k.valor_base ?? ""} /></Campo>
                        <Campo label="Objetivo"><Input name="objetivo" type="number" step="any" defaultValue={k.objetivo ?? ""} /></Campo>
                        <Campo label="Es mejor si…"><Select name="sentido" defaultValue={k.sentido} opciones={[["bajar", "Baja"], ["subir", "Sube"]]} /></Campo>
                        <input type="hidden" name="codigo" value={k.codigo ?? ""} />
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible_cliente" defaultChecked={k.visible_cliente} className="size-4" />Incluir en los informes</label>
                      </DialogoForm>
                      <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar KPI" accion={async () => { "use server"; return A.borrarKpi(id, k.id); }}><Trash2 /></BotonAccion>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : <Vacio titulo="Sin KPIs">Define 3-5 indicadores antes de lanzar acciones: food cost, mermas, ticket medio…</Vacio>}
      </section>

      {/* PDCA */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-mono text-base font-bold">Acciones de mejora · PDCA</h2><p className="text-sm text-muted-foreground">Planificar → Hacer → Verificar → Actuar. Lo que funciona se estandariza.</p></div>
          {editar && <DialogoForm titulo="Nueva acción de mejora" ancho="max-w-2xl" trigger={<Button size="sm"><Plus />Acción</Button>} action={async (fd) => { "use server"; return A.guardarAccion(id, null, fd); }}>{camposAccion()}</DialogoForm>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(PDCA) as (keyof typeof PDCA)[]).map((f, i) => {
            const lista = (acciones ?? []).filter((a) => a.fase_pdca === f);
            return (
              <div key={f} className="rounded-md bg-muted/70 p-2.5">
                <h3 className="flex items-baseline justify-between px-1 font-mono text-[11px] font-bold uppercase tracking-widest"><span><span className="text-brand">{["P", "D", "C", "A"][i]}</span> · {PDCA[f].nombre}</span><span className="text-muted-foreground">{lista.length}</span></h3>
                <p className="mb-2 px-1 text-xs text-muted-foreground">{PDCA[f].ayuda}</p>
                <div className="grid gap-2">
                  {lista.map((a) => {
                    const k = kpis?.find((x) => x.id === a.kpi_id);
                    const ts = (tareas ?? []).filter((t) => t.accion_id === a.id);
                    return (
                      <article key={a.id} className="rounded-sm border bg-card p-3 text-sm">
                        <p className="font-semibold leading-snug">{a.titulo}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{nombre(a)}{a.fecha_objetivo ? ` · ${fechaCorta(a.fecha_objetivo)}` : ""}{ts.length ? ` · ${ts.filter((t) => t.estado === "hecha").length}/${ts.length} tareas` : ""}</p>
                        <div className="mt-2 flex flex-wrap gap-1"><Prioridad p={a.prioridad} />{k && <Badge tono="primary">{k.nombre}</Badge>}{!a.visible_cliente && <Badge>Fuera de informes</Badge>}</div>
                        {a.resultado && <p className="mt-2 border-l-2 border-ok pl-2 text-[13px] text-muted-foreground">{a.resultado}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2">
                          {editar && <SelectAccion label="Fase" valor={a.fase_pdca} opciones={opciones(PDCA)} accion={async (v) => { "use server"; return A.moverAccion(id, a.id, v as typeof f); }} />}
                          {editar && <DialogoForm titulo="Editar acción" ancho="max-w-2xl" trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button>} action={async (fd) => { "use server"; return A.guardarAccion(id, a.id, fd); }}>{camposAccion(a)}</DialogoForm>}
                          <Comentarios titulo={a.titulo} lista={coms("accion", a.id)} accion={async (fd) => { "use server"; return A.comentar(id, "accion", a.id, fd); }} />
                          {editar && <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar acción" accion={async () => { "use server"; return A.borrarAccion(id, a.id); }}><Trash2 /></BotonAccion>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tareas */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-mono text-base font-bold">Tareas</h2><p className="text-sm text-muted-foreground">Las asignadas al cliente (en cobre) salen en los informes como «Pendiente por vuestra parte».</p></div>
          {editar && <DialogoForm titulo="Nueva tarea" trigger={<Button size="sm"><Plus />Tarea</Button>} action={async (fd) => { "use server"; return A.guardarTarea(id, null, fd); }}>{camposTarea()}</DialogoForm>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(ESTADOS_TAREA) as (keyof typeof ESTADOS_TAREA)[]).map((e) => {
            const lista = (tareas ?? []).filter((t) => t.estado === e);
            return (
              <div key={e} className="rounded-md bg-muted/70 p-2.5">
                <h3 className="mb-2 flex justify-between px-1 font-mono text-[11px] font-bold uppercase tracking-widest"><span>{ESTADOS_TAREA[e]}</span><span className="text-muted-foreground">{lista.length}</span></h3>
                <div className="grid gap-2">
                  {lista.map((t) => {
                    const d = t.vence ? diasHasta(t.vence) : null;
                    return (
                      <article key={t.id} className="rounded-sm border bg-card p-3 text-sm">
                        <p className={"font-medium leading-snug " + (t.estado === "hecha" ? "text-muted-foreground line-through" : "")}>{t.titulo}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <Badge tono={t.responsable_externo ? "primary" : "neutro"}>{nombre(t)}</Badge>
                          {t.vence && <Badge tono={t.estado !== "hecha" && d! < 0 ? "bad" : t.estado !== "hecha" && d! <= 3 ? "warn" : "neutro"}>{fechaCorta(t.vence)}</Badge>}
                          {t.prioridad === "alta" && <Prioridad p="alta" />}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2">
                          {editar && <SelectAccion label="Estado" valor={t.estado} opciones={opciones(ESTADOS_TAREA)} accion={async (v) => { "use server"; return A.estadoTarea(id, t.id, v as typeof e); }} />}
                          {editar && <DialogoForm titulo="Editar tarea" trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button>} action={async (fd) => { "use server"; return A.guardarTarea(id, t.id, fd); }}>{camposTarea(t)}</DialogoForm>}
                          <Comentarios titulo={t.titulo} lista={coms("tarea", t.id)} accion={async (fd) => { "use server"; return A.comentar(id, "tarea", t.id, fd); }} />
                          {editar && <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar tarea" accion={async () => { "use server"; return A.borrarTarea(id, t.id); }}><Trash2 /></BotonAccion>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
