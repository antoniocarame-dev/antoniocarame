import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServidor } from "./supabase/server";

export const getSesion = cache(async () => {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  if (!perfil) redirect("/login?error=perfil");
  const equipo = perfil.rol === "admin" || perfil.rol === "colaborador";
  return { supabase, user, perfil, esAdmin: perfil.rol === "admin", esEquipo: equipo };
});

/** Uso personal: solo entra el equipo de la consultora. */
export async function requiereEquipo() {
  const s = await getSesion();
  if (!s.esEquipo) redirect("/login?error=perfil");
  return s;
}

/** ¿Puede editar este proyecto? (misma regla que la RLS, para mostrar u ocultar controles) */
export const puedeEditarProyecto = cache(async (proyectoId: string) => {
  const { supabase, esAdmin, user } = await getSesion();
  if (esAdmin) return true;
  const { data } = await supabase.from("proyecto_miembros").select("rol")
    .eq("proyecto_id", proyectoId).eq("usuario_id", user.id).maybeSingle();
  return data?.rol === "consultor" || data?.rol === "colaborador";
});
