import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Campo, Input, Textarea } from "@/components/ui/form";
import { DialogoForm } from "@/components/dialogo-form";
import { BotonAccion } from "@/components/boton-accion";
import { Vacio } from "@/components/ui/vacio";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import { crearActa, borrarActa } from "@/app/acciones/varios";
import { fecha, hoyISO } from "@/lib/utils";

type Acuerdo = { texto: string; responsable?: string; hecho?: boolean };

export default async function Actas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const { data: actas } = await supabase.from("actas").select("*").eq("proyecto_id", id).order("fecha", { ascending: false });
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Lo hablado en cada reunión y quién se compromete a qué.</p>
        {editar && (
          <DialogoForm titulo="Nueva acta" ancho="max-w-2xl" trigger={<Button size="sm"><Plus />Acta de reunión</Button>} action={async (fd) => { "use server"; return crearActa(id, fd); }}>
            <Campo label="Reunión"><Input name="titulo" required placeholder="Revisión mensual de noviembre" /></Campo>
            <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
            <Campo label="Asistentes" className="sm:col-span-2"><Input name="asistentes" /></Campo>
            <Campo label="Resumen" className="sm:col-span-2"><Textarea name="contenido" className="min-h-28" /></Campo>
            <Campo label="Acuerdos" className="sm:col-span-2" ayuda="Uno por línea. Opcional: «Acuerdo | Responsable»."><Textarea name="acuerdos" placeholder={"Ajustar producción del domingo | Rocío\nPedir presupuesto de freidora | Manolo"} /></Campo>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="crear_tareas" defaultChecked className="size-4" />Convertir acuerdos en tareas</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible_cliente" defaultChecked className="size-4" />Incluir en los informes</label>
          </DialogoForm>
        )}
      </div>
      {actas?.map((a) => (
        <Card key={a.id} className="ticket-edge rounded-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="eyebrow">{fecha(a.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><h2 className="mt-1 font-mono text-base font-bold">{a.titulo}</h2>{a.asistentes && <p className="text-sm text-muted-foreground">Asisten: {a.asistentes}</p>}</div>
            <div className="flex items-center gap-1">{!a.visible_cliente && <Badge>Fuera de informes</Badge>}{editar && <BotonAccion variant="ghost" size="icon" confirmar="¿Borrar?" title="Borrar acta" accion={async () => { "use server"; return borrarActa(id, a.id); }}><Trash2 /></BotonAccion>}</div>
          </div>
          {a.contenido && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{a.contenido}</p>}
          {Array.isArray(a.acuerdos) && a.acuerdos.length > 0 && (
            <div className="mt-4 border-t border-dashed pt-3">
              <p className="eyebrow mb-2">Acuerdos</p>
              <ul className="grid gap-1 text-sm">{(a.acuerdos as Acuerdo[]).map((c, i) => <li key={i} className="flex justify-between gap-3"><span>· {c.texto}</span>{c.responsable && <span className="text-muted-foreground">{c.responsable}</span>}</li>)}</ul>
            </div>
          )}
        </Card>
      ))}
      {!actas?.length && <Vacio titulo="Sin actas">Registra cada reunión con el cliente para no perder los acuerdos.</Vacio>}
    </div>
  );
}
