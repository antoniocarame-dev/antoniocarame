"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subirArchivo, comprimirFoto } from "@/components/subida";
import { importarReceta } from "@/app/acciones/costes";

/** Sube una receta (foto o PDF), la lee y abre el escandallo creado para revisarlo. */
export function SubirReceta({ negocioId, proyectoId }: { negocioId: string; proyectoId: string }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [estado, setEstado] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <Button asChild variant="outline" size="sm" disabled={pend}>
        <label className="cursor-pointer"><ScanText />{pend ? estado : "Subir receta"}
          <input type="file" accept="application/pdf,image/*" className="sr-only" disabled={pend} onChange={(e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            setError(null);
            start(async () => {
              try {
                setEstado("Subiendo…");
                const archivo = f.type.startsWith("image/") ? await comprimirFoto(f, 2200) : f;
                const ruta = await subirArchivo(`negocios/${negocioId}/recetas`, archivo);
                setEstado("Leyendo la receta…");
                const r = await importarReceta(negocioId, ruta, archivo.type);
                if (!r.ok || !r.id) { setError(r.error ?? "No se ha podido leer."); return; }
                router.push(`/proyectos/${proyectoId}/escandallos/${r.id}${r.aviso ? `?aviso=${encodeURIComponent(r.aviso)}` : ""}`);
              } catch (er) { setError((er as Error).message); }
            });
          }} />
        </label>
      </Button>
      {error && <span role="alert" className="mt-1 max-w-72 text-right text-xs text-bad">{error}</span>}
    </span>
  );
}
