import Link from "next/link";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion, SelectAccion } from "@/components/boton-accion";
import { Kpi, Progreso } from "@/components/piezas";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import * as A from "@/app/acciones/proyectos";
import { ESTADOS_PROYECTO, SALUD, TIPOS_PROYECTO, eur, estadoKpi, fecha, numero, opciones, valorKpi } from "@/lib/utils";

export default async function Resumen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, esAdmin } = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const [{ data: p }, { data: fases }, { data: hitos }, { data: fin }, , { data: tareas }, { data: kpis }, { data: equipo }] = await Promise.all([
    supabase.from("proyectos").select("*").eq("id", id).single(),
    supabase.from("fases").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("hitos").select("*").eq("proyecto_id", id).order("fecha"),
    supabase.from("proyecto_finanzas").select("*").eq("proyecto_id", id).maybeSingle(),
    Promise.resolve({ data: null }),
    supabase.from("tareas").select("estado, vence").eq("proyecto_id", id),
    supabase.from("kpis").select("*, kpi_valores(periodo, valor)").eq("proyecto_id", id),
    supabase.from("perfiles").select("id, nombre, rol").order("nombre"),
  ]);
  if (!p) return null;
  const { data: contactos } = await supabase.from("contactos").select("*").eq("negocio_id", p.negocio_id).order("principal", { ascending: false });
  const hechas = tareas?.filter((t) => t.estado === "hecha").length ?? 0;
  const total = tareas?.length ?? 0;
  const pid = id;
  const horasPct = fin && fin.horas_presupuestadas > 0 ? fin.horas_consumidas / fin.horas_presupuestadas : 0;
  const costeHoras = fin ? fin.horas_consumidas * (fin.tarifa_hora ?? 0) : 0;
  const equipoInterno = (equipo ?? []).filter((u) => u.rol === "admin" || u.rol === "colaborador");

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Objetivos y alcance</CardTitle>
            {editar && (
              <DialogoForm titulo="Editar proyecto" trigger={<Button variant="outline" size="sm"><Pencil />Editar</Button>} ancho="max-w-2xl"
                action={async (fd) => { "use server"; return A.actualizarProyecto(pid, fd); }}>
                <Campo label="Título" className="sm:col-span-2"><Input name="titulo" defaultValue={p.titulo} required /></Campo>
                <Campo label="Tipo"><Select name="tipo" defaultValue={p.tipo} opciones={opciones(TIPOS_PROYECTO)} /></Campo>
                <Campo label="Código"><Input name="codigo" defaultValue={p.codigo ?? ""} /></Campo>
                <Campo label="Estado"><Select name="estado" defaultValue={p.estado} opciones={opciones(ESTADOS_PROYECTO)} /></Campo>
                <Campo label="Salud"><Select name="salud" defaultValue={p.salud} opciones={opciones(SALUD)} /></Campo>
                <Campo label="Responsable"><Select name="responsable_id" defaultValue={p.responsable_id ?? ""} vacio="Sin asignar" opciones={equipoInterno.map((u) => [u.id, u.nombre])} /></Campo>
                <span />
                <Campo label="Inicio"><Input name="fecha_inicio" type="date" defaultValue={p.fecha_inicio ?? ""} /></Campo>
                <Campo label="Entrega prevista"><Input name="fecha_fin" type="date" defaultValue={p.fecha_fin ?? ""} /></Campo>
                <Campo label="Objetivos" className="sm:col-span-2"><Textarea name="objetivos" defaultValue={p.objetivos ?? ""} /></Campo>
                <Campo label="Alcance" className="sm:col-span-2"><Textarea name="alcance" defaultValue={p.alcance ?? ""} /></Campo>
              </DialogoForm>
            )}
          </CardHeader>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div><p className="eyebrow mb-1">Objetivos</p><p className="whitespace-pre-wrap leading-relaxed">{p.objetivos || "Sin definir."}</p></div>
            <div><p className="eyebrow mb-1">Alcance</p><p className="whitespace-pre-wrap leading-relaxed">{p.alcance || "Sin definir."}</p></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Del {fecha(p.fecha_inicio)} al {fecha(p.fecha_fin)}</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fases</CardTitle>
            {editar && (
              <DialogoForm titulo="Nueva fase" trigger={<Button variant="outline" size="sm"><Plus />Fase</Button>} action={async (fd) => { "use server"; return A.crearFase(pid, fd); }}>
                <Campo label="Nombre" className="sm:col-span-2"><Input name="nombre" required /></Campo>
                <Campo label="Inicio"><Input name="fecha_inicio" type="date" /></Campo>
                <Campo label="Fin"><Input name="fecha_fin" type="date" /></Campo>
              </DialogoForm>
            )}
          </CardHeader>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {fases?.map((f, i) => (
              <li key={f.id} className={"rounded-sm border p-3 " + (f.estado === "en_curso" ? "border-brand bg-primary-soft/40" : "")}>
                <p className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                <p className="font-semibold">{f.nombre}</p>
                <p className="mb-2 text-xs text-muted-foreground">{fecha(f.fecha_inicio, { day: "numeric", month: "short" })} – {fecha(f.fecha_fin, { day: "numeric", month: "short" })}</p>
                {editar ? (
                  <div className="flex items-center gap-1">
                    <SelectAccion label="Estado de la fase" valor={f.estado} opciones={[["pendiente", "Pendiente"], ["en_curso", "En curso"], ["completada", "Completada"]]}
                      accion={async (v) => { "use server"; return A.estadoFase(pid, f.id, v as "pendiente"); }} />
                    <BotonAccion size="icon" variant="ghost" confirmar="¿Borrar?" title="Borrar fase" accion={async () => { "use server"; return A.borrarFase(pid, f.id); }}><Trash2 /></BotonAccion>
                  </div>
                ) : <Badge tono={f.estado === "completada" ? "ok" : f.estado === "en_curso" ? "primary" : "neutro"}>{f.estado.replace("_", " ")}</Badge>}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hitos</CardTitle>
            {editar && (
              <DialogoForm titulo="Nuevo hito" trigger={<Button variant="outline" size="sm"><Plus />Hito</Button>} action={async (fd) => { "use server"; return A.crearHito(pid, fd); }}>
                <Campo label="Hito"><Input name="titulo" required /></Campo>
                <Campo label="Fecha"><Input name="fecha" type="date" /></Campo>
              </DialogoForm>
            )}
          </CardHeader>
          <ul className="divide-y text-sm">
            {hitos?.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <span className="flex items-center gap-2">
                  {editar
                    ? <BotonAccion size="icon" variant={h.completado ? "default" : "outline"} title={h.completado ? "Marcar pendiente" : "Marcar cumplido"}
                        accion={async () => { "use server"; return A.toggleHito(pid, h.id, !h.completado); }}><Check /></BotonAccion>
                    : <Check className={h.completado ? "size-4 text-ok" : "size-4 text-input"} />}
                  <span className={h.completado ? "text-muted-foreground line-through" : ""}>{h.titulo}</span>
                </span>
                <span className="tnum text-xs text-muted-foreground">{fecha(h.fecha)}</span>
              </li>
            ))}
            {!hitos?.length && <li className="py-2 text-muted-foreground">Sin hitos.</li>}
          </ul>
        </Card>
      </div>

      <div className="grid content-start gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Progreso" valor={`${total ? Math.round((hechas / total) * 100) : 0} %`} ayuda={<Progreso hechas={hechas} total={total} />} />
          <Kpi label="Fase actual" valor={<span className="text-base">{fases?.find((f) => f.estado === "en_curso")?.nombre ?? "—"}</span>} ayuda={`${fases?.filter((f) => f.estado === "completada").length ?? 0} de ${fases?.length ?? 0} completadas`} />
        </div>

        {esAdmin && fin && (
          <Card>
            <CardHeader>
              <CardTitle>Presupuesto de consultoría</CardTitle>
              <DialogoForm titulo="Presupuesto y horas" trigger={<Button variant="outline" size="sm"><Pencil />Editar</Button>}
                action={async (fd) => { "use server"; return A.actualizarFinanzas(pid, fd); }}>
                <Campo label="Horas presupuestadas"><Input name="horas_presupuestadas" type="number" step="0.5" defaultValue={fin.horas_presupuestadas} /></Campo>
                <Campo label="Horas consumidas"><Input name="horas_consumidas" type="number" step="0.5" defaultValue={fin.horas_consumidas} /></Campo>
                <Campo label="Importe presupuestado (€)"><Input name="importe_presupuestado" type="number" step="0.01" defaultValue={fin.importe_presupuestado} /></Campo>
                <Campo label="Tarifa interna (€/h)"><Input name="tarifa_hora" type="number" step="0.01" defaultValue={fin.tarifa_hora ?? ""} /></Campo>
              </DialogoForm>
            </CardHeader>
            <p className="tnum font-mono text-2xl font-bold">{numero(fin.horas_consumidas, 1)} h <span className="text-sm font-normal text-muted-foreground">de {numero(fin.horas_presupuestadas, 1)} h</span></p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={"h-full " + (horasPct > 1 ? "bg-bad" : horasPct > 0.85 ? "bg-accent" : "bg-brand")} style={{ width: `${Math.min(horasPct, 1) * 100}%` }} /></div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Presupuesto</dt><dd className="tnum text-right font-medium">{eur(fin.importe_presupuestado)}</dd>
              <dt className="text-muted-foreground">Coste de horas</dt><dd className="tnum text-right font-medium">{eur(costeHoras)}</dd>
              <dt className="text-muted-foreground">Margen</dt><dd className={"tnum text-right font-semibold " + (fin.importe_presupuestado - costeHoras < 0 ? "text-bad" : "text-ok")}>{eur(fin.importe_presupuestado - costeHoras)}</dd>
              <dt className="text-muted-foreground">€ por hora real</dt><dd className="tnum text-right font-medium">{fin.horas_consumidas ? eur(fin.importe_presupuestado / fin.horas_consumidas, 2) : "—"}</dd>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Solo tú ves este bloque.</p>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>KPIs</CardTitle><Link href={`/proyectos/${id}/plan`} className="text-sm text-primary-ink hover:underline">Ver evolución</Link></CardHeader>
          <ul className="divide-y text-sm">
            {kpis?.map((k) => {
              const ult = [...k.kpi_valores].sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
              const e = estadoKpi(ult?.valor, k.objetivo, k.valor_base, k.sentido);
              return (
                <li key={k.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0"><span className="block font-medium">{k.nombre}</span><span className="text-xs text-muted-foreground">base {valorKpi(k.valor_base, k.unidad)} → objetivo {valorKpi(k.objetivo, k.unidad)}</span></span>
                  <Badge tono={e === "ok" ? "ok" : e === "warn" ? "warn" : e === "bad" ? "bad" : "neutro"}>{valorKpi(ult?.valor, k.unidad)}</Badge>
                </li>
              );
            })}
            {!kpis?.length && <li className="py-2 text-muted-foreground">Define KPIs en el plan de mejora.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contactos del cliente</CardTitle><Link href={`/negocios/${p.negocio_id}`} className="text-sm text-primary-ink hover:underline">Ficha del negocio</Link></CardHeader>
          <ul className="divide-y text-sm">
            {contactos?.map((c) => (
              <li key={c.id} className="py-2"><p className="font-medium">{c.nombre}{c.cargo ? <span className="font-normal text-muted-foreground"> · {c.cargo}</span> : null}</p><p className="select-all break-all text-xs text-muted-foreground">{[c.email, c.telefono].filter(Boolean).join(" · ")}</p></li>
            ))}
            {!contactos?.length && <li className="py-2 text-muted-foreground">Añade contactos en la ficha del negocio.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
