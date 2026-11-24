import Link from "next/link";
import { CalendarDays, List, Trash2 } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge, type Tono } from "@/components/ui/badge";
import { BotonAccion } from "@/components/boton-accion";
import { Vacio } from "@/components/ui/vacio";
import { Calendario, type EventoCal, type Recordatorio } from "@/components/agenda/calendario";
import { requiereEquipo } from "@/lib/sesion";
import { borrarEvento } from "@/app/acciones/varios";
import { TIPOS_EVENTO, diaMadrid, fecha, horaMadrid, madridAISO } from "@/lib/utils";

export const metadata = { title: "Agenda" };
const TONO: Record<string, Tono> = { visita: "primary", auditoria: "warn", entrega: "bad", reunion: "neutro", formacion: "ok", personal: "primary", otro: "neutro" };

/** Semanas (de lunes a domingo) que cubren el mes, como días AAAA-MM-DD. */
function semanasDelMes(mes: string): string[][] {
  const [y, m] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(y, m - 1, 1));
  const inicio = new Date(primero); inicio.setUTCDate(1 - ((primero.getUTCDay() + 6) % 7));
  const ultimo = new Date(Date.UTC(y, m, 0));
  const semanas: string[][] = [];
  for (const d = new Date(inicio); d <= ultimo || semanas.at(-1)?.length !== 7; d.setUTCDate(d.getUTCDate() + 1)) {
    if (!semanas.length || semanas.at(-1)!.length === 7) semanas.push([]);
    semanas.at(-1)!.push(d.toISOString().slice(0, 10));
  }
  return semanas;
}

