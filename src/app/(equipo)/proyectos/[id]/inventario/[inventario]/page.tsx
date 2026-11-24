import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Recuento } from "@/components/inventario/recuento";
import { negocioDeProyecto } from "@/lib/negocio";
import { fecha } from "@/lib/utils";

export default async function Inventario({ params }: { params: Promise<{ id: string; inventario: string }> }) {
  const { id, inventario } = await params;
  const { supabase, negocio } = await negocioDeProyecto(id);
  const [{ data: inv }, { data: lineas }, { data: precios }] = await Promise.all([
    supabase.from("inventarios").select("*").eq("id", inventario).eq("negocio_id", negocio.id).maybeSingle(),
    supabase.from("inventario_lineas").select("*, productos(nombre, familia, unidad)").eq("inventario_id", inventario),
    supabase.from("v_productos_precio").select("id, precio_actual").eq("negocio_id", negocio.id),
  ]);
  if (!inv) notFound();
  const cerrado = inv.estado === "cerrado";
  const precioActual = new Map((precios ?? []).map((p) => [p.id, Number(p.precio_actual ?? 0)]));
  return (
    <div>
      <Link href={`/proyectos/${id}/inventario?v=inventarios`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Inventarios</Link>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-lg font-bold">{inv.nombre}</h2><Badge tono={cerrado ? "ok" : "warn"}>{cerrado ? "Cerrado" : "Contando"}</Badge>
        <span className="text-sm text-muted-foreground">{fecha(inv.fecha)}{cerrado ? " · valorado al precio del cierre" : " · valorado al último precio de compra"}</span>
      </div>
      <Recuento inventarioId={inv.id} cerrado={cerrado}
        lineas={(lineas ?? []).map((l) => ({ producto_id: l.producto_id, nombre: l.productos?.nombre ?? "", familia: l.productos?.familia ?? "Otros", unidad: l.productos?.unidad ?? "kg",
          cantidad: l.cantidad == null ? null : Number(l.cantidad), precio: cerrado && l.precio != null ? Number(l.precio) : precioActual.get(l.producto_id) ?? 0 }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))} />
    </div>
  );
}
