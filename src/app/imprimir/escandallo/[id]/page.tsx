import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { calcularEscandallos, type Escandallo } from "@/lib/costes";
import { eur, numero } from "@/lib/utils";

export const metadata = { title: "Ficha técnica" };

/** Ficha técnica del plato para cocina. Con ?costes=1 añade costes y food cost (para la propiedad). */
export default async function FichaTecnica({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ costes?: string }> }) {
  const { id } = await params;
  const conCostes = (await searchParams).costes === "1";
  const { supabase } = await requiereEquipo();
  const { data: e0 } = await supabase.from("escandallos").select("negocio_id").eq("id", id).maybeSingle();
  if (!e0) notFound();
  const [{ data: neg }, { data: productos }, { data: escs }, { data: org }] = await Promise.all([
    supabase.from("negocios").select("nombre, food_cost_objetivo").eq("id", e0.negocio_id).single(),
    supabase.from("v_productos_precio").select("*").eq("negocio_id", e0.negocio_id),
    supabase.from("escandallos").select("*, ingredientes_escandallo!ingredientes_escandallo_escandallo_id_fkey(*)").eq("negocio_id", e0.negocio_id),
    supabase.from("organizaciones").select("nombre").single(),
  ]);
  const lista = (escs ?? []) as Escandallo[];
  const e = lista.find((x) => x.id === id)!;
  const c = calcularEscandallos(lista, productos ?? [], Number(neg?.food_cost_objetivo ?? 0.3)).get(id)!;
  const esPlato = e.tipo === "plato";
  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[14px] text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 14mm } @media print { body { background: white } }`}</style>
      <div className="mb-6 flex justify-end gap-2 print:hidden">
        <Link href={conCostes ? `/imprimir/escandallo/${id}` : `/imprimir/escandallo/${id}?costes=1`} className="rounded-sm border border-[#d8cfbb] px-3 py-2 text-sm">{conCostes ? "Versión para cocina (sin costes)" : "Versión con costes"}</Link>
        <BotonImprimir />
      </div>
      <header className="mb-5 flex items-start justify-between gap-4 border-b-2 border-[#1c2521] pb-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">Ficha técnica · {esPlato ? "plato" : "elaboración"} · {neg?.nombre}</p>
          <h1 className="mt-1 font-mono text-3xl font-bold">{e.nombre}</h1>
          <p className="text-[13px] text-[#5b615c]">{e.categoria ?? ""}{esPlato ? ` · ${numero(Number(e.raciones), 0)} ${Number(e.raciones) === 1 ? "ración" : "raciones"}` : e.rendimiento ? ` · rinde ${numero(Number(e.rendimiento), 2)} ${e.unidad_rendimiento}` : ""}</p>
        </div>
        <span className="-rotate-[4deg] rounded-md border-2 border-[#b5651d] px-1.5 py-1 font-mono text-lg font-bold">AC</span>
      </header>
      <h2 className="mb-2 font-mono text-[12px] font-bold uppercase tracking-wider">Ingredientes</h2>
      <table className="mb-6 w-full border-collapse text-[14px]">
        <thead><tr className="border-b border-[#1c2521] text-left text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-1.5">Ingrediente</th><th className="text-right">Cantidad bruta</th>{conCostes && <><th className="text-right">Precio</th><th className="text-right">Coste</th></>}</tr></thead>
        <tbody>{c.lineas.map((l) => (
          <tr key={l.id} className="border-b border-[#e4dcc9]"><td className="py-2">{l.nombre}{l.tipo === "elaboracion" ? " (elaboración)" : ""}</td>
            <td className="text-right font-mono font-bold">{l.cantidad < 1 && (l.unidad === "kg" || l.unidad === "l") ? `${numero(l.cantidad * 1000, 0)} ${l.unidad === "kg" ? "g" : "ml"}` : `${numero(l.cantidad, 3)} ${l.unidad}`}</td>
            {conCostes && <><td className="text-right">{eur(l.precioUnidad, 2)}/{l.unidad}</td><td className="text-right">{eur(l.coste, 3)}</td></>}</tr>
        ))}</tbody>
      </table>
      {e.elaboracion && <><h2 className="mb-2 font-mono text-[12px] font-bold uppercase tracking-wider">Elaboración y emplatado</h2><p className="mb-6 whitespace-pre-wrap text-[15px] leading-relaxed">{e.elaboracion}</p></>}
      <div className="mb-6 rounded border-2 border-[#a3322b] p-3">
        <p className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#a3322b]">Alérgenos</p>
        <p className="text-[16px] font-bold">{c.alergenos.length ? c.alergenos.join(" · ") : "Ninguno declarado en los ingredientes"}</p>
      </div>
      {conCostes && esPlato && (
        <div className="grid grid-cols-4 gap-2 text-center">
          {[["Coste por ración", eur(c.costeRacion, 2)], ["PVP", e.pvp ? eur(Number(e.pvp), 2) : "—"], ["Food cost", c.foodCost != null ? `${numero(c.foodCost * 100, 1)} %` : "—"], ["Margen", c.margen != null ? eur(c.margen, 2) : "—"]].map(([l, v]) => (
            <div key={l} className="rounded border border-[#e4dcc9] p-2"><p className="text-[11px] text-[#5b615c]">{l}</p><p className="font-mono text-lg font-bold">{v}</p></div>
          ))}
        </div>
      )}
      <footer className="mt-8 border-t border-dashed border-[#5b615c] pt-2 text-[10px] text-[#5b615c]">{org?.nombre} · Cantidades brutas, tal como salen del almacén.</footer>
    </main>
  );
}
