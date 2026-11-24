import { UserPlus } from "lucide-react";
import { Cabecera } from "@/components/shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Campo, Input, Select } from "@/components/ui/form";
import { FormAccion } from "@/components/form-accion";
import { DialogoForm } from "@/components/dialogo-form";
import { SelectAccion } from "@/components/boton-accion";
import { requiereEquipo } from "@/lib/sesion";
import { guardarOrganizacion, invitarUsuario, cambiarRol } from "@/app/acciones/varios";
import { ROLES, opciones } from "@/lib/utils";

export const metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const { supabase, esAdmin, user } = await requiereEquipo();
  const [{ data: org }, { data: perfiles }, { data: proyectos }, { data: miembros }] = await Promise.all([
    supabase.from("organizaciones").select("*").single(),
    supabase.from("perfiles").select("*").order("rol").order("nombre"),
    supabase.from("proyectos").select("id, titulo, negocios(nombre)").neq("estado", "cerrado").order("titulo"),
    supabase.from("proyecto_miembros").select("usuario_id, proyectos(titulo)"),
  ]);
  return (
    <>
      <Cabecera eyebrow="Configuración" titulo="Ajustes" />
      <div className="grid max-w-4xl gap-4">
        <Card>
          <CardHeader><CardTitle>Consultora</CardTitle></CardHeader>
          <FormAccion reset={false} action={async (fd) => { "use server"; return guardarOrganizacion(fd); }}>
            <div className="flex flex-wrap items-end gap-3">
              <Campo label="Nombre que aparece en informes" className="min-w-64 flex-1"><Input name="nombre" defaultValue={org?.nombre} disabled={!esAdmin} /></Campo>
              {esAdmin && <Button type="submit">Guardar</Button>}
            </div>
          </FormAccion>
        </Card>
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <div><CardTitle>Personas con acceso</CardTitle><p className="mt-0.5 text-sm text-muted-foreground">El cliente solo ve los proyectos a los que lo añades y lo marcado como visible.</p></div>
            {esAdmin && (
              <DialogoForm titulo="Invitar a una persona" descripcion="Recibirá un correo para crear su contraseña." boton="Enviar invitación"
                trigger={<Button size="sm"><UserPlus />Invitar</Button>} action={async (fd) => { "use server"; return invitarUsuario(fd); }}>
                <Campo label="Nombre"><Input name="nombre" required /></Campo>
                <Campo label="Correo"><Input name="email" type="email" required /></Campo>
                <Campo label="Rol"><Select name="rol" defaultValue="cliente" opciones={opciones(ROLES)} /></Campo>
                <Campo label="Dar acceso al proyecto"><Select name="proyecto_id" vacio="Ninguno por ahora" opciones={(proyectos ?? []).map((p) => [p.id, `${p.negocios?.nombre} · ${p.titulo}`])} /></Campo>
              </DialogoForm>
            )}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"><th className="px-5 py-2">Persona</th><th className="px-2">Rol</th><th className="px-5">Proyectos</th></tr></thead>
              <tbody>
                {perfiles?.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-5 py-2.5"><p className="font-medium">{p.nombre}</p><p className="select-all text-xs text-muted-foreground">{p.email}</p></td>
                    <td className="px-2">{esAdmin && p.id !== user.id
                      ? <SelectAccion label={`Rol de ${p.nombre}`} valor={p.rol} opciones={opciones(ROLES)} accion={async (v) => { "use server"; return cambiarRol(p.id, v as typeof p.rol); }} />
                      : ROLES[p.rol]}</td>
                    <td className="px-5 text-xs text-muted-foreground">{p.rol === "admin" ? "Todos" : (miembros ?? []).filter((m) => m.usuario_id === p.id).map((m) => m.proyectos?.titulo).join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
