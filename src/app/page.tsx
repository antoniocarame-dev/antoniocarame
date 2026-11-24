import { redirect } from "next/navigation";
import { getSesion } from "@/lib/sesion";

export default async function Inicio() {
  const { esEquipo } = await getSesion();
  redirect(esEquipo ? "/panel" : "/portal");
}
