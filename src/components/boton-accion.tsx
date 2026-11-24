"use client";
import { useState, useTransition } from "react";
import type { Res } from "@/app/acciones/comun";
import { Button } from "@/components/ui/button";

/** Botón que ejecuta una acción; con `confirmar` pide un segundo clic antes de ejecutarla. */
export function BotonAccion({ accion, children, confirmar, variant = "outline", size = "sm", className, title }: {
  accion: () => Promise<Res>; children: React.ReactNode; confirmar?: string;
  variant?: "default" | "outline" | "ghost" | "destructive"; size?: "default" | "sm" | "icon"; className?: string; title?: string;
}) {
  const [pend, start] = useTransition();
  const [armado, setArmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start">
      <Button type="button" variant={armado ? "destructive" : variant} size={size} className={className} disabled={pend} title={title}
        onClick={() => {
          if (confirmar && !armado) { setArmado(true); setTimeout(() => setArmado(false), 4000); return; }
          setArmado(false);
          start(async () => { const r = await accion(); setError(r.ok ? null : r.error ?? "Error"); });
        }}>
        {armado ? confirmar : children}
      </Button>
      {error && <span role="alert" className="mt-1 text-xs text-bad">{error}</span>}
    </span>
  );
}

/** Selector que ejecuta una acción al cambiar. */
export function SelectAccion({ valor, opciones, accion, className, label }: {
  valor: string; opciones: [string, string][]; accion: (v: string) => Promise<Res>; className?: string; label: string;
}) {
  const [pend, start] = useTransition();
  const [v, setV] = useState(valor);
  return (
    <select aria-label={label} value={v} disabled={pend}
      className={"h-8 rounded-sm border border-input bg-card px-2 text-[13px] " + (className ?? "")}
      onChange={(e) => { const nv = e.target.value; setV(nv); start(async () => { const r = await accion(nv); if (!r.ok) setV(valor); }); }}>
      {opciones.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}