export default async function Agenda({ searchParams }: { searchParams: Promise<{ mes?: string; vista?: string; pasados?: string }> }) {
  const sp = await searchParams;
  const { supabase, esAdmin } = await requiereEquipo();
  const hoy = diaMadrid(new Date());
  const lista = sp.vista === "lista";
  const { data: proyectos } = await supabase.from("proyectos").select("id, titulo, negocios(nombre)").neq("estado", "cerrado").order("titulo");
  const opcProyectos = (proyectos ?? []).map((p) => [p.id, `${p.negocios?.nombre} · ${p.titulo}`] as [string, string]);

  const vistas = (
    <div className="flex rounded-sm border" role="group" aria-label="Vista">
      <Button asChild size="sm" variant={lista ? "ghost" : "default"}><Link href={`/agenda${sp.mes ? `?mes=${sp.mes}` : ""}`}><CalendarDays />Mes</Link></Button>
      <Button asChild size="sm" variant={lista ? "default" : "ghost"}><Link href="/agenda?vista=lista"><List />Lista</Link></Button>
    </div>
  );

  if (!lista) {
    const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : hoy.slice(0, 7);
    const semanas = semanasDelMes(mes);
    const desde = semanas[0][0]; const hasta = semanas.at(-1)!.at(-1)!;
    const [{ data: eventos }, { data: acciones }, { data: cobros }] = await Promise.all([
      // Eventos que empiezan en la rejilla, o antes y siguen en ella (varios días)
      supabase.from("eventos").select("*, proyectos(titulo, negocios(nombre))")
        .lt("inicio", madridAISO(hasta, "23:59"))
        .or(`inicio.gte."${madridAISO(desde)}",fin.gte."${madridAISO(desde)}"`).order("inicio"),
      supabase.from("acciones").select("id, titulo, fecha_objetivo, proyecto_id, fase_pdca").in("fase_pdca", ["planificar", "hacer"])
        .gte("fecha_objetivo", desde).lte("fecha_objetivo", hasta),
      esAdmin ? supabase.from("facturas_emitidas").select("id, numero, cliente_nombre, vencimiento").eq("estado", "pendiente").gte("vencimiento", desde).lte("vencimiento", hasta)
        : Promise.resolve({ data: [] as { id: string; numero: string; cliente_nombre: string | null; vencimiento: string | null }[] }),
    ]);
    const evs: EventoCal[] = (eventos ?? []).map((e) => {
      const dia = diaMadrid(e.inicio);
      const diaFin = e.fin ? diaMadrid(e.todo_el_dia ? e.fin : new Date(new Date(e.fin).getTime() - 1)) : dia;
      return {
        id: e.id, titulo: e.titulo, tipo: e.tipo, dia, diaFin: diaFin < dia ? dia : diaFin, hIni: horaMadrid(e.inicio), hFin: e.fin && !e.todo_el_dia ? horaMadrid(e.fin) : null,
        todo: e.todo_el_dia, lugar: e.lugar, notas: e.notas, proyectoId: e.proyecto_id,
        proyecto: e.proyectos ? `${e.proyectos.negocios?.nombre} · ${e.proyectos.titulo}` : null,
      };
    });
    const recs: Recordatorio[] = [
      ...(acciones ?? []).map((a) => ({ dia: a.fecha_objetivo!, titulo: a.titulo, href: `/proyectos/${a.proyecto_id}/plan`, clase: "plan" as const })),
      ...(cobros ?? []).map((f) => ({ dia: f.vencimiento!, titulo: `${f.numero}${f.cliente_nombre ? ` · ${f.cliente_nombre}` : ""}`, href: "/consultora?v=facturacion", clase: "cobro" as const })),
    ];
    return (
      <>
        <Cabecera eyebrow="Calendario" titulo="Agenda" sub="Tu calendario: visitas, auditorías, reuniones y también lo personal. Con los plazos del plan y los cobros pendientes.">
          {vistas}
        </Cabecera>
        <Calendario key={mes} mes={mes} hoy={hoy} semanas={semanas} eventos={evs} recordatorios={recs} proyectos={opcProyectos} />
      </>
    );
  }

  const ini = madridAISO(hoy);
  let q = supabase.from("eventos").select("*, proyectos(id, titulo, negocios(nombre))");
  q = sp.pasados ? q.lt("inicio", ini).order("inicio", { ascending: false }).limit(60) : q.gte("inicio", ini).order("inicio");
  const { data: eventos } = await q;
  const dias = new Map<string, NonNullable<typeof eventos>>();
  (eventos ?? []).forEach((e) => { const k = fecha(e.inicio, { weekday: "long", day: "numeric", month: "long" }); dias.set(k, [...(dias.get(k) ?? []), e]); });

  return (
    <>
      <Cabecera eyebrow="Calendario" titulo="Agenda" sub="Lista de eventos. Para añadir o cambiar, usa la vista de mes.">
        <Button asChild variant="outline" size="sm"><Link href={sp.pasados ? "/agenda?vista=lista" : "/agenda?vista=lista&pasados=1"}>{sp.pasados ? "Ver próximos" : "Ver pasados"}</Link></Button>
        {vistas}
      </Cabecera>
      {dias.size === 0 && <Vacio titulo={sp.pasados ? "Sin eventos pasados" : "Nada programado"}>Añade la próxima visita o auditoría desde la vista de mes.</Vacio>}
      <div className="grid max-w-3xl gap-5">
        {[...dias].map(([dia, l]) => (
          <section key={dia}>
            <h2 className="eyebrow mb-2">{dia}</h2>
            <ul className="grid gap-2">
              {l.map((e) => (
                <li key={e.id} className="flex items-start gap-4 rounded-md border bg-card p-3">
                  <p className="tnum w-14 shrink-0 font-mono text-sm font-bold">{e.todo_el_dia ? <span className="text-xs">Todo el día</span> : <>{horaMadrid(e.inicio)}{e.fin && <span className="block text-xs font-normal text-muted-foreground">{horaMadrid(e.fin)}</span>}</>}</p>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{e.titulo} <Badge tono={TONO[e.tipo]}>{TIPOS_EVENTO[e.tipo]}</Badge></p>
                    <p className="text-sm text-muted-foreground">{e.proyectos ? <Link href={`/proyectos/${e.proyectos.id}`} className="hover:underline">{e.proyectos.negocios?.nombre} · {e.proyectos.titulo}</Link> : "Sin proyecto"}{e.lugar ? ` · ${e.lugar}` : ""}</p>
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
