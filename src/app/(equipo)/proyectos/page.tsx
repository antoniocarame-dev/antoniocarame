import Link from "next/link";
import { Plus } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { Semaforo, Progreso } from "@/components/piezas";
import { SelectAccion } from "@/components/boton-accion";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { crearProyecto, cambiarEstadoProyecto } from "@/app/acciones/proyectos";
import { ESTADOS_PROYECTO, TIPOS_PROYECTO, fecha, opciones } from "@/lib/utils";

export const metadata = { title: "Proyectos" };

export default async function Proyectos() {
  const { supabase, esAdmin } = await requiereEquipo();
  const [{ data: proyectos }, { data: negocios }, { data: perfiles }] = await Promise.all([
    supabase.from("v_proyectos_resumen").select("*").order("fecha_fin"),
    supabase.from("negocios").select("id, nombre").order("nombre"),
    supabase.from("perfiles").select("id, nombre, rol").in("rol", ["admin", "colaborador"]),
  ]);
  const nombre = (id: string | null) => perfiles?.find((p) => p.id === id)?.nombre ?? "—";
  const estados = Object.keys(ESTADOS_PROYECTO) as (keyof typeof ESTADOS_PROYECTO)[];

  const nuevo = esAdmin && (
    <DialogoForm titulo="Nuevo proyecto" descripcion="Se crean las 4 fases estándar: Diagnóstico, Plan de acción, Implantación y Seguimiento."
      trigger={<Button><Plus />Nuevo proyecto</Button>} action={async (fd) => { "use server"; return crearProyecto(fd); }} boton="Crear proyecto">
      <Campo label="Título del encargo" className="sm:col-span-2"><Input name="titulo" required placeholder="Ej. Control de costes y reorganización de cocina" /></Campo>
      <Campo label="Negocio"><Select name="negocio_id" required vacio="Elige negocio" opciones={(negocios ?? []).map((n) => [n.id, n.nombre])} /></Campo>
      <Campo label="Tipo de encargo"><Select name="tipo" opciones={opciones(TIPOS_PROYECTO)} /></Campo>
      <Campo label="Responsable"><Select name="responsable_id" opciones={(perfiles ?? []).map((p) => [p.id, p.nombre])} /></Campo>
      <Campo label="Código"><Input name="codigo" placeholder="P-2026-12" /></Campo>
      <Campo label="Inicio"><Input name="fecha_inicio" type="date" /></Campo>
      <Campo label="Entrega prevista"><Input name="fecha_fin" type="date" /></Campo>
      <Campo label="Horas presupuestadas"><Input name="horas" type="number" step="0.5" min="0" /></Campo>
      <Campo label="Importe del presupuesto (€ sin IVA)"><Input name="importe" type="number" step="0.01" min="0" /></Campo>
      <Campo label="Objetivos" className="sm:col-span-2"><Textarea name="objetivos" placeholder="Qué tiene que cambiar y cómo se medirá" /></Campo>
    </DialogoForm>
  );

  return (
    <>
      <Cabecera eyebrow="Cartera" titulo="Proyectos" sub="Cada encargo pasa por diagnóstico, ejecución y seguimiento. Cambia el estado desde la tarjeta.">{nuevo}</Cabecera>
      {!negocios?.length && <Vacio titulo="Primero, un negocio" accion={<Button asChild variant="outline"><Link href="/negocios">Ir a negocios</Link></Button>}>Cada proyecto pertenece a un negocio.</Vacio>}
      <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
        {estados.map((e) => {
          const lista = (proyectos ?? []).filter((p) => p.estado === e);
          return (
            <section key={e} className="min-w-0 rounded-md bg-muted/70 p-2.5">
              <h2 className="mb-2.5 flex justify-between px-1 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground"><span>{ESTADOS_PROYECTO[e]}</span><span>{lista.length}</span></h2>
              <div className="grid gap-2">
                {lista.map((p) => (
                  <article key={p.id} className="rounded-sm border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/proyectos/${p.id}`} className="font-semibold leading-snug hover:text-primary-ink">{p.titulo}</Link>
                      <Semaforo salud={p.salud!} texto={false} />
                    </div>
                    <p className="text-[13px] text-muted-foreground">{p.negocio_nombre}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{TIPOS_PROYECTO[p.tipo!] ?? p.tipo} · {nombre(p.responsable_id)} · entrega {fecha(p.fecha_fin)}</p>
                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <Progreso hechas={p.tareas_hechas ?? 0} total={p.tareas_total ?? 0} />
                      <SelectAccion label="Cambiar estado" valor={e} opciones={opciones(ESTADOS_PROYECTO)}
                        accion={async (v) => { "use server"; return cambiarEstadoProyecto(p.id!, v as typeof e); }} />
                    </div>
                    {(p.tareas_vencidas ?? 0) > 0 && <p className="mt-2 text-xs font-medium text-bad">{p.tareas_vencidas} tareas vencidas</p>}
                  </article>
                ))}
                {!lista.length && <p className="px-1 py-2 text-[13px] text-muted-foreground">Ninguno.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
