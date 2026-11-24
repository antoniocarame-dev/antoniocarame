import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { baseDe, conceptosDe } from "@/lib/consultora";
import { eur, fecha, numero } from "@/lib/utils";

export const metadata = { title: "Presupuesto" };

export default async function PresupuestoPdf({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await requiereEquipo();
  const [{ data: p }, { data: org }] = await Promise.all([
    supabase.from("presupuestos").select("*, negocios(nombre, direccion, localidad, provincia, contactos(nombre, cargo, principal))").eq("id", id).maybeSingle(),
    supabase.from("organizaciones").select("nombre").single(),
  ]);
  if (!p) notFound();
  const conceptos = conceptosDe(p.conceptos);
  const base = baseDe(p.conceptos), iva = base * Number(p.iva_pct) / 100;
  const contacto = p.negocios?.contactos?.find((c) => c.principal) ?? p.negocios?.contactos?.[0];
  const vence = new Date(p.fecha + "T12:00:00"); vence.setDate(vence.getDate() + p.validez_dias);
  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[14px] leading-relaxed text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 16mm 15mm } @media print { body { background: white } tr { break-inside: avoid } }`}</style>
      <div className="mb-6 flex justify-end print:hidden"><BotonImprimir /></div>
      <header className="mb-8 flex items-start justify-between gap-6 border-b-2 border-[#1c2521] pb-5">
        <div>
          <span className="inline-block -rotate-[4deg] rounded-md border-2 border-[#b5651d] px-2 py-1.5 font-mono text-2xl font-bold">AC</span>
          <p className="mt-3 font-mono text-sm font-bold">{org?.nombre}</p>
          <p className="text-[12px] text-[#5b615c]">{perfil.nombre}{perfil.telefono ? ` · ${perfil.telefono}` : ""}{perfil.email ? ` · ${perfil.email}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">Presupuesto</p>
          <p className="font-mono text-xl font-bold">{p.numero}</p>
          <p className="text-[12px] text-[#5b615c]">{fecha(p.fecha)} · válido hasta el {fecha(vence.toISOString())}</p>
          <p className="mt-3 font-semibold">{p.negocios?.nombre}</p>
          <p className="text-[12px] text-[#5b615c]">{[p.negocios?.direccion, p.negocios?.localidad].filter(Boolean).join(", ")}</p>
          {contacto && <p className="text-[12px] text-[#5b615c]">A la atención de {contacto.nombre}</p>}
        </div>
      </header>
      <h1 className="mb-3 text-balance font-mono text-2xl font-bold">{p.titulo}</h1>
      {p.introduccion && <p className="mb-6 whitespace-pre-wrap text-[15px]">{p.introduccion}</p>}
      <table className="w-full border-collapse text-[13px]">
        <thead><tr className="border-b border-[#1c2521] text-left text-[11px] uppercase tracking-wider text-[#5b615c]"><th className="py-2">Concepto</th><th className="text-right">Cantidad</th><th className="text-right">Precio</th><th className="text-right">Importe</th></tr></thead>
        <tbody>{conceptos.map((c, i) => (
          <tr key={i} className="border-b border-[#e4dcc9]"><td className="py-2.5 pr-4">{c.descripcion}</td><td className="whitespace-nowrap text-right">{numero(c.cantidad, 2)} {c.unidad}</td><td className="text-right">{eur(c.precio, 2)}</td><td className="text-right font-medium">{eur(c.cantidad * c.precio, 2)}</td></tr>
        ))}</tbody>
        <tfoot>
          <tr><td colSpan={3} className="pt-3 text-right">Base imponible</td><td className="pt-3 text-right">{eur(base, 2)}</td></tr>
          <tr><td colSpan={3} className="text-right">IVA {numero(Number(p.iva_pct), 0)} %</td><td className="text-right">{eur(iva, 2)}</td></tr>
          <tr className="font-mono text-[16px] font-bold"><td colSpan={3} className="pt-2 text-right">Total</td><td className="pt-2 text-right">{eur(base + iva, 2)}</td></tr>
        </tfoot>
      </table>
      {p.condiciones && <div className="mt-8 rounded border border-[#e4dcc9] p-4"><p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#8a4a14]">Condiciones</p><p className="whitespace-pre-wrap text-[13px]">{p.condiciones}</p></div>}
      <div className="mt-12 grid grid-cols-2 gap-10 text-[12px] text-[#5b615c]">
        <div className="border-t border-[#1c2521] pt-2">Por {org?.nombre}</div>
        <div className="border-t border-[#1c2521] pt-2">Conforme, {p.negocios?.nombre}<br />Fecha y firma</div>
      </div>
    </main>
  );
}
