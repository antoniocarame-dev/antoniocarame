"use client";
import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Dialogo } from "@/components/ui/dialog";
import { FormAccion } from "@/components/form-accion";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { AREAS, DAFO, MUDAS, opciones } from "@/lib/utils";
import { guardarHallazgo } from "@/app/acciones/diagnostico";
import { subirArchivo, comprimirFoto } from "@/components/subida";
import type { Tabla } from "@/lib/utils";

type H = Partial<Tabla<"hallazgos">>;

export function HallazgoDialogo({ proyectoId, hallazgo, trigger, titulo = "Nuevo hallazgo", fotosUrls = {} }: {
  proyectoId: string; hallazgo?: H; trigger: React.ReactNode; titulo?: string; fotosUrls?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState(hallazgo?.tipo ?? "muda");
  const [fotos, setFotos] = useState<string[]>(hallazgo?.fotos ?? []);
  const [previas, setPrevias] = useState<Record<string, string>>(fotosUrls);
  const [subiendo, setSubiendo] = useState(false);
  const [errFoto, setErrFoto] = useState<string | null>(null);

  return (
    <Dialogo open={open} onOpenChange={setOpen} trigger={trigger} titulo={titulo} ancho="max-w-2xl"
      descripcion="Lo que has visto en el local. Valora impacto y esfuerzo para priorizarlo.">
      <FormAccion action={(fd) => guardarHallazgo(proyectoId, hallazgo?.id ?? null, fd)} onOk={() => setOpen(false)} reset={!hallazgo?.id}>
        <input type="hidden" name="auditoria_id" value={hallazgo?.auditoria_id ?? ""} />
        {fotos.map((f) => <input key={f} type="hidden" name="fotos" value={f} />)}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Qué has encontrado" className="sm:col-span-2"><Input name="titulo" required defaultValue={hallazgo?.titulo ?? ""} /></Campo>
          <Campo label="Tipo">
            <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}
              opciones={[["muda", "Despilfarro (muda)"], ["dafo", "DAFO"], ["observacion", "Observación"]]} />
          </Campo>
          {tipo === "muda" && <Campo label="Despilfarro"><Select name="muda" defaultValue={hallazgo?.muda ?? ""} vacio="Elige" opciones={opciones(MUDAS)} /></Campo>}
          {tipo === "dafo" && <Campo label="Cuadrante"><Select name="dafo" defaultValue={hallazgo?.dafo ?? ""} vacio="Elige" opciones={opciones(DAFO)} /></Campo>}
          {tipo === "observacion" && <span className="hidden sm:block" />}
          <Campo label="Área"><Select name="area" defaultValue={hallazgo?.area ?? ""} vacio="Sin área" opciones={opciones(AREAS)} /></Campo>
          <Campo label="Coste estimado (€/mes)" ayuda="Si puedes cuantificar lo que se pierde"><Input name="coste_estimado" type="number" step="1" min="0" defaultValue={hallazgo?.coste_estimado ?? ""} /></Campo>
          <Campo label="Impacto (1 bajo · 5 alto)"><Select name="impacto" defaultValue={String(hallazgo?.impacto ?? 3)} opciones={["1", "2", "3", "4", "5"].map((v) => [v, v])} /></Campo>
          <Campo label="Esfuerzo para resolverlo (1 · 5)"><Select name="esfuerzo" defaultValue={String(hallazgo?.esfuerzo ?? 3)} opciones={["1", "2", "3", "4", "5"].map((v) => [v, v])} /></Campo>
          <Campo label="Notas" className="sm:col-span-2"><Textarea name="descripcion" defaultValue={hallazgo?.descripcion ?? ""} /></Campo>
          <div className="sm:col-span-2">
            <p className="mb-1 text-[12.5px] font-medium text-muted-foreground">Fotos</p>
            <div className="flex flex-wrap gap-2">
              {fotos.map((f) => (
                <div key={f} className="relative size-20 overflow-hidden rounded-sm border bg-muted">
                  {previas[f] && <img src={previas[f]} alt="" className="size-full object-cover" />}
                  <button type="button" onClick={() => setFotos(fotos.filter((x) => x !== f))} aria-label="Quitar foto"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="size-3" /></button>
                </div>
              ))}
              <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-input text-xs text-muted-foreground hover:border-primary">
                <Camera className="size-5" />{subiendo ? "Subiendo…" : "Añadir"}
                <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={subiendo}
                  onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setSubiendo(true); setErrFoto(null);
                    try {
                      const c = await comprimirFoto(f);
                      const ruta = await subirArchivo(`proyectos/${proyectoId}/hallazgos`, c);
                      setFotos((x) => [...x, ruta]); setPrevias((x) => ({ ...x, [ruta]: URL.createObjectURL(c) }));
                    } catch (er) { setErrFoto((er as Error).message); }
                    setSubiendo(false); e.target.value = "";
                  }} />
              </label>
            </div>
            {errFoto && <p className="mt-1 text-xs text-bad">{errFoto}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="visible_cliente" defaultChecked={hallazgo?.visible_cliente ?? true} className="size-4 accent-[var(--primary)]" />
            Visible para el cliente en su portal
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" disabled={subiendo}>Guardar</Button>
        </div>
      </FormAccion>
    </Dialogo>
  );
}
