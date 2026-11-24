import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/imprimir";
import { requiereEquipo } from "@/lib/sesion";
import { cuentaResultados } from "@/lib/resultados";
import { ESTADOS_PROYECTO, PDCA, estadoKpi, eur, fecha, numero, valorKpi } from "@/lib/utils";

export const metadata = { title: "Resumen del proyecto" };

/** Resumen de una página para el cliente: dónde estamos, qué ha mejorado, qué viene y qué necesitamos. */
export default async function Resumen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await requiereEquipo();
  const { data: p } = await supabase.from("proyectos").select("*, negocios(*)").eq("id", id).maybeSingle();
  if (!p?.negocios) notFound();
  const hoy = new Date().toISOString().slice(0, 10);
  const [{ data: org }, { data: fases }, { data: tareas }, { data: kpis }, { data: acciones }, { data: hitos }, meses] = await Promise.all([
    supabase.from("organizaciones").select("nombre").single(),
    supabase.from("fases").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("tareas").select("*").eq("proyecto_id", id),
    supabase.from("kpis").select("*, kpi_valores(periodo, valor)").eq("proyecto_id", id).eq("visible_cliente", true),
    supabase.from("acciones").select("*").eq("proyecto_id", id).eq("visible_cliente", true).order("fecha_objetivo"),
    supabase.from("hitos").select("*").eq("proyecto_id", id).eq("completado", false).gte("fecha", hoy).order("fecha").limit(4),
    cuentaResultados(supabase, p.negocios),
  ]);
  const hechas = (tareas ?? []).filter((t) => t.estado === "hecha").length;
  const avance = tareas?.length ? Math.round((hechas / tareas.length) * 100) : 0;
  const pendCliente = (tareas ?? []).filter((t) => t.responsable_externo && t.estado !== "hecha");
  const logradas = (acciones ?? []).filter((a) => a.fase_pdca === "actuar");
  const enMarcha = (acciones ?? []).filter((a) => a.fase_pdca === "hacer" || a.fase_pdca === "verificar");
  const ultimo = meses.filter((m) => m.completo).at(-1);

  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-1.5 mt-5 border-b border-[#1c2521] pb-0.5 font-mono text-[12px] font-bold uppercase tracking-wider">{children}</h2>;
  return (
    <main className="mx-auto max-w-[800px] bg-white p-10 text-[13px] leading-snug text-[#1c2521] print:max-w-none print:p-0" style={{ colorScheme: "light" }}>
      <style>{`@page { size: A4; margin: 14mm } @media print { body { background: white } }`}</style>
      <div className="mb-6 flex justify-end print:hidden"><BotonImprimir /></div>
      <header className="flex items-start justify-between gap-4 border-b-2 border-[#1c2521] pb-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a4a14]">Resumen del proyecto · {fecha(hoy)}</p>
          <h1 className="mt-1 text-balance font-mono text-[22px] font-bold leading-tight">{p.titulo}</h1>
          <p>{p.negocios.nombre}{p.negocios.localidad ? ` · ${p.negocios.localidad}` : ""}</p>
        </div>
        <span className="-rotate-[4deg] rounded-md border-2 border-[#b5651d] px-1.5 py-1 font-mono text-lg font-bold">AC</span>
      </header>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[["Estado", ESTADOS_PROYECTO[p.estado]], ["Fase", fases?.find((f) => f.estado === "en_curso")?.nombre ?? "—"], ["Avance", `${avance} %`], ["Entrega", fecha(p.fecha_fin, { day: "numeric", month: "short", year: "numeric" })]].map(([l, v]) => (
          <div key={l} className="rounded border border-[#e4dcc9] p-2"><p className="text-[10px] uppercase tracking-wider text-[#5b615c]">{l}</p><p className="font-mono text-[15px] font-bold">{v}</p></div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">{fases?.map((f) => <div key={f.id} className="flex-1"><div className="h-1.5 rounded" style={{ background: f.estado === "completada" ? "#2f6f45" : f.estado === "en_curso" ? "#b5651d" : "#e4dcc9" }} /><p className="mt-0.5 text-[10px] text-[#5b615c]">{f.nombre}</p></div>)}</div>

      {!!kpis?.length && (<>
        <H>Cómo van los números</H>
        <table className="w-full border-collapse"><tbody>
          {kpis.map((k) => {
            const ult = [...k.kpi_valores].sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
            const e = estadoKpi(ult?.valor, k.objetivo, k.valor_base, k.sentido);
            return (
              <tr key={k.id} className="border-b border-[#e4dcc9]">
                <td className="py-1.5">{k.nombre}</td>
                <td className="text-right text-[#5b615c]">al empezar {valorKpi(k.valor_base, k.unidad)}</td>
                <td className="text-right font-bold" style={{ color: e === "ok" ? "#2f6f45" : e === "bad" ? "#a3322b" : "#8c5a0b" }}>ahora {valorKpi(ult?.valor, k.unidad)}</td>
                <td className="text-right">objetivo {valorKpi(k.objetivo, k.unidad)}</td>
              </tr>
            );
          })}
        </tbody></table>
        {ultimo && <p className="mt-1.5 text-[12px] text-[#5b615c]">Último mes cerrado ({fecha(ultimo.periodo, { month: "long", year: "numeric" })}): ventas {eur(ultimo.ventas)}{ultimo.kpi.food_cost != null ? ` · food cost ${numero(ultimo.kpi.food_cost * 100, 1)} %` : ""}{ultimo.ebitda != null ? ` · EBITDA ${eur(ultimo.ebitda)}` : ""}.</p>}
      </>)}

      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <H>Ya conseguido</H>
          {logradas.length ? <ul className="grid gap-1">{logradas.map((a) => <li key={a.id}>✓ <b>{a.titulo}</b>{a.resultado ? <span className="block text-[12px] text-[#5b615c]">{a.resultado}</span> : null}</li>)}</ul> : <p className="text-[#5b615c]">Aún en marcha.</p>}
        </div>
        <div>
          <H>En marcha</H>
          {enMarcha.length ? <ul className="grid gap-1">{enMarcha.map((a) => <li key={a.id}>→ {a.titulo} <span className="text-[11px] text-[#5b615c]">({PDCA[a.fase_pdca].nombre.toLowerCase()}{a.fecha_objetivo ? `, ${fecha(a.fecha_objetivo, { day: "numeric", month: "short" })}` : ""})</span></li>)}</ul> : <p className="text-[#5b615c]">—</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <H>Próximos hitos</H>
          {hitos?.length ? <ul className="grid gap-1">{hitos.map((h) => <li key={h.id}>◇ {h.titulo} <span className="text-[11px] text-[#5b615c]">{fecha(h.fecha, { day: "numeric", month: "short" })}</span></li>)}</ul> : <p className="text-[#5b615c]">—</p>}
        </div>
        <div>
          <H>Pendiente por vuestra parte</H>
          {pendCliente.length ? <ul className="grid gap-1">{pendCliente.map((t) => <li key={t.id}>☐ {t.titulo} <span className="text-[11px] text-[#5b615c]">{t.responsable_externo}{t.vence ? ` · ${fecha(t.vence, { day: "numeric", month: "short" })}` : ""}</span></li>)}</ul> : <p className="text-[#5b615c]">Nada pendiente. ¡Gracias!</p>}
        </div>
      </div>

      <footer className="mt-6 flex justify-between border-t border-dashed border-[#5b615c] pt-2 text-[10px] text-[#5b615c]">
        <span>{org?.nombre}</span><span>{perfil.nombre}{perfil.telefono ? ` · ${perfil.telefono}` : ""}{perfil.email ? ` · ${perfil.email}` : ""}</span>
      </footer>
    </main>
  );
}
