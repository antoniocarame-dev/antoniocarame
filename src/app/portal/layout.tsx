import Link from "next/link";
import { LogOut } from "lucide-react";
import { Sello, TemaToggle } from "@/components/shell";
import { getSesion } from "@/lib/sesion";
import { salir } from "@/app/login/acciones";

export const metadata = { title: "Mi proyecto" };

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const { perfil, esEquipo } = await getSesion();
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/portal" className="flex items-center gap-3"><Sello className="text-base" /><span className="font-mono text-sm font-bold">Portal de cliente</span></Link>
          <span className="ml-auto hidden text-sm text-sidebar-muted sm:inline">{perfil.nombre}</span>
          {esEquipo && <Link href="/panel" className="text-sm text-sidebar-muted hover:text-sidebar-foreground">Volver a la consultora</Link>}
          <span className="[&_button]:text-sidebar-muted"><TemaToggle /></span>
          <form action={salir}><button className="rounded-sm p-2 text-sidebar-muted hover:text-sidebar-foreground" aria-label="Cerrar sesión"><LogOut className="size-4" /></button></form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
