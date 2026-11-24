"use server";
import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";

export async function entrar(fd: FormData) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""),
  });
  if (error) redirect("/login?error=1");
  redirect("/");
}

export async function salir() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
