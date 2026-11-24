export type Res = { ok: boolean; error?: string; id?: string };

export function err(e: { message?: string; code?: string } | null | undefined): Res {
  if (!e) return { ok: true };
  const m = e.message ?? "";
  if (e.code === "42501" || /row-level security/i.test(m)) return { ok: false, error: "No tienes permiso para hacer este cambio." };
  if (e.code === "23505") return { ok: false, error: "Ya existe un registro igual." };
  if (e.code === "23503") return { ok: false, error: "Hay datos que dependen de este registro. Bórralos antes." };
  if (e.code === "P0001") return { ok: false, error: m };
  return { ok: false, error: "No se ha podido guardar: " + m };
}

export const txt = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
export const num = (fd: FormData, k: string) => {
  const v = txt(fd, k);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
