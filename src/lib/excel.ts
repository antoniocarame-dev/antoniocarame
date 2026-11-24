import "server-only";
import ExcelJS from "exceljs";

export type Col = { titulo: string; tipo?: "texto" | "eur" | "eur4" | "pct" | "num" | "fecha"; ancho?: number };
type Valor = string | number | null | undefined;

const FORMATO: Record<NonNullable<Col["tipo"]>, string | undefined> = {
  texto: undefined, eur: '#,##0.00 "€"', eur4: '#,##0.0000 "€"', pct: "0.0%", num: "#,##0.##", fecha: "dd/mm/yyyy",
};

export function libro() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AC Consultoría";
  wb.created = new Date();
  return wb;
}

/** Añade una hoja con cabecera de marca, formatos españoles, filtro y primera fila fija. */
export function hoja(wb: ExcelJS.Workbook, nombre: string, cols: Col[], filas: Valor[][]) {
  const ws = wb.addWorksheet(nombre.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.titulo, width: c.ancho ?? Math.max(12, c.titulo.length + 4), style: FORMATO[c.tipo ?? "texto"] ? { numFmt: FORMATO[c.tipo ?? "texto"] } : {} }));
  for (const f of filas) {
    ws.addRow(f.map((v, i) => (cols[i]?.tipo === "fecha" && typeof v === "string" && v ? new Date(v.slice(0, 10) + "T12:00:00Z") : v ?? null)));
  }
  const cab = ws.getRow(1);
  cab.font = { bold: true, color: { argb: "FFFFF8EE" } };
  cab.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9E5618" } };
  cab.alignment = { vertical: "middle" };
  cab.height = 20;
  if (filas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  return ws;
}

export async function respuestaExcel(wb: ExcelJS.Workbook, archivo: string) {
  const buf = await wb.xlsx.writeBuffer();
  const nombre = archivo.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
