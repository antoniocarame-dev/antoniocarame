import { entrar } from "./acciones";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-full place-items-center bg-sidebar px-4 py-10 text-sidebar-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="-rotate-[4deg] rounded-md border-2 border-brand px-2 py-1.5 font-mono text-2xl font-bold">AC</span>
          <div>
            <p className="font-mono text-sm font-bold">AC Soluciones Gastronómicas</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-muted">Plataforma de proyectos</p>
          </div>
        </div>
        <form action={entrar} className="ticket-edge rounded-sm bg-card p-6 text-foreground">
          <p className="eyebrow mb-1">Acceso</p>
          <h1 className="mb-5 font-mono text-xl font-bold">Entra en tu cuenta</h1>
          <label className="mb-3 flex flex-col gap-1 text-sm font-medium text-muted-foreground">
            Correo
            <input name="email" type="email" required autoComplete="email" className="h-10 rounded-sm border border-input bg-card px-3 text-foreground" />
          </label>
          <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-muted-foreground">
            Contraseña
            <input name="password" type="password" required autoComplete="current-password" className="h-10 rounded-sm border border-input bg-card px-3 text-foreground" />
          </label>
          {error && <p role="alert" className="mb-3 rounded-sm bg-bad-soft px-3 py-2 text-sm text-bad">{error === "perfil" ? "Este usuario no tiene acceso a la plataforma." : "Correo o contraseña incorrectos."}</p>}
          <button className="h-10 w-full rounded-sm bg-primary font-medium text-primary-foreground hover:brightness-110">Entrar</button>
        </form>
      </div>
    </main>
  );
}
