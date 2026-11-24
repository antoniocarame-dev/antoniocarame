import { Shell } from "@/components/shell";
import { requiereEquipo } from "@/lib/sesion";
import { ROLES } from "@/lib/utils";
import { salir } from "@/app/login/acciones";

export default async function LayoutEquipo({ children }: { children: React.ReactNode }) {
  const { supabase, perfil } = await requiereEquipo();
  const { data } = await supabase.from("proyectos").select("id, titulo, estado, negocios(nombre)").neq("estado", "cerrado").order("titulo");
  const proyectos = (data ?? []).map((p) => ({ id: p.id, titulo: p.titulo, negocio: p.negocios?.nombre ?? "" }));
  return <Shell proyectos={proyectos} usuario={{ nombre: perfil.nombre, rol: ROLES[perfil.rol] }} salir={salir}>{children}</Shell>;
}
