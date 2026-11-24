import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { AREAS, ESCALA, MUDAS, contenidoAuditoria, fecha } from "@/lib/utils";

export const metadata = { title: "Informe de auditoría" };
const COLOR = ["#a3322b", "#a3322b", "#8c5a0b", "#2f6f45", "#2f6f45"];

/** Auditoría documentada: puntuación por secciones, cada punto con su nota, comentario y foto. */
export default async function InformeAuditoria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requiereEquipo();
  const { data: a } = await supabase.from("auditorias").select("*, proyectos(titulo, negocios(nombre, localidad))").eq("id", id).maybeSingle();
  if (!a) notFound();
  const [{ data: resp }, { data: auditor }, { data: org }, { data: hallazgos }] = await Promise.all([
    supabase.from("auditoria_respuestas").select("*").eq("auditoria_id", id),
    a.auditor_id ? supabase.from("perfiles").select("nombre").eq("id", a.auditor_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("organizaciones").select("nombre").single(),
    supabase.from("hallazgos").select("*").eq("auditoria_id", id).order("impacto", { ascending: false }),
  ]);
  const r = new Map((resp ?? []).map((x) => [x.item_id, x]));
  const fotos = [...(resp ?? []).map((x) => x.foto_path), ...(hallazgos ?? []).flatMap((h) => h.fotos)].filter(Boolean) as string[];
  const { data: firmadas } = fotos.length ? await supabase.storage.from("documentos").createSignedUrls(fotos, 3600) : { data: [] };
  const url = new Map((firmadas ?? []).flatMap((f) => (f.path && f.signedUrl ? [[f.path, f.signedUrl] as [string, string]] : [])));
  const c = contenidoAuditoria(a.contenido);
  const nota = (vals: (number | null | undefined)[]) => { const v = vals.filter((x): x is number => x != null); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length / 4) * 100) : null; };
  const criticos = c.secciones.flatMap((s) => s.items.filter((it) => { const v = r.get(it.id)?.valor; return v != null && v <= 1; }));
  const total = c.secciones.reduce((s, x) => s + x.items.length, 0);
  const valorados = (resp ?? []).filter((x) => x.valor != null).length;

  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[14px] leading-relaxed text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 15mm } @media print { body { background: white } li, tr, .bloque { break-inside: avoid } }`}</style>
      <div className="mb-6 flex justify-end print:hidden"><BotonImprimir /></div>
      <header className="mb-6 flex items-start justify-between gap-4 border-b-2 border-[#1c2521] pb-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">Auditoría · {AREAS[a.area]}</p>
          <h1 className="mt-1 font-mono text-2xl font-bold">{a.titulo}</h1>
          <p className="text-[13px]">{a.proyectos?.negocios?.nombre}{a.proyectos?.negocios?.localidad ? ` · ${a.proyectos.negocios.localidad}` : ""}</p>
          <p className="text-[12px] text-[#5b615c]">{fecha(a.fecha)}{auditor?.nombre ? ` · Auditor: ${auditor.nombre}` : ""} · {valorados} de {total} puntos valorados</p>
        </div>
        <div className="text-right">
          <span className="inline-block -rotate-[4deg] rounded-md border-2 border-[#b5651d] px-2 py-1 font-mono text-xl font-bold">AC</span>
          <p className="mt-2 font-mono text-3xl font-bold" style={{ color: a.puntuacion == null ? "#5b615c" : Number(a.puntuacion) >= 75 ? "#2f6f45" : Number(a.puntuacion) >= 50 ? "#8c5a0b" : "#a3322b" }}>{a.puntuacion == null ? "—" : Math.round(Number(a.puntuacion))}<span className="text-base">/100</span></p>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {c.secciones.map((s) => { const n = nota(s.items.map((it) => r.get(it.id)?.valor)); return (
          <div key={s.titulo} className="rounded border border-[#e4dcc9] p-2.5"><p className="text-[12px] text-[#5b615c]">{s.titulo}</p><p className="font-mono text-lg font-bold">{n == null ? "—" : `${n}/100`}</p></div>
        ); })}
      </div>

      {criticos.length > 0 && (
        <div className="bloque mb-6 rounded border border-[#a3322b] p-3">
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#a3322b]">Puntos críticos ({criticos.length})</p>
          <ul className="text-[13px]">{criticos.map((it) => <li key={it.id}>· {it.texto}{r.get(it.id)?.nota ? ` — ${r.get(it.id)!.nota}` : ""}</li>)}</ul>
        </div>
      )}

      {c.secciones.map((s) => (
        <section key={s.titulo} className="mb-6">
          <h2 className="mb-2 border-b border-[#1c2521] pb-1 font-mono text-[13px] font-bold uppercase tracking-wider">{s.titulo}</h2>
          <ol className="grid gap-2">
            {s.items.map((it) => {
              const x = r.get(it.id);
              const foto = x?.foto_path ? url.get(x.foto_path) : undefined;
              return (
                <li key={it.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-dashed border-[#e4dcc9] pb-2">
                  <div>
                    <p className="font-medium">{it.texto}</p>
                    {x?.nota && <p className="text-[13px] text-[#5b615c]">{x.nota}</p>}
                    {foto && <img src={foto} alt="" className="mt-1.5 h-36 rounded object-cover" />}
                  </div>
                  <span className="self-start whitespace-nowrap rounded px-2 py-0.5 font-mono text-[12px] font-bold text-white" style={{ background: x?.valor == null ? "#9aa09b" : COLOR[x.valor] }}>
                    {x?.valor == null ? "N/A" : `${x.valor} · ${ESCALA[x.valor]}`}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {!!hallazgos?.length && (
        <section className="mb-6">
          <h2 className="mb-2 border-b border-[#1c2521] pb-1 font-mono text-[13px] font-bold uppercase tracking-wider">Hallazgos registrados</h2>
          {hallazgos.map((h) => (
            <div key={h.id} className="bloque mb-2"><p><b>{h.titulo}</b>{h.muda ? ` · ${MUDAS[h.muda].nombre}` : ""} · impacto {h.impacto}/5</p>{h.descripcion && <p className="text-[13px] text-[#5b615c]">{h.descripcion}</p>}
              {h.fotos.length > 0 && <div className="mt-1 flex gap-2">{h.fotos.map((f) => url.get(f) && <img key={f} src={url.get(f)} alt="" className="h-28 rounded object-cover" />)}</div>}</div>
          ))}
        </section>
      )}

      {a.notas && <section><h2 className="mb-2 border-b border-[#1c2521] pb-1 font-mono text-[13px] font-bold uppercase tracking-wider">Conclusiones</h2><p className="whitespace-pre-wrap">{a.notas}</p></section>}
      <p className="mt-6 text-[11px] text-[#5b615c]">Escala: {ESCALA.map((e, i) => `${i} ${e.toLowerCase()}`).join(" · ")}. Los puntos sin valorar no cuentan en la nota.</p>
      <footer className="mt-6 border-t border-dashed border-[#5b615c] pt-2 text-[11px] text-[#5b615c]">{org?.nombre}</footer>
    </main>
  );
}
