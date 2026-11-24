import { notFound } from "next/navigation";
import { Vacio } from "@/components/ui/vacio";

const PROXIMAS: Record<string, { titulo: string; fase: string; texto: string }> = {
  costes: { titulo: "Costes y compras", fase: "Fase 2", texto: "Subida de facturas y albaranes con lectura automática, proveedores, histórico de precios con alertas de subida y comparativa de proveedores." },
  escandallos: { titulo: "Escandallos e ingeniería de menú", fase: "Fase 2", texto: "Escandallos enlazados al último precio de compra, food cost por plato, PVP recomendado y matriz Estrella / Caballo / Puzzle / Perro." },
  resultados: { titulo: "Ventas y resultados", fase: "Fase 3", texto: "Importación de ventas, cuenta de resultados mensual, prime cost, RevPASH y comparativa antes/después de la consultoría." },
  informes: { titulo: "Informes", fase: "Fase 3", texto: "Informes en PDF de diagnóstico, seguimiento mensual y cierre con tu logotipo y los KPIs del periodo." },
};

export default async function Proxima({ params }: { params: Promise<{ proxima: string }> }) {
  const { proxima } = await params;
  const m = PROXIMAS[proxima];
  if (!m) notFound();
  return <Vacio titulo={`${m.titulo} · ${m.fase}`}><p className="mx-auto max-w-[60ch]">{m.texto}</p></Vacio>;
}
