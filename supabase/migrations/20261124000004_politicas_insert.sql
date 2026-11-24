-- Las políticas de lectura de proyectos y negocios no deben consultar su propia tabla:
-- en un INSERT ... RETURNING la fila nueva aún no es visible para esa subconsulta.
drop policy proyectos_ver on proyectos;
create policy proyectos_ver on proyectos for select to authenticated using (
  organizacion_id = mi_org() and (es_admin() or exists (
    select 1 from proyecto_miembros m where m.proyecto_id = proyectos.id and m.usuario_id = auth.uid())));

drop policy negocios_ver on negocios;
create policy negocios_ver on negocios for select to authenticated using (
  organizacion_id = mi_org() and (es_admin() or exists (
    select 1 from proyectos pr join proyecto_miembros m on m.proyecto_id = pr.id
    where pr.negocio_id = negocios.id and m.usuario_id = auth.uid())));
