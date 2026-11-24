import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditorEstandar } from "@/components/editor-estandar";
import { negocioDeProyecto } from "@/lib/negocio";
import { contenidoAuditoria } from "@/lib/utils";

export default async function Estandar({ params }: { params: Promise<{ id: string; estandar: string }> }) {
  const { id, estandar } = await params;
  const { supabase, negocio } = await negocioDeProyecto(id);
  const [{ data: e }, { data: contactos }] = await Promise.all([
    supabase.from("estandares").select("*").eq("id", estandar).eq("proyecto_id", id).maybeSingle(),
    supabase.from("contactos").select("nombre").eq("negocio_id", negocio.id),
  ]);
  if (!e) notFound();
  const volver = `/proyectos/${id}/estandares`;
  return (
    <div>
      <Link href={volver} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Estándares</Link>
      <h2 className="mb-4 font-mono text-lg font-bold">{e.titulo} <span className="text-sm font-normal text-muted-foreground">v{e.version}</span></h2>
      <EditorEstandar key={e.updated_at} proyectoId={id} id={e.id} version={e.version} volver={volver} contactos={(contactos ?? []).map((c) => c.nombre)}
        inicial={{ tipo: e.tipo, titulo: e.titulo, area: e.area, estado: e.estado, responsable_externo: e.responsable_externo, fecha_implantacion: e.fecha_implantacion, visible_cliente: e.visible_cliente, contenido: contenidoAuditoria(e.contenido) }} />
    </div>
  );
}
