import { Campo, Input, Select, Textarea } from "@/components/ui/form";
import { TIPOS_NEGOCIO, opciones, type Tabla } from "@/lib/utils";

export function CamposNegocio({ n }: { n?: Tabla<"negocios"> }) {
  return (
    <>
      <Campo label="Nombre comercial"><Input name="nombre" required defaultValue={n?.nombre} /></Campo>
      <Campo label="Tipo"><Select name="tipo" defaultValue={n?.tipo ?? "restaurante"} opciones={opciones(TIPOS_NEGOCIO)} /></Campo>
      <Campo label="Grupo (si pertenece a uno)"><Input name="grupo" defaultValue={n?.grupo ?? ""} /></Campo>
      <Campo label="Dirección"><Input name="direccion" defaultValue={n?.direccion ?? ""} /></Campo>
      <Campo label="Localidad"><Input name="localidad" defaultValue={n?.localidad ?? ""} /></Campo>
      <Campo label="Provincia"><Input name="provincia" defaultValue={n?.provincia ?? "Cádiz"} /></Campo>
      <Campo label="Aforo (plazas)"><Input name="aforo" type="number" min="0" defaultValue={n?.aforo ?? ""} /></Campo>
      <Campo label="Plantilla (personas)"><Input name="plantilla" type="number" min="0" defaultValue={n?.plantilla ?? ""} /></Campo>
      <Campo label="Ticket medio (€)"><Input name="ticket_medio" type="number" step="0.01" min="0" defaultValue={n?.ticket_medio ?? ""} /></Campo>
      <Campo label="Food cost objetivo (%)"><Input name="food_cost_objetivo" type="number" step="0.5" min="0" max="100" defaultValue={n ? Number(n.food_cost_objetivo) * 100 : 30} /></Campo>
      <Campo label="Horarios" className="sm:col-span-2"><Input name="horarios" defaultValue={n?.horarios ?? ""} placeholder="Mar-Dom 13:00-16:00 y 20:00-23:30" /></Campo>
      <Campo label="Notas" className="sm:col-span-2"><Textarea name="notas" defaultValue={n?.notas ?? ""} /></Campo>
    </>
  );
}
