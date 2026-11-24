"use server";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/sesion";
import { bool, err, num, txt, type Res } from "./comun";
import type { Database } from "@/lib/supabase/database.types";
type E = Database["public"]["Enums"];

const datos = (fd: FormData) => ({
  nombre: txt(fd, "nombre") ?? "Sin nombre", tipo: (txt(fd, "tipo") ?? "restaurante") as E["tipo_negocio"],
  grupo: txt(fd, "grupo"), direccion: txt(fd, "direccion"), localidad: txt(fd, "localidad"), provincia: txt(fd, "provincia"),
  aforo: num(fd, "aforo"), horarios: txt(fd, "horarios"), ticket_medio: num(fd, "ticket_medio"), plantilla: num(fd, "plantilla"),
  food_cost_objetivo: (num(fd, "food_cost_objetivo") ?? 30) / 100, notas: txt(fd, "notas"),
});

export async function crearNegocio(fd: FormData): Promise<Res> {
  const { supabase, perfil } = await getSesion();
  const { data, error } = await supabase.from("negocios").insert({ organizacion_id: perfil.organizacion_id, ...datos(fd) }).select("id").single();
  revalidatePath("/negocios");
  return error ? err(error) : { ok: true, id: data.id };
}
export async function actualizarNegocio(id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("negocios").update(datos(fd)).eq("id", id);
  revalidatePath(`/negocios/${id}`);
  return err(error);
}
export async function crearContacto(negocio_id: string, fd: FormData): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("contactos").insert({
    negocio_id, nombre: txt(fd, "nombre") ?? "Contacto", cargo: txt(fd, "cargo"), email: txt(fd, "email"), telefono: txt(fd, "telefono"), principal: bool(fd, "principal"),
  });
  revalidatePath(`/negocios/${negocio_id}`);
  return err(error);
}
export async function borrarContacto(negocio_id: string, id: string): Promise<Res> {
  const { supabase } = await getSesion();
  const { error } = await supabase.from("contactos").delete().eq("id", id);
  revalidatePath(`/negocios/${negocio_id}`);
  return err(error);
}
