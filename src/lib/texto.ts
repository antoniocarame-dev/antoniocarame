/** Normaliza un texto para comparar nombres (sin tildes, minúsculas, palabras de más de 2 letras). */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);

/** Elemento más parecido por palabras en común (≥ 50 % de las palabras del nombre candidato). */
export function emparejarProducto(descripcion: string, candidatos: { id: string; nombre: string }[]) {
  const d = new Set(norm(descripcion));
  let mejor: { id: string; score: number } | null = null;
  for (const p of candidatos) {
    const pal = norm(p.nombre);
    if (!pal.length) continue;
    const score = pal.filter((w) => d.has(w) || [...d].some((x) => x.startsWith(w.slice(0, 5)))).length / pal.length;
    if (score >= 0.5 && (!mejor || score > mejor.score)) mejor = { id: p.id, score };
  }
  return mejor?.id ?? null;
}
