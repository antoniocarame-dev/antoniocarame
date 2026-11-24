import Link from "next/link";
import { Plus } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { AREAS, contenidoAuditoria, fecha } from "@/lib/utils";

export const metadata = { title: "Biblioteca" };

export default async function Biblioteca() {
  const { supabase } = await requiereEquipo();
  const { data } = await supabase.from("plantillas").select("*").order("activa", { ascending: false }).order("nombre");
  return (
    <>
      <Cabecera eyebrow="Método" titulo="Biblioteca de plantillas" sub="Tus auditorías estándar. Cada proyecto copia la plantilla al empezar, así puedes mejorarla sin alterar lo ya auditado.">
        <Button asChild><Link href="/biblioteca/nueva"><Plus />Nueva plantilla</Link></Button>
      </Cabecera>
      <h2 className="eyebrow mb-3">Auditorías</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.filter((p) => p.tipo === "auditoria").map((p) => {
          const c = contenidoAuditoria(p.contenido);
          return (
            <Link key={p.id} href={`/biblioteca/${p.id}`} className={"rounded-md border bg-card p-4 hover:border-primary " + (p.activa ? "" : "opacity-60")}>
              <div className="flex items-center justify-between gap-2"><Badge tono="primary">{p.area ? AREAS[p.area] : "General"}</Badge><span className="font-mono text-xs text-muted-foreground">v{p.version}{p.activa ? "" : " · archivada"}</span></div>
              <h3 className="mt-2 font-semibold">{p.nombre}</h3>
              <p className="text-sm text-muted-foreground">{p.descripcion}</p>
              <p className="mt-2 text-xs text-muted-foreground">{c.secciones.length} secciones · {c.secciones.reduce((s, x) => s + x.items.length, 0)} puntos · {fecha(p.updated_at)}</p>
            </Link>
          );
        })}
      </div>
      <div className="mt-8"><Vacio titulo="SOPs, checklists, manuales e informes · Fase 2">Procedimientos de apertura y cierre, manuales de bienvenida y plantillas de informe reutilizables entre proyectos.</Vacio></div>
    </>
  );
}
