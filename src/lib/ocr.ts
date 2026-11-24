import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

/** Lo que extraemos de una factura o albarán de proveedor de hostelería. */
export const FacturaLeida = z.object({
  proveedor_nombre: z.string().describe("Razón social o nombre comercial del proveedor que emite el documento"),
  proveedor_cif: z.string().nullable().describe("CIF/NIF del proveedor, sin espacios. null si no aparece"),
  tipo: z.enum(["factura", "albaran"]),
  numero: z.string().nullable(),
  fecha: z.string().nullable().describe("Fecha del documento en formato AAAA-MM-DD"),
  base_imponible: z.number().nullable().describe("Suma de bases imponibles en euros"),
  cuota_iva: z.number().nullable().describe("Suma de cuotas de IVA en euros"),
  total: z.number().nullable().describe("Total del documento con IVA en euros"),
  lineas: z.array(z.object({
    descripcion: z.string().describe("Texto del artículo tal como aparece"),
    cantidad: z.number().describe("Cantidad facturada en la unidad de venta (kg, litros o unidades)"),
    unidad: z.enum(["kg", "l", "ud"]).describe("kg para peso, l para volumen, ud para unidades, cajas o bultos"),
    precio_unitario: z.number().describe("Precio por unidad SIN IVA y con el descuento de línea ya aplicado"),
    descuento_pct: z.number().describe("Descuento de línea en %; 0 si no hay"),
    iva_pct: z.number().nullable().describe("Tipo de IVA de la línea: 4, 10 o 21. null si no se indica"),
    importe: z.number().nullable().describe("Importe de la línea sin IVA"),
  })),
  avisos: z.array(z.string()).describe("Dudas de lectura: importes que no cuadran, líneas ilegibles, envases con precio por caja, etc."),
});
export type FacturaLeida = z.infer<typeof FacturaLeida>;

const INSTRUCCIONES = `Eres el auxiliar administrativo de una consultora de hostelería en España. Lees facturas y albaranes de proveedores de restaurantes (pescado, carne, fruta, bebidas, secos, limpieza) para controlar precios de compra.

Extrae los datos del documento adjunto. Criterios:
- Importes en euros como números (12,50 → 12.5). Precio unitario siempre sin IVA y con el descuento de línea aplicado.
- Si el artículo se vende por caja o bulto pero se indica el peso o volumen (p. ej. "garrafa 25 l", "caja 5 kg"), expresa cantidad y precio por kg o litro y avisa en "avisos".
- No inventes datos. Si algo no se lee, usa null y explícalo en "avisos".
- Ignora líneas de portes, envases retornables y recargos de equivalencia salvo que sean producto.
- Comprueba que la suma de líneas cuadra con la base imponible y avisa si no.`;

export async function leerFactura(archivo: Blob, mime: string): Promise<{ ok: true; datos: FacturaLeida } | { ok: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "La lectura automática no está configurada (falta ANTHROPIC_API_KEY). Rellena la factura a mano." };
  }
  const data = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  const esPdf = mime === "application/pdf";
  const tipoImagen = (["image/jpeg", "image/png", "image/webp", "image/gif"] as const).find((t) => t === mime);
  if (!esPdf && !tipoImagen) return { ok: false, error: "Solo se leen automáticamente PDF y fotos (JPG, PNG, WebP)." };

  const client = new Anthropic();
  try {
    const respuesta = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si el modelo rechaza la petición, la API la reintenta con otro modelo adecuado
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCCIONES,
      output_config: { effort: "low", format: betaZodOutputFormat(FacturaLeida) },
      messages: [{
        role: "user",
        content: [
          esPdf
            ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
            : { type: "image", source: { type: "base64", media_type: tipoImagen!, data } },
          { type: "text", text: "Extrae los datos de este documento de compra." },
        ],
      }],
    });
    if (respuesta.stop_reason === "refusal") return { ok: false, error: "No se ha podido leer este documento. Rellénalo a mano." };
    if (respuesta.stop_reason === "max_tokens") return { ok: false, error: "El documento es demasiado largo para leerlo de una vez. Divídelo en varias páginas." };
    if (!respuesta.parsed_output) return { ok: false, error: "La lectura no ha devuelto datos válidos. Rellena la factura a mano." };
    return { ok: true, datos: respuesta.parsed_output };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: "La clave de la API de Claude no es válida." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: "Demasiadas lecturas seguidas. Prueba en un minuto." };
    if (e instanceof Anthropic.BadRequestError) return { ok: false, error: "El archivo no se puede leer (¿está dañado o protegido con contraseña?)." };
    if (e instanceof Anthropic.APIError) return { ok: false, error: `Error del servicio de lectura (${e.status}). Prueba de nuevo.` };
    return { ok: false, error: "No se ha podido conectar con el servicio de lectura." };
  }
}

export { emparejarProducto } from "./texto";
