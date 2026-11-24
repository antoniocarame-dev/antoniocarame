import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Select } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { Vacio } from "@/components/ui/vacio";
import { getSesion } from "@/lib/sesion";
import { crearInforme } from "@/app/acciones/informes";
import { fecha, hoyISO } from "@/lib/utils";
import { redirect } from "next/navigation";

const TIPO = { diagnostico: "Diagnóstico", seguimiento: "Seguimiento mensual", cierre: "Cierre" } as const;

export default async function Informes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSesion();
  const { data: informes } = await supabase.from("informes").select("*").eq("proyecto_id", id).order("created_at", { ascending: false });
  const hoy = hoyISO();
  const iniMes = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10);
  const finMes = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[70ch] text-sm text-muted-foreground">El informe toma los datos del proyecto en el momento de abrirlo. Escribe la introducción y las conclusiones, elige qué secciones salen y guárdalo como PDF desde la vista de impresión.</p>
        <DialogoForm titulo="Nuevo informe" trigger={<Button size="sm"><Plus />Informe</Button>} boton="Crear y editar"
          action={async (fd) => { "use server"; const r = await crearInforme(id, fd); if (r.ok) redirect(`/proyectos/${id}/informes/${r.id}`); return r; }}>
          <Campo label="Tipo"><Select name="tipo" defaultValue="seguimiento" opciones={Object.entries(TIPO)} /></Campo>
          <Campo label="Título"><Input name="titulo" required defaultValue={`Informe de seguimiento · ${new Date(iniMes + "T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`} /></Campo>
          <Campo label="Periodo desde"><Input name="periodo_desde" type="date" defaultValue={iniMes} /></Campo>
          <Campo label="Periodo hasta"><Input name="periodo_hasta" type="date" defaultValue={finMes > hoy ? hoy : finMes} /></Campo>
        </DialogoForm>
      </div>
      {informes?.length ? (
        <Card className="p-0"><ul className="divide-y">
          {informes.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <FileText className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1"><Link href={`/proyectos/${id}/informes/${i.id}`} className="font-medium hover:text-primary-ink">{i.titulo}</Link>
                <p className="text-xs text-muted-foreground">{TIPO[i.tipo]} · {fecha(i.periodo_desde)} – {fecha(i.periodo_hasta)}{i.enviado_a ? ` · enviado a ${i.enviado_a}` : ""}</p></div>
              <Badge tono={i.estado === "enviado" ? "ok" : "warn"}>{i.estado === "enviado" ? `Enviado ${fecha(i.enviado_at, { day: "numeric", month: "short" })}` : "Borrador"}</Badge>
              <Button asChild variant="outline" size="sm"><a href={`/informe/${i.id}`} target="_blank" rel="noreferrer">Ver e imprimir</a></Button>
            </li>
          ))}
        </ul></Card>
      ) : <Vacio titulo="Sin informes">Prepara el informe de diagnóstico al terminar la primera fase y uno de seguimiento cada mes.</Vacio>}
    </div>
  );
}
