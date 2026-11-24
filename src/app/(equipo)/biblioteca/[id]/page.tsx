import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { EditorPlantilla } from "@/components/editor-plantilla";
import { requiereEquipo } from "@/lib/sesion";
import { contenidoAuditoria } from "@/lib/utils";

const NOMBRE = { auditoria: "auditoría", sop: "procedimiento", checklist: "checklist", informe: "informe" } as const;

export default async function Plantilla({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tipo?: string }> }) {
  const { id } = await params;
  const { tipo: t } = await searchParams;
  const { supabase } = await requiereEquipo();
  if (id === "nueva") {
    const tipo = (["auditoria", "sop", "checklist"].includes(t ?? "") ? t : "auditoria") as "auditoria";
    return (<><Cabecera eyebrow="Biblioteca" titulo={`Nueva plantilla de ${NOMBRE[tipo]}`}><Button asChild variant="outline"><Link href="/biblioteca">Volver</Link></Button></Cabecera>
      <EditorPlantilla id={null} tipo={tipo} inicial={{ nombre: "", area: null, descripcion: null, contenido: { secciones: [] }, activa: true }} /></>);
  }
  const { data: p } = await supabase.from("plantillas").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  return (
    <>
      <Cabecera eyebrow={`Biblioteca · ${NOMBRE[p.tipo]} · versión ${p.version}`} titulo={p.nombre}
        sub={p.tipo === "auditoria" ? "Puntos de control valorados de 0 a 4. Escribe criterios que se puedan comprobar en el local." : p.tipo === "sop" ? "Cada sección es una fase del proceso y cada línea un paso." : "Cada línea es algo que se marca hecho o no hecho."}>
        <Button asChild variant="outline"><Link href="/biblioteca">Volver</Link></Button>
      </Cabecera>
      <EditorPlantilla key={p.updated_at} id={p.id} tipo={p.tipo} inicial={{ nombre: p.nombre, area: p.area, descripcion: p.descripcion, contenido: contenidoAuditoria(p.contenido), activa: p.activa }} />
    </>
  );
}
