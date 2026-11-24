import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RevisarFactura } from "@/components/costes/revisar-factura";
import { negocioDeProyecto } from "@/lib/negocio";

export default async function Factura({ params, searchParams }: { params: Promise<{ id: string; factura: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { id, factura } = await params;
  const { aviso } = await searchParams;
  const { supabase, negocio } = await negocioDeProyecto(id);
  const [{ data: f }, { data: lineas }, { data: productos }, { data: proveedores }] = await Promise.all([
    supabase.from("facturas").select("*").eq("id", factura).eq("negocio_id", negocio.id).maybeSingle(),
    supabase.from("lineas_factura").select("*").eq("factura_id", factura).order("orden"),
    supabase.from("v_productos_precio").select("id, nombre, unidad, precio_actual").eq("negocio_id", negocio.id).eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, nombre").order("nombre"),
  ]);
  if (!f) notFound();
  const { data: firmado } = f.archivo_path ? await supabase.storage.from("documentos").createSignedUrl(f.archivo_path, 3600) : { data: null };
  const esPdf = f.archivo_path?.endsWith(".pdf");
  const volver = `/proyectos/${id}/costes?v=facturas`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={volver} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Facturas</Link>
        <Badge tono={f.estado === "validada" ? "ok" : "warn"}>{f.estado === "validada" ? "Validada" : "Por revisar"}</Badge>
      </div>
      {aviso && <p role="status" className="mb-4 rounded-sm bg-warn-soft px-3 py-2 text-sm text-warn">{aviso}</p>}
      <div className={firmado ? "grid gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}>
        {firmado && (
          <div className="min-w-0 rounded-md border bg-card p-2 2xl:sticky 2xl:top-20 2xl:self-start">
            {esPdf
              ? <iframe src={firmado.signedUrl} title="Documento original" className="h-[70vh] w-full rounded-sm" />
              : <img src={firmado.signedUrl} alt="Documento original" className="max-h-[75vh] w-full rounded-sm object-contain" />}
            <a href={firmado.signedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary-ink hover:underline">Abrir el original en otra pestaña</a>
          </div>
        )}
        <RevisarFactura facturaId={f.id} negocioId={negocio.id} volver={volver} validada={f.estado === "validada"}
          cabecera={{ proveedor_id: f.proveedor_id, tipo: f.tipo, numero: f.numero, fecha: f.fecha, base: f.base == null ? null : Number(f.base), iva: f.iva == null ? null : Number(f.iva), total: f.total == null ? null : Number(f.total), notas: f.notas }}
          lineas={(lineas ?? []).map((l) => ({ producto_id: l.producto_id, descripcion: l.descripcion, cantidad: Number(l.cantidad), unidad: l.unidad, precio_unitario: Number(l.precio_unitario), descuento_pct: Number(l.descuento_pct), iva_pct: l.iva_pct == null ? null : Number(l.iva_pct) }))}
          productos={(productos ?? []).map((p) => ({ id: p.id!, nombre: p.nombre!, unidad: p.unidad!, precio_actual: p.precio_actual == null ? null : Number(p.precio_actual) }))}
          proveedores={proveedores ?? []} />
      </div>
    </div>
  );
}
