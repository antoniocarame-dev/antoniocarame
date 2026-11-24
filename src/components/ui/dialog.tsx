"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialogo({ trigger, titulo, descripcion, children, open, onOpenChange, ancho = "max-w-xl" }: {
  trigger?: React.ReactNode; titulo: string; descripcion?: string; children: React.ReactNode;
  open?: boolean; onOpenChange?: (v: boolean) => void; ancho?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <D.Content className={cn("fixed left-1/2 top-[6vh] z-50 max-h-[88vh] w-[calc(100%-32px)] -translate-x-1/2 overflow-y-auto rounded-md border bg-card p-5 shadow-2xl", ancho)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <D.Title className="font-mono text-base font-bold">{titulo}</D.Title>
              {descripcion ? <D.Description className="mt-1 text-sm text-muted-foreground">{descripcion}</D.Description> : <D.Description className="sr-only">{titulo}</D.Description>}
            </div>
            <D.Close className="rounded-sm p-1 text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X className="size-4" /></D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
export const CerrarDialogo = D.Close;
