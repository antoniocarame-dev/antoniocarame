import Link from "next/link";
import { Plus } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requiereEquipo } from "@/lib/sesion";
import { AREAS, contenidoAuditoria, fecha } from "@/lib/utils";

export const metadata = { title: "Biblioteca" };

const SECCIONES = [
  { tipo: "auditoria", titulo: "Auditorías", ayuda: "Plantillas para el diagnóstico. Cada proyecto copia la plantilla al empezar, así puedes mejorarla sin alterar lo ya auditado." },
  { tipo: "sop", titulo: "Procedimientos (SOPs)", ayuda: "Cómo se hace cada proceso, paso a paso. Se copian a los proyectos desde Estándares y formación." },
  { tipo: "checklist", titulo: "Checklists", ayuda: "Apertura, cierre, recepción de mercancía… Se imprimen como hoja semanal para el local." },
] as const;

export default async function Biblioteca() {
  const { supabase } = await requiereEquipo();
  const { data } = await supabase.from("plantillas").select("*").order("activa", { ascending: false }).order("nombre");
  return (
    <>
      <Cabecera eyebrow="Método" titulo="Biblioteca de plantillas" sub="Tu forma de trabajar, reutilizable en todos los proyectos." />
      <div className="grid gap-8">
        {SECCIONES.map((sec) => (
          <section key={sec.tipo}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="font-mono text-base font-bold">{sec.titulo}</h2><p className="max-w-[70ch] text-sm text-muted-foreground">{sec.ayuda}</p></div>
              <Button asChild size="sm" variant="outline"><Link href={`/biblioteca/nueva?tipo=${sec.tipo}`}><Plus />Nueva</Link></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data?.filter((p) => p.tipo === sec.tipo).map((p) => {
                const c = contenidoAuditoria(p.contenido);
                return (
                  <Link key={p.id} href={`/biblioteca/${p.id}`} className={"rounded-md border bg-card p-4 hover:border-primary " + (p.activa ? "" : "opacity-60")}>
                    <div className="flex items-center justify-between gap-2"><Badge tono="primary">{p.area ? AREAS[p.area] : "General"}</Badge><span className="font-mono text-xs text-muted-foreground">v{p.version}{p.activa ? "" : " · archivada"}</span></div>
                    <h3 className="mt-2 font-semibold">{p.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{p.descripcion}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{c.secciones.length} secciones · {c.secciones.reduce((s, x) => s + x.items.length, 0)} {sec.tipo === "sop" ? "pasos" : "puntos"} · {fecha(p.updated_at)}</p>
                  </Link>
                );
              })}
              {!data?.some((p) => p.tipo === sec.tipo) && <p className="text-sm text-muted-foreground">Todavía no hay ninguna.</p>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
