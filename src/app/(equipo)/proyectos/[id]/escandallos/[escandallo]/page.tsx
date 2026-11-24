import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditorEscandallo } from "@/components/escandallos/editor";
import { cargarEscandallos } from "@/lib/negocio";

export default async function EditarEscandallo({ params, searchParams }: { params: Promise<{ id: string; escandallo: string }>; searchParams: Promise<{ tipo?: string; aviso?: string }> }) {
  const { id, escandallo } = await params;
  const { tipo, aviso } = await searchParams;
  const { negocio, productos, escandallos, calculos, objetivo } = await cargarEscandallos(id);
  const nuevo = escandallo === "nuevo";
  const e = nuevo ? null : escandallos.find((x) => x.id === escandallo);
  if (!nuevo && !e) notFound();
  const esElab = (e?.tipo ?? (tipo === "elaboracion" ? "elaboracion" : "plato")) === "elaboracion";
  const volver = `/proyectos/${id}/escandallos?v=${esElab ? "elaboraciones" : "platos"}`;
  const usadoEn = e ? escandallos.filter((x) => x.ingredientes_escandallo.some((i) => i.sub_escandallo_id === e.id)).map((x) => x.nombre) : [];

  return (
    <div>
      <Link href={volver} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{esElab ? "Elaboraciones" : "Platos"}</Link>
      {aviso && <p role="status" className="mb-3 rounded-sm bg-warn-soft px-3 py-2 text-sm text-warn"><b>Receta leída. Revísala antes de fiarte de ella:</b> {aviso}</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-lg font-bold">{e?.nombre ?? (esElab ? "Nueva elaboración" : "Nuevo plato")}</h2>
        {e && <a href={`/imprimir/escandallo/${e.id}`} target="_blank" rel="noreferrer" className="rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px] font-medium hover:border-primary">Ficha técnica para imprimir</a>}
      </div>
      <EditorEscandallo id={e?.id ?? null} negocioId={negocio.id} objetivo={objetivo} volver={volver} usadoEn={usadoEn}
        inicial={{ tipo: e?.tipo ?? (esElab ? "elaboracion" : "plato"), nombre: e?.nombre ?? "", categoria: e?.categoria ?? null, raciones: Number(e?.raciones ?? 1),
          rendimiento: e?.rendimiento == null ? null : Number(e.rendimiento), unidad_rendimiento: e?.unidad_rendimiento ?? (esElab ? "kg" : null),
          pvp: e?.pvp == null ? null : Number(e.pvp), iva_pct: Number(e?.iva_pct ?? 10), elaboracion: e?.elaboracion ?? null }}
        ingredientes={(e?.ingredientes_escandallo ?? []).sort((a, b) => a.orden - b.orden).map((i) => ({ producto_id: i.producto_id, sub_escandallo_id: i.sub_escandallo_id, cantidad: Number(i.cantidad), merma_pct: i.merma_pct == null ? null : Number(i.merma_pct) }))}
        productos={productos.filter((p) => p.activo).map((p) => ({ id: p.id!, nombre: p.nombre!, unidad: p.unidad!, precio: p.precio_actual == null ? null : Number(p.precio_actual), merma: Number(p.merma_pct ?? 0), alergenos: p.alergenos ?? [] }))}
        elaboraciones={escandallos.filter((x) => x.tipo === "elaboracion" && x.id !== e?.id).map((x) => { const c = calculos.get(x.id)!; return { id: x.id, nombre: x.nombre, unidad: x.unidad_rendimiento ?? "ud", costePorUnidad: c.costePorUnidad ?? c.costeRacion, alergenos: c.alergenos }; })} />
    </div>
  );
}
