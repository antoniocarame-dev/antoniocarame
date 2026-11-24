import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectAccion, BotonAccion } from "@/components/boton-accion";
import { EditorPresupuesto } from "@/components/consultora/editor-presupuesto";
import { requiereEquipo } from "@/lib/sesion";
import { conceptosDe, ESTADOS_PRESUPUESTO } from "@/lib/consultora";
import * as A from "@/app/acciones/consultora";
import { fecha } from "@/lib/utils";

export default async function Presupuesto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, esAdmin, perfil } = await requiereEquipo();
  if (!esAdmin) redirect("/panel");
  const [{ data: p }, { data: negocios }, { data: proyectos }] = await Promise.all([
    supabase.from("presupuestos").select("*, negocios(nombre, contactos(nombre, email, principal))").eq("id", id).maybeSingle(),
    supabase.from("negocios").select("id, nombre").order("nombre"),
    supabase.from("proyectos").select("id, titulo, negocio_id").order("titulo"),
  ]);
  if (!p) notFound();
  const destino = p.negocios?.contactos?.find((c) => c.principal && c.email) ?? p.negocios?.contactos?.find((c) => c.email);
  return (
    <div className="max-w-5xl">
      <Link href="/consultora?v=presupuestos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Presupuestos</Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">{p.numero}</p><h1 className="font-mono text-xl font-bold">{p.titulo}</h1>{p.fecha_estado && <p className="text-xs text-muted-foreground">{ESTADOS_PRESUPUESTO[p.estado]} el {fecha(p.fecha_estado)}</p>}</div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectAccion label="Estado" valor={p.estado} opciones={Object.entries(ESTADOS_PRESUPUESTO)} accion={async (v) => { "use server"; return A.estadoPresupuesto(id, v as "borrador"); }} />
          {p.proyecto_id ? <Button asChild variant="outline" size="sm"><Link href={`/proyectos/${p.proyecto_id}`}>Ir al proyecto</Link></Button>
            : <BotonAccion variant="outline" accion={async () => { "use server"; const r = await A.proyectoDesdePresupuesto(id); if (r.ok) redirect(`/proyectos/${r.id}`); return r; }}>Aceptado: crear proyecto</BotonAccion>}
          <Button asChild size="sm"><a href={`/exportar/presupuesto/${id}`} download><Download />Descargar PDF</a></Button>
          {destino?.email && <Button asChild variant="outline" size="sm"><a href={`mailto:${destino.email}?subject=${encodeURIComponent(`Presupuesto ${p.numero} · ${p.titulo}`)}&body=${encodeURIComponent(`Hola ${destino.nombre.split(" ")[0]}:\n\nTe adjunto el presupuesto ${p.numero} para «${p.titulo}».\n\nCualquier duda, me dices.\n\nUn saludo,\n${perfil.nombre}`)}`}><Mail />Enviar por correo</a></Button>}
          <Button asChild variant="ghost" size="sm"><a href={`/imprimir/presupuesto/${id}`} target="_blank" rel="noreferrer"><ExternalLink />Vista previa</a></Button>
          <BotonAccion variant="ghost" confirmar="¿Borrar?" accion={async () => { "use server"; const r = await A.borrarPresupuesto(id); if (r.ok) redirect("/consultora?v=presupuestos"); return r; }}>Borrar</BotonAccion>
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">«Enviar por correo» abre tu programa de correo con el mensaje escrito{destino?.email ? ` para ${destino.email}` : ""}. Adjunta el PDF que descargas con «Descargar PDF».{!destino?.email ? " Para que salga el botón de correo, añade un contacto con email en la ficha del cliente." : ""}</p>
      {p.estado === "aceptado" && !p.proyecto_id && <p className="mb-3"><Badge tono="ok">Aceptado sin proyecto: créalo para empezar a trabajar</Badge></p>}
      <EditorPresupuesto key={p.updated_at} id={id} tarifa={Number(perfil.tarifa_hora ?? 0)}
        negocios={(negocios ?? []).map((n) => [n.id, n.nombre])}
        proyectos={(proyectos ?? []).filter((x) => x.negocio_id === p.negocio_id).map((x) => [x.id, x.titulo])}
        inicial={{ titulo: p.titulo, fecha: p.fecha, validez_dias: p.validez_dias, introduccion: p.introduccion, conceptos: conceptosDe(p.conceptos), iva_pct: Number(p.iva_pct), irpf_pct: Number(p.irpf_pct), condiciones: p.condiciones, notas: p.notas, negocio_id: p.negocio_id, proyecto_id: p.proyecto_id }} />
    </div>
  );
}
