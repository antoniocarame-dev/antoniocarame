import { notFound } from "next/navigation";
import { Vacio } from "@/components/ui/vacio";

const PROXIMAS: Record<string, { titulo: string; fase: string; texto: string }> = {
  resultados: { titulo: "Ventas y resultados", fase: "Fase 3", texto: "Importación de ventas, cuenta de resultados mensual, prime cost, RevPASH y comparativa antes/después de la consultoría." },
  informes: { titulo: "Informes", fase: "Fase 3", texto: "Informes en PDF de diagnóstico, seguimiento mensual y cierre con tu logotipo y los KPIs del periodo." },
};

export default async function Proxima({ params }: { params: Promise<{ proxima: string }> }) {
  const { proxima } = await params;
  const m = PROXIMAS[proxima];
  if (!m) notFound();
  return <Vacio titulo={`${m.titulo} · ${m.fase}`}><p className="mx-auto max-w-[60ch]">{m.texto}</p></Vacio>;
}
