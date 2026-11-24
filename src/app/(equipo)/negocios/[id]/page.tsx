import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { CamposNegocio } from "@/components/negocio-campos";
import { EstadoProyecto, Semaforo } from "@/components/piezas";
import { Documentos } from "@/components/documentos";
import { requiereEquipo } from "@/lib/sesion";
import { cargarDocs } from "@/lib/docs";
import { actualizarNegocio, crearContacto, borrarContacto } from "@/app/acciones/negocios";
import { TIPOS_NEGOCIO, TIPOS_PROYECTO, eur, fecha, numero } from "@/lib/utils";

export default async function Negocio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requiereEquipo();
  const [{ data: n }, { data: contactos }, { data: proyectos }, docs] = await Promise.all([
    s.supabase.from("negocios").select("*").eq("id", id).maybeSingle(),
    s.supabase.from("contactos").select("*").eq("negocio_id", id).order("principal", { ascending: false }),
    s.supabase.from("proyectos").select("*").eq("negocio_id", id).order("fecha_inicio", { ascending: false }),
    cargarDocs(s, { negocio_id: id }),
  ]);
  if (!n) notFound();
  const datos: [string, string][] = [
    ["Tipo", TIPOS_NEGOCIO[n.tipo]], ["Dirección", [n.direccion, n.localidad, n.provincia].filter(Boolean).join(", ") || "—"],
    ["Horarios", n.horarios ?? "—"], ["Aforo", n.aforo != null ? `${n.aforo} plazas` : "—"], ["Plantilla", n.plantilla != null ? `${n.plantilla} personas` : "—"],
    ["Ticket medio", n.ticket_medio ? eur(Number(n.ticket_medio), 2) : "—"], ["Food cost objetivo", `${numero(Number(n.food_cost_objetivo) * 100)} %`],
  ];
  return (
    <>
      <Cabecera eyebrow={n.grupo ? `Grupo ${n.grupo}` : "Negocio"} titulo={n.nombre} sub={n.notas ?? undefined}>
        <Button asChild variant="outline"><Link href="/negocios">Volver</Link></Button>
        <DialogoForm titulo="Editar negocio" ancho="max-w-2xl" trigger={<Button><Pencil />Editar ficha</Button>} action={async (fd) => { "use server"; return actualizarNegocio(id, fd); }}><CamposNegocio n={n} /></DialogoForm>
      </Cabecera>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="grid content-start gap-4">
          <Card className="ticket-edge rounded-sm">
            <p className="eyebrow mb-3">Ficha del local</p>
            <dl className="grid gap-2 text-sm">{datos.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
              <DialogoForm titulo="Nuevo contacto" trigger={<Button variant="outline" size="sm"><Plus />Contacto</Button>} action={async (fd) => { "use server"; return crearContacto(id, fd); }}>
                <Campo label="Nombre"><Input name="nombre" required /></Campo>
                <Campo label="Cargo"><Input name="cargo" /></Campo>
                <Campo label="Correo"><Input name="email" type="email" /></Campo>
                <Campo label="Teléfono"><Input name="telefono" type="tel" /></Campo>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="principal" className="size-4" />Contacto principal</label>
              </DialogoForm>
            </CardHeader>
            <ul className="divide-y text-sm">
              {contactos?.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{c.nombre} {c.principal && <Badge tono="primary">Principal</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{c.cargo}</p>
                    <p className="select-all break-all text-xs">{[c.email, c.telefono].filter(Boolean).join(" · ")}</p>
                  </div>
                  <BotonAccion size="icon" variant="ghost" confirmar="¿Borrar?" title="Borrar contacto" accion={async () => { "use server"; return borrarContacto(id, c.id); }}><Trash2 /></BotonAccion>
                </li>
              ))}
              {!contactos?.length && <li className="py-2 text-muted-foreground">Sin contactos.</li>}
            </ul>
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader><CardTitle>Historial de proyectos</CardTitle></CardHeader>
            <ul className="divide-y text-sm">
              {proyectos?.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0"><Link href={`/proyectos/${p.id}`} className="font-medium hover:text-primary-ink">{p.titulo}</Link><p className="text-xs text-muted-foreground">{TIPOS_PROYECTO[p.tipo] ?? p.tipo} · {fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)}</p></div>
                  <span className="flex gap-1"><EstadoProyecto estado={p.estado} /><Semaforo salud={p.salud} texto={false} /></span>
                </li>
              ))}
              {!proyectos?.length && <li className="py-2 text-muted-foreground">Sin proyectos todavía.</li>}
            </ul>
          </Card>
          <div>
            <h2 className="mb-3 font-mono text-base font-bold">Documentación general</h2>
            <Documentos ambito={{ negocio_id: id }} docs={docs.docs} carpetas={docs.carpetas} editar esCliente={false} />
          </div>
        </div>
      </div>
    </>
  );
}
