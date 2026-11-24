"use client";
import { useRef, useState, useTransition } from "react";
import type { Res } from "@/app/acciones/comun";
import { cn } from "@/lib/utils";

/** Formulario que llama a una server action y muestra el error en español. */
export function FormAccion({ action, children, className, onOk, reset = true }: {
  action: (fd: FormData) => Promise<Res>; children: React.ReactNode; className?: string;
  onOk?: (r: Res) => void; reset?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pend, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={cn(className, pend && "opacity-70")}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          if (!r.ok) { setError(r.error ?? "No se ha podido guardar."); return; }
          setError(null);
          if (reset) ref.current?.reset();
          onOk?.(r);
        });
      }}
    >
      <fieldset disabled={pend} className="contents">{children}</fieldset>
      {error && <p role="alert" className="mt-3 rounded-sm bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
    </form>
  );
}
