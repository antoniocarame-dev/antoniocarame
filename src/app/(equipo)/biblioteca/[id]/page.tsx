import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { EditorPlantilla } from "@/components/editor-plantilla";
import { requiereEquipo } from "@/lib/sesion";
import { contenidoAuditoria } from "@/lib/utils";

export default async function Plantilla({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requiereEquipo();
  if (id === "nueva") {
    return (<><Cabecera eyebrow="Biblioteca" titulo="Nueva plantilla de auditoría"><Button asChild variant="outline"><Link href="/biblioteca">Volver</Link></Button></Cabecera>
      <EditorPlantilla id={null} inicial={{ nombre: "", area: null, descripcion: null, contenido: { secciones: [] }, activa: true }} /></>);
  }
  const { data: p } = await supabase.from("plantillas").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  return (
    <>
      <Cabecera eyebrow={`Biblioteca · versión ${p.version}`} titulo={p.nombre} sub="Puntos de control valorados de 0 a 4. Escribe criterios que se puedan comprobar en el local."><Button asChild variant="outline"><Link href="/biblioteca">Volver</Link></Button></Cabecera>
      <EditorPlantilla key={p.updated_at} id={p.id} inicial={{ nombre: p.nombre, area: p.area, descripcion: p.descripcion, contenido: contenidoAuditoria(p.contenido), activa: p.activa }} />
    </>
  );
}
