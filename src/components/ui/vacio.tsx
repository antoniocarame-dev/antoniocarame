export function Vacio({ titulo, children, accion }: { titulo: string; children?: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
      <p className="mb-1 font-mono font-bold text-foreground">{titulo}</p>
      {children}
      {accion && <div className="mt-3 flex justify-center">{accion}</div>}
    </div>
  );
}
