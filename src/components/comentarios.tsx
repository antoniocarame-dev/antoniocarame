"use client";
import { useState } from "react";
import { StickyNote } from "lucide-react";
import { Dialogo } from "@/components/ui/dialog";
import { FormAccion } from "@/components/form-accion";
import { Button } from "@/components/ui/button";
import type { Res } from "@/app/acciones/comun";

export type Comentario = { id: string; texto: string; autor: string; fecha: string };

/** Notas internas sobre una tarea, acción o documento. No salen en los informes. */
export function Comentarios({ titulo, lista, accion }: { titulo: string; lista: Comentario[]; accion: (fd: FormData) => Promise<Res> }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialogo open={open} onOpenChange={setOpen} titulo={titulo} descripcion="Notas internas. No aparecen en los informes."
      trigger={<Button variant="ghost" size="sm" aria-label={`${lista.length} notas`}><StickyNote />{lista.length || ""}</Button>}>
      <ul className="mb-4 grid max-h-80 gap-3 overflow-y-auto">
        {lista.map((c) => (
          <li key={c.id} className="rounded-sm bg-muted p-3 text-sm">
            <p className="mb-1 text-xs text-muted-foreground">{c.fecha}</p>
            <p className="whitespace-pre-wrap">{c.texto}</p>
          </li>
        ))}
        {!lista.length && <li className="text-sm text-muted-foreground">Sin notas.</li>}
      </ul>
      <FormAccion action={accion}>
        <textarea name="texto" required aria-label="Nota" placeholder="Escribe una nota" className="min-h-20 w-full rounded-sm border border-input bg-card p-2 text-sm" />
        <div className="mt-2 flex justify-end"><Button type="submit" size="sm">Guardar nota</Button></div>
      </FormAccion>
    </Dialogo>
  );
}
