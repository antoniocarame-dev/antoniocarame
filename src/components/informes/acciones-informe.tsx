"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redactarConIA } from "@/app/acciones/informes";

/** Redacta con IA la introducción, las conclusiones y los próximos pasos. */
export function RedactarIA({ proyectoId, informeId, hayTexto }: { proyectoId: string; informeId: string; hayTexto: boolean }) {
  const router = useRouter();
  const [indicaciones, setIndicaciones] = useState("");
  const [armado, setArmado] = useState(false);
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const lanzar = () => {
    if (hayTexto && !armado) { setArmado(true); setTimeout(() => setArmado(false), 5000); return; }
    setArmado(false); setMsg(null);
    start(async () => {
      const r = await redactarConIA(proyectoId, informeId, indicaciones);
      setMsg(r.ok ? { ok: true, t: "Redactado. Revísalo, cambia lo que quieras y guarda." } : { ok: false, t: r.error ?? "Error" });
      if (r.ok) router.refresh();
    });
  };
  return (
    <div className="grid gap-2 rounded-md border border-primary/40 bg-primary-soft/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary-ink" />Redactar con IA</p>
          <p className="text-xs text-muted-foreground">Escribe la introducción, las conclusiones y los próximos pasos con los datos reales del proyecto: indicadores, auditorías, hallazgos, plan y resultados. Solo usa lo marcado «incluir en los informes».</p>
        </div>
        <Button type="button" onClick={lanzar} disabled={pend} variant={armado ? "destructive" : "default"}>
          <Sparkles />{pend ? "Redactando… (hasta 1 minuto)" : armado ? "Sustituirá el texto actual. ¿Seguro?" : "Redactar"}
        </Button>
      </div>
      <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} aria-label="Indicaciones para la redacción"
        placeholder="Opcional: qué destacar o el tono. Ej.: «insiste en el ahorro en compras y felicita al equipo de cocina»"
        className="min-h-14 w-full rounded-sm border border-input bg-card p-2 text-sm" />
      {msg && <p role={msg.ok ? "status" : "alert"} className={"text-sm " + (msg.ok ? "text-ok" : "text-bad")}>{msg.t}</p>}
    </div>
  );
}

/** Descargar el PDF o enviarlo: en el móvil abre Correo con el PDF ya adjunto. */
export function EnviarInforme({ informeId, email, asunto, cuerpo }: { informeId: string; email: string | null; asunto: string; cuerpo: string }) {
  const [pend, setPend] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [listo, setListo] = useState<File | null>(null);
  const url = `/exportar/informe/${informeId}`;
  const compartir = async (archivo: File) => {
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: asunto, text: cuerpo });
        setListo(null);
      } catch (e) {
        const n = (e as Error).name;
        // Safari exige que «Compartir» salga justo tras el toque: el PDF ya está listo para el segundo toque
        if (n === "NotAllowedError") { setListo(archivo); setAviso("PDF listo. Pulsa «Enviar» otra vez para elegir Correo."); }
        else if (n !== "AbortError") setAviso((e as Error).message);
      }
      return;
    }
    // Ordenador: se descarga el PDF y se abre el correo para adjuntarlo
    const a = document.createElement("a"); a.href = URL.createObjectURL(archivo); a.download = archivo.name; a.click();
    window.location.href = `mailto:${email ?? ""}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setAviso("PDF descargado. Adjúntalo al correo que se ha abierto (está en Descargas).");
  };
  const enviar = async () => {
    setAviso(null);
    if (listo) return compartir(listo);
    setPend(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se ha podido generar el PDF.");
      const nombre = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "informe.pdf";
      await compartir(new File([await res.blob()], nombre, { type: "application/pdf" }));
    } catch (e) {
      setAviso((e as Error).message);
    } finally { setPend(false); }
  };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={enviar} disabled={pend}><Mail />{pend ? "Preparando PDF…" : listo ? "Enviar (PDF listo)" : "Enviar por correo"}</Button>
        <Button asChild variant="outline"><a href={url}><Download />Descargar PDF</a></Button>
        <Button asChild variant="ghost"><a href={`${url}?ver=1`} target="_blank" rel="noreferrer">Ver PDF</a></Button>
      </div>
      {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}
    </div>
  );
}
