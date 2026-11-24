"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Dialogo } from "@/components/ui/dialog";
import { FormAccion } from "@/components/form-accion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Res } from "@/app/acciones/comun";

export type Comentario = { id: string; texto: string; autor: string; fecha: string; interno: boolean };

export function Comentarios({ titulo, lista, accion, permitirInterno }: {
  titulo: string; lista: Comentario[]; accion: (fd: FormData) => Promise<Res>; permitirInterno: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialogo open={open} onOpenChange={setOpen} titulo={titulo} descripcion="Comentarios del equipo y del cliente."
      trigger={<Button variant="ghost" size="sm" aria-label={`${lista.length} comentarios`}><MessageSquare />{lista.length || ""}</Button>}>
      <ul className="mb-4 grid max-h-80 gap-3 overflow-y-auto">
        {lista.map((c) => (
          <li key={c.id} className="rounded-sm bg-muted p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><b className="text-foreground">{c.autor}</b>{c.fecha}{c.interno && <Badge tono="warn">Interno</Badge>}</p>
            <p className="whitespace-pre-wrap">{c.texto}</p>
          </li>
        ))}
        {!lista.length && <li className="text-sm text-muted-foreground">Aún no hay comentarios.</li>}
      </ul>
      <FormAccion action={accion}>
        <textarea name="texto" required aria-label="Comentario" placeholder="Escribe un comentario" className="min-h-20 w-full rounded-sm border border-input bg-card p-2 text-sm" />
        <div className="mt-2 flex items-center justify-between gap-2">
          {permitirInterno ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="interno" className="size-4" />Solo equipo (el cliente no lo ve)</label> : <span />}
          <Button type="submit" size="sm">Comentar</Button>
        </div>
      </FormAccion>
    </Dialogo>
  );
}
