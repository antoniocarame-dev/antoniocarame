import { Campo, Input, Select } from "@/components/ui/form";
import { TIPOS_HORA } from "@/lib/consultora";
import { hoyISO } from "@/lib/utils";

export function FormHoras({ proyectos, proyectoFijo }: { proyectos: { id: string; nombre: string }[]; proyectoFijo?: string }) {
  return (
    <>
      {proyectoFijo ? <input type="hidden" name="proyecto_id" value={proyectoFijo} />
        : <Campo label="Proyecto" className="sm:col-span-2"><Select name="proyecto_id" vacio="Trabajo interno (comercial, formación propia…)" opciones={proyectos.map((p) => [p.id, p.nombre])} /></Campo>}
      <Campo label="Fecha"><Input name="fecha" type="date" defaultValue={hoyISO()} /></Campo>
      <Campo label="Horas"><Input name="horas" type="number" step="0.25" min="0.25" max="24" required /></Campo>
      <Campo label="Tipo"><Select name="tipo" defaultValue="visita" opciones={Object.entries(TIPOS_HORA)} /></Campo>
      <Campo label="Kilómetros (ida y vuelta)"><Input name="km" type="number" step="1" min="0" /></Campo>
      <Campo label="Qué has hecho" className="sm:col-span-2"><Input name="descripcion" /></Campo>
    </>
  );
}

