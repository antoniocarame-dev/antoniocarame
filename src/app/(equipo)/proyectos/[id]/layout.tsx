import { notFound } from "next/navigation";
import { Cabecera } from "@/components/shell";
import { Pestanas } from "@/components/pestanas";
import { Semaforo, EstadoProyecto } from "@/components/piezas";
import { getSesion } from "@/lib/sesion";
import { TIPOS_PROYECTO } from "@/lib/utils";

const PESTANAS = [
  { href: "", label: "Resumen" },
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/plan", label: "Plan de mejora" },
  { href: "/documentos", label: "Documentos" },
  { href: "/actas", label: "Actas" },
];

export default async function LayoutProyecto({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSesion();
  const { data: p } = await supabase.from("proyectos").select("titulo, codigo, tipo, estado, salud, negocios(nombre, localidad)").eq("id", id).maybeSingle();
  if (!p) notFound();
  return (
    <>
      <Cabecera eyebrow={[p.codigo, p.negocios?.nombre, p.negocios?.localidad].filter(Boolean).join(" · ")} titulo={p.titulo}
        sub={<span className="mt-1 inline-flex flex-wrap items-center gap-2">{TIPOS_PROYECTO[p.tipo] ?? p.tipo}<EstadoProyecto estado={p.estado} /><Semaforo salud={p.salud} /></span>} />
      <Pestanas base={`/proyectos/${id}`} items={[...PESTANAS,
        { href: "/costes", label: "Costes y compras", fase: "F2" }, { href: "/escandallos", label: "Escandallos", fase: "F2" },
        { href: "/resultados", label: "Ventas y resultados", fase: "F3" }, { href: "/informes", label: "Informes", fase: "F3" }]} />
      {children}
    </>
  );
}
