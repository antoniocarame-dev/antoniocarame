import type { Database } from "./supabase/database.types";
type E = Database["public"]["Enums"];

export const SECCIONES_INFORME = {
  resumen: "Resumen del proyecto", kpis: "Indicadores", resultados: "Cuenta de resultados y antes/después",
  diagnostico: "Diagnóstico", costes: "Costes y escandallos", acciones: "Plan de mejora",
  estandares: "Estándares y formación", tareas_cliente: "Pendiente por vuestra parte", actas: "Reuniones del periodo",
} as const;
export const POR_TIPO: Record<E["tipo_informe"], string[]> = {
  diagnostico: ["resumen", "diagnostico", "costes", "acciones"],
  seguimiento: ["resumen", "kpis", "resultados", "acciones", "estandares", "tareas_cliente", "actas"],
  cierre: ["resumen", "kpis", "resultados", "diagnostico", "acciones", "estandares", "costes"],
};

