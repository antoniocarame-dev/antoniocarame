import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Campo, Select, Textarea } from "@/components/ui/form";
import { FormAccion } from "@/components/form-accion";
import { BotonAccion } from "@/components/boton-accion";
import { Puntuacion } from "@/components/piezas";
import { Checklist } from "@/components/diagnostico/checklist";
import { HallazgoDialogo } from "@/components/diagnostico/hallazgo-dialogo";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import { cerrarAuditoria, borrarAuditoria } from "@/app/acciones/diagnostico";
import { AREAS, ESCALA, contenidoAuditoria, fecha } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Auditoria({ params }: { params: Promise<{ id: string; auditoria: string }> }) {
  const { id, auditoria } = await params;
  const { supabase } = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const [{ data: a }, { data: resp }] = await Promise.all([
    supabase.from("auditorias").select("*").eq("id", auditoria).eq("proyecto_id", id).maybeSingle(),
    supabase.from("auditoria_respuestas").select("*").eq("auditoria_id", auditoria),
  ]);
  if (!a) notFound();
  const fotos = (resp ?? []).map((r) => r.foto_path).filter(Boolean) as string[];
  const { data: firmadas } = fotos.length ? await supabase.storage.from("documentos").createSignedUrls(fotos, 3600) : { data: [] };
  const urls: Record<string, string> = Object.fromEntries((firmadas ?? []).flatMap((f) => (f.signedUrl && f.path ? [[f.path, f.signedUrl]] : [])));
  const respuestas = Object.fromEntries((resp ?? []).map((r) => [r.item_id, { valor: r.valor, nota: r.nota, foto_path: r.foto_path }]));
  const contenido = contenidoAuditoria(a.contenido);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href={`/proyectos/${id}/diagnostico`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Diagnóstico</Link>
            <h2 className="mt-1 font-mono text-lg font-bold">{a.titulo}</h2>
            <p className="text-sm text-muted-foreground">{AREAS[a.area]} · {fecha(a.fecha)}</p>
          </div>
          <Puntuacion v={a.puntuacion == null ? null : Number(a.puntuacion)} />
        </div>
        <Checklist proyectoId={id} auditoriaId={a.id} contenido={contenido} respuestas={respuestas} fotos={urls} editable={editar} />
      </div>
      <aside className="grid content-start gap-4 lg:sticky lg:top-20">
        <Card>
          <CardHeader><CardTitle>Escala</CardTitle></CardHeader>
          <ol className="grid gap-1 text-sm">{ESCALA.map((e, i) => <li key={e}><span className="tnum mr-2 font-mono font-bold">{i}</span>{e}</li>)}</ol>
          <p className="mt-2 text-xs text-muted-foreground">Deja sin valorar lo que no aplica: no cuenta en la nota.</p>
        </Card>
        {editar && (
          <Card>
            <CardHeader><CardTitle>Cierre</CardTitle></CardHeader>
            <FormAccion reset={false} action={async (fd) => { "use server"; return cerrarAuditoria(id, a.id, fd); }}>
              <div className="grid gap-3">
                <Campo label="Estado"><Select name="estado" defaultValue={a.estado} opciones={[["borrador", "En curso"], ["completada", "Completada"]]} /></Campo>
                <Campo label="Conclusiones"><Textarea name="notas" defaultValue={a.notas ?? ""} /></Campo>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible_cliente" defaultChecked={a.visible_cliente} className="size-4" />Incluir en los informes</label>
                <Button type="submit">Guardar</Button>
              </div>
            </FormAccion>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <HallazgoDialogo proyectoId={id} hallazgo={{ auditoria_id: a.id, area: a.area }} trigger={<Button variant="outline" size="sm"><Plus />Hallazgo</Button>} />
              <BotonAccion confirmar="¿Borrar la auditoría?" variant="destructive" accion={async () => { "use server"; const r = await borrarAuditoria(id, a.id); if (r.ok) redirect(`/proyectos/${id}/diagnostico`); return r; }}>Borrar</BotonAccion>
            </div>
          </Card>
        )}
      </aside>
    </div>
  );
}
