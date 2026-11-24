"use client";
import { useRef, useState, useTransition } from "react";
import { Download, FileText, History, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { subirArchivo } from "@/components/subida";
import { Comentarios, type Comentario } from "@/components/comentarios";
import type { Res } from "@/app/acciones/comun";
import { registrarDocumento, enlaceDescarga, borrarDocumento } from "@/app/acciones/documentos";

export type Doc = {
  id: string; nombre: string; carpeta: string; version: number; tamano: number | null; storage_path: string;
  visible_cliente: boolean; subido: string; fecha: string; propio: boolean;
  versiones: { version: number; storage_path: string; fecha: string }[];
};

const peso = (b: number | null) => b == null ? "" : b > 1e6 ? `${(b / 1e6).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1e3))} kB`;

async function descargar(ruta: string) {
  const r = await enlaceDescarga(ruta);
  if (r.url) window.location.href = r.url; else alert(r.error);
}

export function Documentos({ ambito, docs, carpetas, comentarios, comentar }: {
  ambito: { proyecto_id?: string; negocio_id?: string }; docs: Doc[]; carpetas: string[];
  comentarios?: Record<string, Comentario[]>;
  comentar?: (docId: string, fd: FormData) => Promise<Res>;
}) {
  const [pend, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [carpeta, setCarpeta] = useState(carpetas[0] ?? "General");
  const versionRef = useRef<{ id: string } | null>(null);
  const inputVersion = useRef<HTMLInputElement>(null);
  const base = ambito.proyecto_id ? `proyectos/${ambito.proyecto_id}` : `negocios/${ambito.negocio_id}`;

  const subir = (files: FileList | null, documento_id?: string) => {
    if (!files?.length) return;
    setError(null);
    start(async () => {
      for (const f of Array.from(files)) {
        try {
          const ruta = await subirArchivo(`${base}/docs`, f);
          const r = await registrarDocumento({ ...ambito, carpeta, nombre: f.name, storage_path: ruta, mime: f.type, tamano: f.size,
            visible_cliente: true, documento_id });
          if (!r.ok) throw new Error(r.error);
        } catch (e) { setError((e as Error).message); }
      }
    });
  };

  const grupos = [...new Set(docs.map((d) => d.carpeta))].sort();
  return (
    <div>
      {(
        <div className="mb-5 rounded-md border border-dashed border-input bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-[12.5px] font-medium text-muted-foreground">
              Carpeta
              <Input list="carpetas" value={carpeta} onChange={(e) => setCarpeta(e.target.value)} />
              <datalist id="carpetas">{carpetas.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <Button asChild disabled={pend}>
              <label className="cursor-pointer"><Upload />{pend ? "Subiendo…" : "Subir archivos"}
                <input type="file" multiple className="sr-only" onChange={(e) => { subir(e.target.files); e.target.value = ""; }} /></label>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">PDF, fotos, Excel… hasta 50 MB por archivo. Subir un archivo con el mismo nombre no lo sustituye: usa «Nueva versión».</p>
          {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
        </div>
      )}
      <input ref={inputVersion} type="file" className="sr-only" onChange={(e) => { if (versionRef.current) subir(e.target.files, versionRef.current.id); e.target.value = ""; }} />
      {grupos.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay documentos.</p>}
      <div className="grid gap-4">
        {grupos.map((g) => (
          <section key={g} className="rounded-md border bg-card">
            <h3 className="border-b px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g}</h3>
            <ul className="divide-y">
              {docs.filter((d) => d.carpeta === g).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <button onClick={() => descargar(d.storage_path)} className="block max-w-full truncate text-left font-medium hover:text-primary-ink">{d.nombre}</button>
                    <p className="text-xs text-muted-foreground">v{d.version} · {peso(d.tamano)} · {d.subido} · {d.fecha}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Descargar" onClick={() => descargar(d.storage_path)}><Download /></Button>
                    {d.versiones.length > 0 && (
                      <details className="relative">
                        <summary className="list-none"><span className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm hover:bg-muted" title="Versiones anteriores"><History className="size-4" /></span></summary>
                        <ul className="absolute right-0 z-10 mt-1 w-56 rounded-sm border bg-card p-1 text-sm shadow-lg">
                          {d.versiones.map((v) => <li key={v.version}><button onClick={() => descargar(v.storage_path)} className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-muted">Versión {v.version} · {v.fecha}</button></li>)}
                        </ul>
                      </details>
                    )}
                    {<Button variant="ghost" size="sm" disabled={pend} onClick={() => { versionRef.current = { id: d.id }; inputVersion.current?.click(); }}>Nueva versión</Button>}
                    {comentar && <Comentarios titulo={d.nombre} lista={comentarios?.[d.id] ?? []} accion={(fd) => comentar(d.id, fd)} />}
                    {<Button variant="ghost" size="icon" aria-label="Borrar" onClick={() => { if (confirm(`¿Borrar «${d.nombre}» y todas sus versiones?`)) start(async () => { const r = await borrarDocumento(d.id); if (!r.ok) setError(r.error ?? null); }); }}><Trash2 /></Button>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
