"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select } from "@/components/ui/form";
import { EditorContenido, limpiarContenido, nuevoId } from "@/components/editor-contenido";
import { AREAS, opciones, type ContenidoAuditoria } from "@/lib/utils";
import { guardarPlantilla, archivarPlantilla } from "@/app/acciones/diagnostico";
import type { Database } from "@/lib/supabase/database.types";

type Area = Database["public"]["Enums"]["area_auditoria"];
type Tipo = Database["public"]["Enums"]["tipo_plantilla"];

export function EditorPlantilla({ id, tipo, inicial }: { id: string | null; tipo: Tipo; inicial: { nombre: string; area: Area | null; descripcion: string | null; contenido: ContenidoAuditoria; activa: boolean } }) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [area, setArea] = useState<Area | "">(inicial.area ?? "");
  const [desc, setDesc] = useState(inicial.descripcion ?? "");
  const [c, setC] = useState(inicial.contenido.secciones.length ? inicial.contenido : { secciones: [{ titulo: tipo === "sop" ? "Paso 1" : "Sección 1", items: [{ id: nuevoId(), texto: "" }] }] });
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const router = useRouter();

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2">
        <Campo label="Nombre"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
        <Campo label="Área"><Select value={area} onChange={(e) => setArea(e.target.value as Area)} vacio="General" opciones={opciones(AREAS)} /></Campo>
        <Campo label="Descripción" className="sm:col-span-2"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Campo>
      </div>
      <EditorContenido valor={c} onChange={setC}
        placeholder={tipo === "auditoria" ? "Criterio observable: «Las cámaras se registran a diario»" : tipo === "sop" ? "Paso: qué se hace, cómo y con qué estándar" : "Lo que se comprueba"}
        etiquetaPunto={tipo === "sop" ? "Paso" : "Punto"} tipos={tipo === "auditoria"} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {msg && <span className={"text-sm " + (msg.ok ? "text-ok" : "text-bad")}>{msg.t}</span>}
        {id && <Button variant="outline" disabled={pend} onClick={() => start(async () => { await archivarPlantilla(id, !inicial.activa); router.refresh(); })}>{inicial.activa ? "Archivar" : "Reactivar"}</Button>}
        <Button disabled={pend} onClick={() => start(async () => {
          const r = await guardarPlantilla(id, nombre, area || null, desc || null, limpiarContenido(c), tipo);
          setMsg(r.ok ? { ok: true, t: "Guardada" } : { ok: false, t: r.error ?? "Error" });
          if (r.ok && !id && r.id) router.replace(`/biblioteca/${r.id}`);
        })}>Guardar plantilla</Button>
      </div>
    </div>
  );
}
