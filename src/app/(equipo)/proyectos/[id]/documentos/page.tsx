import { Documentos } from "@/components/documentos";
import { getSesion, puedeEditarProyecto } from "@/lib/sesion";
import { cargarDocs, comentariosDocs } from "@/lib/docs";
import { comentar } from "@/app/acciones/plan";

export default async function Docs({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSesion();
  const editar = await puedeEditarProyecto(id);
  const [{ docs, carpetas }, coms] = await Promise.all([cargarDocs(s, { proyecto_id: id }), comentariosDocs(s, id)]);
  return (
    <Documentos ambito={{ proyecto_id: id }} docs={docs} carpetas={carpetas} editar={editar} esCliente={false} comentarios={coms}
      comentar={async (docId, fd) => { "use server"; return comentar(id, "documento", docId, fd); }} />
  );
}
