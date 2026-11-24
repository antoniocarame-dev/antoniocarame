"use client";
import { supabaseNavegador } from "@/lib/supabase/client";

/** Sube un archivo al bucket privado y devuelve su ruta. */
export async function subirArchivo(carpeta: string, archivo: File): Promise<string> {
  const ext = archivo.name.includes(".") ? archivo.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseNavegador().storage.from("documentos").upload(ruta, archivo, { contentType: archivo.type || undefined });
  if (error) throw new Error(error.message.includes("row-level") ? "No tienes permiso para subir aquí." : "No se ha podido subir: " + error.message);
  return ruta;
}

/** Reduce fotos del móvil a ~1600 px para no subir 8 MB por foto. */
export async function comprimirFoto(f: File, max = 1600): Promise<File> {
  if (!f.type.startsWith("image/") || f.type === "image/svg+xml") return f;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && f.size < 900_000) return f;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.82));
    return new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { return f; }
}
