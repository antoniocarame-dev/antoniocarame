import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

/** Lo que extraemos de una receta o ficha técnica (foto, escaneo o PDF). */
export const RecetaLeida = z.object({
  nombre: z.string().describe("Nombre del plato o de la elaboración"),
  tipo: z.enum(["plato", "elaboracion"]).describe("plato si se sirve al cliente; elaboracion si es una base (fondo, salsa, masa) que se usa en otros platos"),
  categoria: z.string().nullable().describe("Entrantes, Principales, Postres, Fritos, Salsas… si se deduce"),
  raciones: z.number().nullable().describe("Raciones que salen; null si no se indica"),
  rendimiento: z.number().nullable().describe("Solo elaboraciones: cantidad total que sale, en kg, litros o unidades"),
  unidad_rendimiento: z.enum(["kg", "l", "ud"]).nullable(),
  pvp: z.number().nullable().describe("Precio de venta con IVA si aparece; null si no"),
  ingredientes: z.array(z.object({
    nombre: z.string().describe("Ingrediente, sin la cantidad. Ej.: «cebolla», «aceite de oliva virgen extra»"),
    cantidad: z.number().nullable().describe("Cantidad convertida a kg, litros o unidades: 250 g → 0.25; 30 ml → 0.03; 2 huevos → 2. null si es «c/s», «al gusto» o no se lee"),
    unidad: z.enum(["kg", "l", "ud"]),
  })),
  elaboracion: z.string().nullable().describe("Pasos de elaboración y emplatado, tal como vienen, en párrafos"),
  avisos: z.array(z.string()).describe("Dudas: cantidades ilegibles, «c/s», unidades raras (cucharada, taza, pizca), ingredientes que parecen elaboraciones"),
});
export type RecetaLeida = z.infer<typeof RecetaLeida>;

const INSTRUCCIONES = `Eres jefe de cocina y ayudas a una consultora de hostelería en España a pasar recetas y fichas técnicas a escandallos.

Extrae la receta del documento adjunto (puede ser una foto de un cuaderno, una ficha impresa o un PDF). Criterios:
- Convierte siempre las cantidades a kg, litros o unidades: g → kg, ml/cl → litros. Cucharada ≈ 0,015 l o 0,015 kg; cucharadita ≈ 0,005; taza ≈ 0,25 l; pizca → null. Anota en «avisos» cada conversión aproximada.
- Las cantidades son brutas, tal como figuran. No inventes cantidades: si no se leen, null y aviso.
- Respeta los nombres de ingrediente en español, en singular y sin marcas.
- Si hay varias recetas en el documento, extrae solo la principal y avisa.`;

export async function leerReceta(archivo: Blob, mime: string): Promise<{ ok: true; datos: RecetaLeida } | { ok: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "La lectura automática no está configurada (falta ANTHROPIC_API_KEY en Vercel)." };
  }
  const data = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  const esPdf = mime === "application/pdf";
  const tipoImagen = (["image/jpeg", "image/png", "image/webp", "image/gif"] as const).find((t) => t === mime);
  if (!esPdf && !tipoImagen) return { ok: false, error: "Solo se leen PDF y fotos (JPG, PNG, WebP)." };
  const client = new Anthropic();
  try {
    const respuesta = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si el modelo rechaza la petición, la API la reintenta con otro modelo adecuado
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCCIONES,
      output_config: { effort: "low", format: betaZodOutputFormat(RecetaLeida) },
      messages: [{
        role: "user",
        content: [
          esPdf
            ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
            : { type: "image", source: { type: "base64", media_type: tipoImagen!, data } },
          { type: "text", text: "Extrae esta receta." },
        ],
      }],
    });
    if (respuesta.stop_reason === "refusal") return { ok: false, error: "No se ha podido leer esta receta." };
    if (respuesta.stop_reason === "max_tokens") return { ok: false, error: "El documento es demasiado largo. Sube solo la página de la receta." };
    if (!respuesta.parsed_output) return { ok: false, error: "La lectura no ha devuelto datos válidos." };
    return { ok: true, datos: respuesta.parsed_output };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: "La clave de la API de Claude no es válida." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: "Demasiadas lecturas seguidas. Prueba en un minuto." };
    if (e instanceof Anthropic.BadRequestError) return { ok: false, error: "El archivo no se puede leer (¿está dañado o protegido?)." };
    if (e instanceof Anthropic.APIError) return { ok: false, error: `Error del servicio de lectura (${e.status}). Prueba de nuevo.` };
    return { ok: false, error: "No se ha podido conectar con el servicio de lectura." };
  }
}
