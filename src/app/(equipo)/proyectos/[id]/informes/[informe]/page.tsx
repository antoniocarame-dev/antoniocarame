import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Textarea } from "@/components/ui/form";
import { FormAccion } from "@/components/form-accion";
import { BotonAccion } from "@/components/boton-accion";
import { getSesion } from "@/lib/sesion";
import { SECCIONES_INFORME } from "@/lib/informes";
import { guardarInforme, marcarEnviado, borrarInforme } from "@/app/acciones/informes";
import { fecha } from "@/lib/utils";
import { EnviarInforme, RedactarIA } from "@/components/informes/acciones-informe";

export const maxDuration = 60;

export default async function EditarInforme({ params }: { params: Promise<{ id: string; informe: string }> }) {
  const { id, informe } = await params;
  const { supabase } = await getSesion();
  const [{ data: i }, { data: p }] = await Promise.all([
    supabase.from("informes").select("*").eq("id", informe).eq("proyecto_id", id).maybeSingle(),
    supabase.from("proyectos").select("negocio_id").eq("id", id).single(),
  ]);
  if (!i) notFound();
  const { data: contactos } = await supabase.from("contactos").select("nombre, email, principal").eq("negocio_id", p!.negocio_id).order("principal", { ascending: false });
  const destino = contactos?.find((c) => c.email);
  const textoCuerpo = `Hola ${destino?.nombre?.split(" ")[0] ?? ""}:\n\nTe adjunto ${i.titulo.charAt(0).toLowerCase() + i.titulo.slice(1)}.\n\nUn saludo.`;

  return (
    <div className="grid max-w-4xl gap-4">
      <Link href={`/proyectos/${id}/informes`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Informes</Link>
      <RedactarIA proyectoId={id} informeId={informe} hayTexto={!!(i.introduccion || i.conclusiones || i.proximos_pasos)} />
      <FormAccion key={i.updated_at} reset={false} action={async (fd) => { "use server"; return guardarInforme(id, informe, fd); }}>
        <div className="grid gap-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Título" className="sm:col-span-3"><Input name="titulo" required defaultValue={i.titulo} /></Campo>
              <Campo label="Periodo desde"><Input name="periodo_desde" type="date" defaultValue={i.periodo_desde ?? ""} /></Campo>
              <Campo label="Periodo hasta"><Input name="periodo_hasta" type="date" defaultValue={i.periodo_hasta ?? ""} /></Campo>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Secciones</CardTitle><span className="text-xs text-muted-foreground">Solo salen hallazgos, acciones, KPIs y actas marcados «incluir en los informes»</span></CardHeader>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(SECCIONES_INFORME).map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="secciones" value={k} defaultChecked={i.secciones.includes(k)} className="size-4" />{l}</label>)}
            </div>
          </Card>
          <Card className="grid gap-3">
            <Campo label="Introducción" ayuda="Qué se ha hecho en el periodo, en dos o tres frases"><Textarea name="introduccion" className="min-h-24" defaultValue={i.introduccion ?? ""} /></Campo>
            <Campo label="Conclusiones" ayuda="Lo que dicen los números y por qué"><Textarea name="conclusiones" className="min-h-28" defaultValue={i.conclusiones ?? ""} /></Campo>
            <Campo label="Próximos pasos"><Textarea name="proximos_pasos" className="min-h-24" defaultValue={i.proximos_pasos ?? ""} /></Campo>
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BotonAccion variant="destructive" size="default" confirmar="¿Borrar el informe?" accion={async () => { "use server"; const r = await borrarInforme(id, informe); if (r.ok) redirect(`/proyectos/${id}/informes`); return r; }}>Borrar</BotonAccion>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><a href={`/informe/${informe}`} target="_blank" rel="noreferrer"><ExternalLink />Vista web</a></Button>
              <Button type="submit">Guardar</Button>
            </div>
          </div>
        </div>
      </FormAccion>
      <Card>
        <CardHeader><CardTitle>Envío</CardTitle>{i.estado === "enviado" ? <Badge tono="ok">Enviado el {fecha(i.enviado_at)}{i.enviado_a ? ` a ${i.enviado_a}` : ""}</Badge> : <Badge tono="warn">Sin enviar</Badge>}</CardHeader>
        <p className="mb-3 text-sm text-muted-foreground">Guarda los cambios antes de enviar. En el móvil, «Enviar por correo» abre Correo (o WhatsApp) con el PDF ya adjunto{destino ? <>; escribe a <b>{destino.nombre}</b> ({destino.email})</> : ""}. En el ordenador, descarga el PDF y abre un correo nuevo para adjuntarlo.</p>
        <div className="mb-4"><EnviarInforme informeId={informe} email={destino?.email ?? null} asunto={i.titulo} cuerpo={textoCuerpo} /></div>
        <BotonAccion variant={i.estado === "enviado" ? "outline" : "default"} size="default" accion={async () => { "use server"; return marcarEnviado(id, informe, i.estado !== "enviado", destino?.email ?? null); }}>
          {i.estado === "enviado" ? "Volver a borrador" : "Marcar como enviado"}
        </BotonAccion>
      </Card>
    </div>
  );
}
