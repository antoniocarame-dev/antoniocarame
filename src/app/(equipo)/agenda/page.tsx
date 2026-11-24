import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge, type Tono } from "@/components/ui/badge";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { TzOffset } from "@/components/tz";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { crearEvento, borrarEvento } from "@/app/acciones/varios";
import { TIPOS_EVENTO, fecha, hora, hoyISO, opciones } from "@/lib/utils";

export const metadata = { title: "Agenda" };
const TONO: Record<string, Tono> = { visita: "primary", auditoria: "warn", entrega: "bad", reunion: "neutro", formacion: "ok" };

export default async function Agenda({ searchParams }: { searchParams: Promise<{ pasados?: string }> }) {
  const { pasados } = await searchParams;
  const { supabase } = await requiereEquipo();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let q = supabase.from("eventos").select("*, proyectos(id, titulo, negocios(nombre))");
  q = pasados ? q.lt("inicio", hoy.toISOString()).order("inicio", { ascending: false }).limit(60) : q.gte("inicio", hoy.toISOString()).order("inicio");
  const [{ data: eventos }, { data: proyectos }] = await Promise.all([
    q, supabase.from("proyectos").select("id, titulo, negocios(nombre)").neq("estado", "cerrado").order("titulo"),
  ]);
  const dias = new Map<string, NonNullable<typeof eventos>>();
  (eventos ?? []).forEach((e) => { const k = fecha(e.inicio, { weekday: "long", day: "numeric", month: "long" }); dias.set(k, [...(dias.get(k) ?? []), e]); });

  return (
    <>
      <Cabecera eyebrow="Calendario" titulo="Agenda" sub="Visitas, auditorías, entregas, reuniones y formaciones de todos los proyectos.">
        <Button asChild variant="outline"><Link href={pasados ? "/agenda" : "/agenda?pasados=1"}>{pasados ? "Ver próximos" : "Ver pasados"}</Link></Button>
        <DialogoForm titulo="Nuevo evento" trigger={<Button><Plus />Evento</Button>} action={async (fd) => { "use server"; return crearEvento(fd); }}>
          <TzOffset />
          <Campo label="Qué" className="sm:col-span-2"><Input name="titulo" required placeholder="Visita de seguimiento" /></Campo>
          <Campo label="Tipo"><Select name="tipo" opciones={opciones(TIPOS_EVENTO)} /></Campo>
          <Campo label="Proyecto"><Select name="proyecto_id" vacio="Sin proyecto (interno)" opciones={(proyectos ?? []).map((p) => [p.id, `${p.negocios?.nombre} · ${p.titulo}`])} /></Campo>
          <Campo label="Día"><Input name="dia" type="date" required defaultValue={hoyISO()} /></Campo>
          <div className="grid grid-cols-2 gap-2"><Campo label="Desde"><Input name="hora_inicio" type="time" defaultValue="10:00" /></Campo><Campo label="Hasta"><Input name="hora_fin" type="time" /></Campo></div>
          <Campo label="Lugar" className="sm:col-span-2"><Input name="lugar" /></Campo>
          <Campo label="Notas" className="sm:col-span-2"><Textarea name="notas" /></Campo>
        </DialogoForm>
      </Cabecera>
      {dias.size === 0 && <Vacio titulo={pasados ? "Sin eventos pasados" : "Nada programado"}>Añade la próxima visita o auditoría.</Vacio>}
      <div className="grid max-w-3xl gap-5">
        {[...dias].map(([dia, lista]) => (
          <section key={dia}>
            <h2 className="eyebrow mb-2">{dia}</h2>
            <ul className="grid gap-2">
              {lista.map((e) => (
                <li key={e.id} className="flex items-start gap-4 rounded-md border bg-card p-3">
                  <p className="tnum w-14 shrink-0 font-mono text-sm font-bold">{hora(e.inicio)}{e.fin && <span className="block text-xs font-normal text-muted-foreground">{hora(e.fin)}</span>}</p>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{e.titulo} <Badge tono={TONO[e.tipo]}>{TIPOS_EVENTO[e.tipo]}</Badge></p>
                    <p className="text-sm text-muted-foreground">{e.proyectos ? <Link href={`/proyectos/${e.proyectos.id}`} className="hover:underline">{e.proyectos.negocios?.nombre} · {e.proyectos.titulo}</Link> : "Interno"}{e.lugar ? ` · ${e.lugar}` : ""}</p>
                    {e.notas && <p className="mt-1 text-sm">{e.notas}</p>}
                  </div>
                  <BotonAccion size="icon" variant="ghost" confirmar="¿Borrar?" title="Borrar evento" accion={async () => { "use server"; return borrarEvento(e.id); }}><Trash2 /></BotonAccion>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
