"use client";
import { useState } from "react";
import { Dialogo } from "@/components/ui/dialog";
import { FormAccion } from "@/components/form-accion";
import { Button } from "@/components/ui/button";
import type { Res } from "@/app/acciones/comun";

/** Diálogo con formulario que se cierra al guardar bien. */
export function DialogoForm({ trigger, titulo, descripcion, action, children, boton = "Guardar", ancho, onOk }: {
  trigger: React.ReactNode; titulo: string; descripcion?: string; action: (fd: FormData) => Promise<Res>;
  children: React.ReactNode; boton?: string; ancho?: string; onOk?: (r: Res) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialogo open={open} onOpenChange={setOpen} trigger={trigger} titulo={titulo} descripcion={descripcion} ancho={ancho}>
      <FormAccion action={action} onOk={(r) => { setOpen(false); onOk?.(r); }}>
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit">{boton}</Button>
        </div>
      </FormAccion>
    </Dialogo>
  );
}
