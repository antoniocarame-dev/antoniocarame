"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subirArchivo, comprimirFoto } from "@/components/subida";
import { procesarFactura, crearFacturaManual } from "@/app/acciones/costes";

/** Sube una factura o albarán (PDF o foto), la lee y abre la revisión. */
export function SubirFactura({ negocioId, proyectoId }: { negocioId: string; proyectoId: string }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ir = (id: string, aviso?: string) => router.push(`/proyectos/${proyectoId}/costes/facturas/${id}${aviso ? `?aviso=${encodeURIComponent(aviso)}` : ""}`);

  return (
    <div className="rounded-md border border-dashed border-input bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild disabled={pend}>
          <label className="cursor-pointer">
            <FileUp />{pend ? estado : "Subir factura o albarán"}
            <input type="file" accept="application/pdf,image/*" capture="environment" className="sr-only" disabled={pend}
              onChange={(e) => {
                const f = e.target.files?.[0]; e.target.value = "";
                if (!f) return;
                setError(null);
                start(async () => {
                  try {
                    setEstado("Subiendo…");
                    const archivo = f.type.startsWith("image/") ? await comprimirFoto(f, 2200) : f;
                    const ruta = await subirArchivo(`negocios/${negocioId}/facturas`, archivo);
                    setEstado("Leyendo la factura…");
                    const r = await procesarFactura(negocioId, ruta, archivo.type);
                    if (!r.ok || !r.id) { setError(r.error ?? "No se ha podido registrar."); return; }
                    ir(r.id, r.aviso);
                  } catch (er) { setError((er as Error).message); }
                });
              }} />
          </label>
        </Button>
        <Button variant="outline" disabled={pend} onClick={() => start(async () => { const r = await crearFacturaManual(negocioId); if (r.ok && r.id) ir(r.id); else setError(r.error ?? null); })}>
          <PenLine />Sin archivo, a mano
        </Button>
        <p className="text-xs text-muted-foreground">PDF o foto. Se leen proveedor, fecha, líneas, precios e IVA, y tú revisas antes de que cuenten.</p>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
    </div>
  );
}
