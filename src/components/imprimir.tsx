"use client";
import { Printer } from "lucide-react";
export function BotonImprimir() {
  return <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground print:hidden"><Printer className="size-4" />Imprimir o guardar en PDF</button>;
}
