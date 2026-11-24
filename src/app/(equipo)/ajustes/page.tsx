import { Cabecera } from "@/components/shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/form";
import { FormAccion } from "@/components/form-accion";
import { requiereEquipo } from "@/lib/sesion";
import { guardarOrganizacion, guardarPerfil } from "@/app/acciones/varios";

export const metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const { supabase, perfil } = await requiereEquipo();
  const { data: org } = await supabase.from("organizaciones").select("*").single();
  return (
    <>
      <Cabecera eyebrow="Configuración" titulo="Ajustes" sub="La plataforma es de uso personal: tus clientes no entran, reciben los informes." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader><CardTitle>Consultora</CardTitle></CardHeader>
          <FormAccion reset={false} action={async (fd) => { "use server"; return guardarOrganizacion(fd); }}>
            <div className="flex flex-wrap items-end gap-3">
              <Campo label="Nombre que aparece en los informes" className="min-w-64 flex-1"><Input name="nombre" defaultValue={org?.nombre} /></Campo>
              <Campo label="Retención IRPF por defecto (%)" ayuda="15 % general · 7 % los tres primeros años · 0 si facturas como sociedad"><Input name="irpf_pct" type="number" step="1" min="0" max="25" className="w-32" defaultValue={Number((org?.ajustes as { irpf_pct?: number } | null)?.irpf_pct ?? 15)} /></Campo>
              <Button type="submit">Guardar</Button>
            </div>
          </FormAccion>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tus datos</CardTitle></CardHeader>
          <FormAccion reset={false} action={async (fd) => { "use server"; return guardarPerfil(fd); }}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Nombre (firma de los informes)"><Input name="nombre" defaultValue={perfil.nombre} /></Campo>
              <Campo label="Teléfono"><Input name="telefono" type="tel" defaultValue={perfil.telefono ?? ""} /></Campo>
              <Campo label="Tarifa por hora (€)" ayuda="Para calcular el margen de cada proyecto"><Input name="tarifa_hora" type="number" step="0.01" defaultValue={perfil.tarifa_hora ?? ""} /></Campo>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Correo de acceso: <span className="select-all">{perfil.email}</span></p>
            <div className="mt-3 flex justify-end"><Button type="submit">Guardar</Button></div>
          </FormAccion>
        </Card>
      </div>
    </>
  );
}
