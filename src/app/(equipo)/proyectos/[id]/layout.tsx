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
  { href: "/estandares", label: "Estándares y formación" },
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
        sub={<span className="mt-1 inline-flex flex-wrap items-center gap-2">{TIPOS_PROYECTO[p.tipo] ?? p.tipo}<EstadoProyecto estado={p.estado} /><Semaforo salud={p.salud} /></span>}>
        <a href={`/imprimir/resumen/${id}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-input bg-card px-3.5 text-sm font-medium hover:border-primary hover:text-primary-ink">Resumen para el cliente</a>
      </Cabecera>
      <Pestanas base={`/proyectos/${id}`} items={[...PESTANAS,
        { href: "/costes", label: "Costes y compras" }, { href: "/escandallos", label: "Escandallos y menú" }, { href: "/inventario", label: "Inventario y mermas" },
        { href: "/resultados", label: "Ventas y resultados" }, { href: "/informes", label: "Informes" }]} />
      {children}
    </>
  );
}
