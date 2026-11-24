import { Fragment } from "react";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { contenidoAuditoria, fecha } from "@/lib/utils";

export const metadata = { title: "Hoja para imprimir" };
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

/** Hoja para colgar en el local: checklist semanal con casillas, o procedimiento numerado. */
export default async function Imprimir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requiereEquipo();
  const { data: e } = await supabase.from("estandares").select("*, proyectos(negocios(nombre))").eq("id", id).maybeSingle();
  if (!e) notFound();
  const { data: org } = await supabase.from("organizaciones").select("nombre").single();
  const c = contenidoAuditoria(e.contenido);
  const esChecklist = e.tipo === "checklist";
  let n = 0;
  return (
    <main className="mx-auto max-w-[800px] bg-white p-8 text-[#1c2521] print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 14mm } @media print { body { background: white } }`}</style>
      <div className="mb-4 flex justify-end print:hidden"><BotonImprimir /></div>
      <header className="mb-5 flex items-start justify-between gap-4 border-b-2 border-[#1c2521] pb-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a4a14]">{esChecklist ? "Checklist" : e.tipo === "sop" ? "Procedimiento" : "Ficha"} · {e.proyectos?.negocios?.nombre}</p>
          <h1 className="mt-1 font-mono text-2xl font-bold">{e.titulo}</h1>
          <p className="text-xs text-[#5b615c]">Versión {e.version}{e.fecha_implantacion ? ` · en vigor desde ${fecha(e.fecha_implantacion)}` : ""}{e.responsable_externo ? ` · Responsable: ${e.responsable_externo}` : ""}</p>
        </div>
        <span className="-rotate-[4deg] rounded-md border-2 border-[#b5651d] px-1.5 py-1 font-mono text-lg font-bold">AC</span>
      </header>
      {esChecklist ? (
        <>
          <p className="mb-2 text-sm">Semana del ____ / ____ / ______ &nbsp;·&nbsp; Marca cada punto al hacerlo y firma al final del día.</p>
          <table className="w-full border-collapse text-[13px]">
            <thead><tr><th className="border border-[#1c2521] p-1.5 text-left">Punto</th>{DIAS.map((d) => <th key={d} className="w-9 border border-[#1c2521] p-1.5 text-center font-mono">{d}</th>)}</tr></thead>
            <tbody>
              {c.secciones.map((s) => (
                <Fragment key={s.titulo}>
                  <tr><td colSpan={8} className="border border-[#1c2521] bg-[#efeae0] px-1.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">{s.titulo}</td></tr>
                  {s.items.map((it) => <tr key={it.id}><td className="border border-[#1c2521] p-1.5">{it.texto}</td>{DIAS.map((d) => <td key={d} className="border border-[#1c2521]" />)}</tr>)}
                </Fragment>
              ))}
              <tr><td className="border border-[#1c2521] p-1.5 font-semibold">Firma</td>{DIAS.map((d) => <td key={d} className="h-9 border border-[#1c2521]" />)}</tr>
            </tbody>
          </table>
        </>
      ) : (
        <div className="grid gap-5">
          {c.secciones.map((s) => (
            <section key={s.titulo} className="break-inside-avoid">
              <h2 className="mb-2 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[#8a4a14]">{s.titulo}</h2>
              <ol className="grid gap-1.5">{s.items.map((it) => { n += 1; return <li key={it.id} className="flex gap-3 text-[14px] leading-snug"><span className="w-6 shrink-0 font-mono font-bold">{n}.</span><span>{it.texto}</span></li>; })}</ol>
            </section>
          ))}
        </div>
      )}
      <footer className="mt-8 border-t border-dashed border-[#5b615c] pt-2 text-[10px] text-[#5b615c]">{org?.nombre} · Documento de trabajo para {e.proyectos?.negocios?.nombre}</footer>
    </main>
  );
}
