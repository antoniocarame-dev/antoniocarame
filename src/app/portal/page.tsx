import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/components/shell";
import { EstadoProyecto, Progreso } from "@/components/piezas";
import { Vacio } from "@/components/ui/vacio";
import { getSesion } from "@/lib/sesion";
import { fecha } from "@/lib/utils";

export default async function Portal() {
  const { supabase, perfil } = await getSesion();
  const { data } = await supabase.from("v_proyectos_resumen").select("*").order("estado").order("fecha_inicio", { ascending: false });
  const abiertos = (data ?? []).filter((p) => p.estado !== "cerrado");
  if (abiertos.length === 1 && (data ?? []).length === 1) redirect(`/portal/${abiertos[0].id}`);
  return (
    <>
      <Cabecera eyebrow="Bienvenida" titulo={`Hola, ${perfil.nombre.split(" ")[0]}`} sub="Tus proyectos con la consultora." />
      {!data?.length && <Vacio titulo="Todavía no tienes proyectos">Cuando la consultora te dé acceso aparecerán aquí.</Vacio>}
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((p) => (
          <Link key={p.id} href={`/portal/${p.id}`} className="ticket-edge rounded-sm border bg-card p-4 hover:border-primary">
            <div className="flex justify-between gap-2"><span className="eyebrow">{p.negocio_nombre}</span><EstadoProyecto estado={p.estado!} /></div>
            <h2 className="mt-1 font-mono text-base font-bold">{p.titulo}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)}</p>
            <Progreso hechas={p.tareas_hechas ?? 0} total={p.tareas_total ?? 0} />
          </Link>
        ))}
      </div>
    </>
  );
}
