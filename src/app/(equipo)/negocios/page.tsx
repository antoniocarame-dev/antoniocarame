import Link from "next/link";
import { Plus } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogoForm } from "@/components/dialogo-form";
import { CamposNegocio } from "@/components/negocio-campos";
import { Vacio } from "@/components/ui/vacio";
import { requiereEquipo } from "@/lib/sesion";
import { crearNegocio } from "@/app/acciones/negocios";
import { TIPOS_NEGOCIO, eur } from "@/lib/utils";

export const metadata = { title: "Negocios" };

export default async function Negocios() {
  const { supabase } = await requiereEquipo();
  const { data } = await supabase.from("negocios").select("*, proyectos(id, estado)").order("nombre");
  return (
    <>
      <Cabecera eyebrow="Clientes" titulo="Negocios" sub="La ficha de cada local: datos, contactos, documentación y su historial de proyectos.">
        <DialogoForm titulo="Nuevo negocio" ancho="max-w-2xl" trigger={<Button><Plus />Nuevo negocio</Button>} action={async (fd) => { "use server"; return crearNegocio(fd); }}><CamposNegocio /></DialogoForm>
      </Cabecera>
      {data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((n) => {
            const activos = n.proyectos.filter((p) => p.estado !== "cerrado").length;
            return (
              <Link key={n.id} href={`/negocios/${n.id}`} className="ticket-edge rounded-sm border bg-card p-4 hover:border-primary">
                <div className="flex items-start justify-between gap-2"><span className="eyebrow">{TIPOS_NEGOCIO[n.tipo]}</span>{activos > 0 && <Badge tono="primary">{activos} activo{activos > 1 ? "s" : ""}</Badge>}</div>
                <h2 className="mt-1 font-mono text-base font-bold">{n.nombre}</h2>
                <p className="text-sm text-muted-foreground">{[n.localidad, n.grupo].filter(Boolean).join(" · ")}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed pt-3 text-sm">
                  <div><dt className="text-[11px] text-muted-foreground">Aforo</dt><dd className="tnum font-medium">{n.aforo ?? "—"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Ticket medio</dt><dd className="tnum font-medium">{n.ticket_medio ? eur(Number(n.ticket_medio), 2) : "—"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Plantilla</dt><dd className="tnum font-medium">{n.plantilla ?? "—"}</dd></div>
                </dl>
              </Link>
            );
          })}
        </div>
      ) : <Vacio titulo="Aún no hay negocios">Da de alta el primer local con el que trabajas.</Vacio>}
    </>
  );
}
