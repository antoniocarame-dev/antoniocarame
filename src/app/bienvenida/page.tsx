"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/client";

/** Destino del enlace de invitación: la persona crea su contraseña. */
export default function Bienvenida() {
  const router = useRouter();
  const [listo, setListo] = useState<"cargando" | "ok" | "sin-sesion">("cargando");
  const [error, setError] = useState<string | null>(null);
  const [pend, setPend] = useState(false);

  useEffect(() => {
    const sb = supabaseNavegador();
    (async () => {
      const h = new URLSearchParams(window.location.hash.slice(1));
      const q = new URLSearchParams(window.location.search);
      if (h.get("access_token") && h.get("refresh_token")) {
        await sb.auth.setSession({ access_token: h.get("access_token")!, refresh_token: h.get("refresh_token")! });
        history.replaceState(null, "", "/bienvenida");
      } else if (q.get("code")) {
        await sb.auth.exchangeCodeForSession(q.get("code")!);
      }
      const { data } = await sb.auth.getUser();
      setListo(data.user ? "ok" : "sin-sesion");
    })();
  }, []);

  return (
    <main className="grid min-h-full place-items-center bg-sidebar px-4 py-10">
      <div className="ticket-edge w-full max-w-sm rounded-sm bg-card p-6">
        <p className="eyebrow mb-1">Bienvenida</p>
        <h1 className="mb-4 font-mono text-xl font-bold">Crea tu contraseña</h1>
        {listo === "cargando" && <p className="text-sm text-muted-foreground">Comprobando la invitación…</p>}
        {listo === "sin-sesion" && <p className="text-sm text-bad">El enlace ha caducado o ya se usó. Pide a tu consultor que te reenvíe la invitación.</p>}
        {listo === "ok" && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const p1 = String(fd.get("p1")), p2 = String(fd.get("p2"));
            if (p1.length < 8) return setError("Usa al menos 8 caracteres.");
            if (p1 !== p2) return setError("Las contraseñas no coinciden.");
            setPend(true);
            const { error } = await supabaseNavegador().auth.updateUser({ password: p1 });
            setPend(false);
            if (error) return setError("No se ha podido guardar: " + error.message);
            router.replace("/");
          }}>
            <label className="mb-3 flex flex-col gap-1 text-sm font-medium text-muted-foreground">Contraseña
              <input name="p1" type="password" required autoComplete="new-password" className="h-10 rounded-sm border border-input bg-card px-3 text-foreground" /></label>
            <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-muted-foreground">Repítela
              <input name="p2" type="password" required autoComplete="new-password" className="h-10 rounded-sm border border-input bg-card px-3 text-foreground" /></label>
            {error && <p role="alert" className="mb-3 rounded-sm bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
            <button disabled={pend} className="h-10 w-full rounded-sm bg-primary font-medium text-primary-foreground">{pend ? "Guardando…" : "Entrar"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
