import { Fragment } from "react";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { AREAS, ESCALA, contenidoAuditoria, objetivoTexto, tipoDe, type ItemAuditoria } from "@/lib/utils";

export const metadata = { title: "Hoja para rellenar" };
const Linea = ({ label }: { label: string }) => <div className="flex items-end gap-2"><span className="whitespace-nowrap text-[12px]">{label}</span><span className="h-5 flex-1 border-b border-[#1c2521]" /></div>;
const Casilla = () => <span className="inline-block size-4 border border-[#1c2521]" />;
const Opcion = ({ l }: { l: string }) => <span className="inline-flex items-center gap-1 font-mono text-[11px]"><Casilla />{l}</span>;

/** La casilla de respuesta, distinta según el tipo de pregunta. */
function Respuesta({ it }: { it: ItemAuditoria }) {
  const t = tipoDe(it);
  if (t === "sino") return <div className="flex gap-3"><Opcion l="Sí" /><Opcion l="No" /><Opcion l="N/A" /></div>;
  if (t === "medida") return (
    <div><div className="flex items-end gap-1"><span className="h-5 w-20 border-b border-[#1c2521]" /><span className="text-[12px]">{it.unidad}</span></div>
      {objetivoTexto(it) && <p className="mt-0.5 text-[10px] text-[#5b615c]">Objetivo: {objetivoTexto(it)}</p>}</div>
  );
  if (t === "texto") return <div className="grid gap-3"><span className="h-4 border-b border-[#1c2521]" /><span className="h-4 border-b border-[#1c2521]" /><span className="h-4 border-b border-[#1c2521]" /></div>;
  return <div className="flex gap-2">{["0", "1", "2", "3", "4", "N/A"].map((x) => <Opcion key={x} l={x} />)}</div>;
}

/** Plantilla en blanco para auditar o comprobar en papel en el local. */
export default async function HojaEnBlanco({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requiereEquipo();
  const [{ data: p }, { data: org }] = await Promise.all([
    supabase.from("plantillas").select("*").eq("id", id).maybeSingle(),
    supabase.from("organizaciones").select("nombre").single(),
  ]);
  if (!p) notFound();
  const c = contenidoAuditoria(p.contenido);
  const auditoria = p.tipo === "auditoria";
  const columnas = auditoria ? ["0", "1", "2", "3", "4", "N/A"] : ["Sí", "No", "N/A"];
  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[13px] text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 13mm } @media print { body { background: white } tr { break-inside: avoid } }`}</style>
      <div className="mb-6 flex justify-end print:hidden"><BotonImprimir /></div>
      <header className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#1c2521] pb-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">{auditoria ? "Auditoría" : p.tipo === "sop" ? "Procedimiento" : "Checklist"}{p.area ? ` · ${AREAS[p.area]}` : ""} · v{p.version}</p>
          <h1 className="mt-1 font-mono text-xl font-bold">{p.nombre}</h1>
        </div>
        <span className="-rotate-[4deg] rounded-md border-2 border-[#b5651d] px-1.5 py-1 font-mono text-lg font-bold">AC</span>
      </header>
      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3"><Linea label="Local" /><Linea label="Fecha" /><Linea label={auditoria ? "Auditor" : "Responsable"} /><Linea label="Turno / hora" /></div>
      {auditoria && <p className="mb-3 text-[11px]">Valoración: {ESCALA.map((e, i) => `${i} = ${e.toLowerCase()}`).join(" · ")} · N/A = no aplica. En las mediciones, anota la cifra; en las preguntas abiertas, escribe.</p>}
      {auditoria ? (
        <table className="w-full border-collapse">
          <thead><tr><th className="border border-[#1c2521] p-1.5 text-left">Punto</th><th className="w-[34%] border border-[#1c2521] p-1.5 text-left">Respuesta</th><th className="w-[24%] border border-[#1c2521] p-1.5 text-left">Observaciones / necesidad</th></tr></thead>
          <tbody>
            {c.secciones.map((s) => (
              <Fragment key={s.titulo}>
                <tr><td colSpan={3} className="border border-[#1c2521] bg-[#efeae0] px-1.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">{s.titulo}</td></tr>
                {s.items.map((it) => (
                  <tr key={it.id}>
                    <td className="border border-[#1c2521] p-1.5 align-top">{it.texto}{it.ayuda && <p className="text-[10px] leading-snug text-[#5b615c]">{it.ayuda}</p>}</td>
                    <td className="border border-[#1c2521] p-1.5 align-top"><Respuesta it={it} /></td>
                    <td className="h-10 border border-[#1c2521]" />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      ) : (
      <table className="w-full border-collapse">
        <thead><tr><th className="border border-[#1c2521] p-1.5 text-left">Punto</th>{columnas.map((x) => <th key={x} className="w-9 border border-[#1c2521] p-1 text-center font-mono text-[11px]">{x}</th>)}<th className="w-[30%] border border-[#1c2521] p-1.5 text-left">Observaciones</th></tr></thead>
        <tbody>
          {c.secciones.map((s) => (
            <Fragment key={s.titulo}>
              <tr><td colSpan={columnas.length + 2} className="border border-[#1c2521] bg-[#efeae0] px-1.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">{s.titulo}</td></tr>
              {s.items.map((it) => (
                <tr key={it.id}>
                  <td className="border border-[#1c2521] p-1.5 align-top">{it.texto}</td>
                  {columnas.map((x) => <td key={x} className="border border-[#1c2521] text-center"><Casilla /></td>)}
                  <td className="h-10 border border-[#1c2521]" />
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3"><Linea label={auditoria ? "Necesidades detectadas y hallazgos" : "Incidencias"} /><span className="h-5 border-b border-[#1c2521]" /><span className="h-5 border-b border-[#1c2521]" /><span className="h-5 border-b border-[#1c2521]" /></div>
      <div className="mt-8 grid grid-cols-2 gap-10 text-[11px]"><div className="border-t border-[#1c2521] pt-1">Firma {auditoria ? "del auditor" : "del responsable"}</div><div className="border-t border-[#1c2521] pt-1">Firma del local</div></div>
      <footer className="mt-6 border-t border-dashed border-[#5b615c] pt-2 text-[10px] text-[#5b615c]">{org?.nombre} · Pasa los resultados a la plataforma para calcular la nota y el radar.</footer>
    </main>
  );
}
