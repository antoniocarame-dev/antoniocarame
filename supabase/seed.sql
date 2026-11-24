-- =============================================================
-- Datos de ejemplo · 3 negocios ficticios de la provincia de Cádiz
-- Usuario de prueba: admin@demo.test / demo1234 (uso personal: un solo usuario)
-- =============================================================

create or replace function pg_temp.crear_usuario(uid uuid, mail text, nombre text, rol text) returns void
language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
    crypt('demo1234', gen_salt('bf')), now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'rol',rol),
    jsonb_build_object('nombre', nombre), now(), now(), '', '', '', '');
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid::text, uid, jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
    'email', now(), now(), now());
end $$;

select pg_temp.crear_usuario('a0000000-0000-0000-0000-000000000001', 'admin@demo.test',    'Antonio Caramé', 'admin');

update organizaciones set nombre = 'AC Soluciones Gastronómicas Integrales';
update perfiles set tarifa_hora = 65 where id = 'a0000000-0000-0000-0000-000000000001';

-- ---------- Plantillas de auditoría (escala 0-4 por ítem) ----------
insert into plantillas (organizacion_id, tipo, area, nombre, descripcion, contenido)
select o.id, 'auditoria', x.area::area_auditoria, x.nombre, x.descr, x.contenido::jsonb
from organizaciones o, (values
('cocina','Auditoría de cocina','Organización, producción y control en cocina caliente y fría.',
 '{"secciones":[{"titulo":"Organización y producción","items":[
   {"id":"coc1","texto":"Existe partida y responsable asignado por puesto en cada servicio"},
   {"id":"coc2","texto":"La producción diaria se calcula con previsión de ventas, no a ojo"},
   {"id":"coc3","texto":"Se usan fichas técnicas con gramajes en las elaboraciones principales"},
   {"id":"coc4","texto":"El mise en place está listo 30 min antes del servicio"},
   {"id":"coc5","texto":"Tiempo de salida de plato dentro del estándar definido"}]},
  {"titulo":"Control y mermas","items":[
   {"id":"coc6","texto":"Se registran las mermas diarias con motivo"},
   {"id":"coc7","texto":"Los productos abiertos están etiquetados con fecha (FIFO)"},
   {"id":"coc8","texto":"El aceite de fritura se controla con medidor de compuestos polares"},
   {"id":"coc9","texto":"Los equipos tienen plan de mantenimiento y limpieza"}]}]}'),
('compras','Auditoría de compras','Proveedores, precios, pedidos y recepción de mercancía.',
 '{"secciones":[{"titulo":"Proveedores y precios","items":[
   {"id":"com1","texto":"Hay un listado de proveedores con condiciones pactadas por escrito"},
   {"id":"com2","texto":"Se comparan precios al menos trimestralmente"},
   {"id":"com3","texto":"Se revisan las facturas contra los albaranes"},
   {"id":"com4","texto":"Hay una sola persona responsable de hacer pedidos"}]},
  {"titulo":"Pedidos y recepción","items":[
   {"id":"com5","texto":"Los pedidos se hacen según stock mínimo/máximo definido"},
   {"id":"com6","texto":"En la recepción se comprueban peso, temperatura y calidad"},
   {"id":"com7","texto":"Las incidencias de proveedor se registran y reclaman"}]}]}'),
('almacen','Auditoría de almacén y cámaras','Orden, rotación, temperaturas e inventario.',
 '{"secciones":[{"titulo":"Orden y rotación","items":[
   {"id":"alm1","texto":"Cada producto tiene ubicación fija y señalizada"},
   {"id":"alm2","texto":"Se aplica FIFO/FEFO de forma visible"},
   {"id":"alm3","texto":"No hay producto caducado ni sin identificar"},
   {"id":"alm4","texto":"Las cámaras mantienen temperatura y se registra a diario"}]},
  {"titulo":"Inventario","items":[
   {"id":"alm5","texto":"Se hace inventario valorado al menos mensual"},
   {"id":"alm6","texto":"El stock medio está dentro de los días de cobertura objetivo"},
   {"id":"alm7","texto":"Las diferencias de inventario se analizan"}]}]}'),
('sala','Auditoría de sala','Servicio, procesos de sala y venta sugerida.',
 '{"secciones":[{"titulo":"Servicio","items":[
   {"id":"sal1","texto":"Se recibe y acomoda al cliente en menos de 2 minutos"},
   {"id":"sal2","texto":"El equipo conoce la carta, los alérgenos y las sugerencias"},
   {"id":"sal3","texto":"Se hace venta sugerida (bebida, entrante, postre, café)"},
   {"id":"sal4","texto":"La comanda llega a cocina sin errores ni duplicados"}]},
  {"titulo":"Organización","items":[
   {"id":"sal5","texto":"Hay plano de mesas y rangos asignados por camarero"},
   {"id":"sal6","texto":"Existe checklist de apertura y cierre de sala"},
   {"id":"sal7","texto":"Se controla la rotación de mesas en horas punta"}]}]}'),
('carta','Auditoría de carta','Estructura, precios y rentabilidad de la oferta.',
 '{"secciones":[{"titulo":"Estructura","items":[
   {"id":"car1","texto":"La carta tiene un número de referencias manejable para la cocina"},
   {"id":"car2","texto":"Los platos estrella están en las zonas de mayor lectura"},
   {"id":"car3","texto":"La información de alérgenos está disponible y actualizada"}]},
  {"titulo":"Rentabilidad","items":[
   {"id":"car4","texto":"Todos los platos tienen escandallo actualizado"},
   {"id":"car5","texto":"El food cost de la carta está dentro del objetivo"},
   {"id":"car6","texto":"Se analiza la venta por plato (popularidad y margen)"}]}]}'),
('equipo','Auditoría de equipo','Organización del personal, formación y clima.',
 '{"secciones":[{"titulo":"Organización","items":[
   {"id":"equ1","texto":"Los cuadrantes se ajustan a la previsión de ventas"},
   {"id":"equ2","texto":"Cada puesto tiene funciones definidas por escrito"},
   {"id":"equ3","texto":"Existe manual de bienvenida para nuevas incorporaciones"}]},
  {"titulo":"Formación y clima","items":[
   {"id":"equ4","texto":"Hay plan de formación anual"},
   {"id":"equ5","texto":"Se hacen reuniones breves antes del servicio"},
   {"id":"equ6","texto":"La rotación de personal es inferior a la media del sector"}]}]}'),
('experiencia_cliente','Auditoría de experiencia de cliente','Lo que vive el cliente de la puerta a la cuenta.',
 '{"secciones":[{"titulo":"Recorrido","items":[
   {"id":"exp1","texto":"Fachada, entrada y baños limpios y cuidados"},
   {"id":"exp2","texto":"Tiempo de espera para la cuenta inferior a 5 minutos"},
   {"id":"exp3","texto":"Se responden las reseñas online en menos de 48 h"},
   {"id":"exp4","texto":"Valoración media en reseñas igual o superior a 4,3"}]}]}'),
('appcc','Auditoría APPCC','Autocontrol sanitario y registros obligatorios.',
 '{"secciones":[{"titulo":"Registros","items":[
   {"id":"app1","texto":"Registro diario de temperaturas de cámaras al día"},
   {"id":"app2","texto":"Plan de limpieza y desinfección documentado y firmado"},
   {"id":"app3","texto":"Plan de control de plagas con empresa autorizada"},
   {"id":"app4","texto":"Trazabilidad de lotes en productos recepcionados"},
   {"id":"app5","texto":"Manipuladores con formación acreditada"},
   {"id":"app6","texto":"Carta de alérgenos firmada y accesible"}]}]}')
) as x(area, nombre, descr, contenido);

-- ---------- Negocios ----------
insert into negocios (id, organizacion_id, nombre, tipo, grupo, direccion, localidad, aforo, horarios, ticket_medio, plantilla, food_cost_objetivo, notas)
select v.id::uuid, o.id, v.nombre, v.tipo::tipo_negocio, v.grupo, v.dir, v.loc, v.aforo, v.hor, v.ticket, v.plant, v.fc, v.notas
from organizaciones o, (values
 ('b0000000-0000-0000-0000-000000000001','Freiduría El Varadero','bar',null,'C/ Muelle 14','Cádiz',70,'Mar-Dom 12:30-16:30 y 20:00-00:00',17.50,9,0.32,
  'Local lleno los fines de semana pero con márgenes ajustados. Mucho volumen en para llevar.'),
 ('b0000000-0000-0000-0000-000000000002','Restaurante Marisma','restaurante',null,'Av. de la Barrosa 120','Chiclana de la Frontera',85,'Mié-Lun 13:00-16:00 y 20:30-23:30',38.00,14,0.30,
  'Cocina de mercado. Carta larga (46 referencias) que la cocina no llega a sacar con regularidad.'),
 ('b0000000-0000-0000-0000-000000000003','Hotel Arenas de Levante · Restaurante','hotel','Arenas Hoteles','Paseo Marítimo 3','El Puerto de Santa María',140,'Desayunos 7:30-11:00 · Comidas y cenas',29.00,26,0.28,
  'Hotel de 92 habitaciones. Buffet de desayuno y restaurante a la carta abierto al público.')
) as v(id,nombre,tipo,grupo,dir,loc,aforo,hor,ticket,plant,fc,notas);

insert into contactos (negocio_id, nombre, cargo, email, telefono, principal) values
 ('b0000000-0000-0000-0000-000000000001','Manolo Sánchez','Propietario','varadero@demo.test','600 111 222',true),
 ('b0000000-0000-0000-0000-000000000001','Rocío Gil','Jefa de cocina',null,'600 111 333',false),
 ('b0000000-0000-0000-0000-000000000002','Carmen Ruiz','Propietaria y chef','marisma@demo.test','600 222 333',true),
 ('b0000000-0000-0000-0000-000000000003','Javier Moreno','Director del hotel','direccion@arenas.test','956 000 111',true),
 ('b0000000-0000-0000-0000-000000000003','Elena Torres','Maître','sala@arenas.test','956 000 112',false);

-- ---------- Proyectos ----------
insert into proyectos (id, organizacion_id, negocio_id, codigo, titulo, tipo, estado, salud, responsable_id, fecha_inicio, fecha_fin, objetivos, alcance)
select v.id::uuid, o.id, v.neg::uuid, v.cod, v.tit, v.tipo, v.est::estado_proyecto, v.sal::salud_proyecto, v.resp::uuid, v.ini::date, v.fin::date, v.obj, v.alc
from organizaciones o, (values
 ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','P-2026-07','Control de costes y reorganización de cocina','control_costes','en_curso','ambar','a0000000-0000-0000-0000-000000000001','2026-07-01','2027-01-31',
  'Bajar el food cost del 38 % al 32 %. Reducir mermas de fritura a la mitad. Tiempo de pase por debajo de 12 minutos en hora punta.',
  'Diagnóstico de cocina, compras y almacén. Escandallo de los 20 platos más vendidos. Plan de producción diario. Formación del equipo de cocina.'),
 ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','P-2026-11','Rediseño de carta e ingeniería de menú','rediseno_carta','diagnostico','verde','a0000000-0000-0000-0000-000000000001','2026-11-04','2027-03-15',
  'Pasar de 46 a 28 referencias. Food cost de carta por debajo del 30 %. Subir el ticket medio a 42 €.',
  'Auditoría de carta y cocina, análisis de ventas por plato, nueva carta con escandallos y formación de sala en venta sugerida.'),
 ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','P-2026-03','Estandarización de sala y formación de equipo','formacion','seguimiento','verde','a0000000-0000-0000-0000-000000000001','2026-03-02','2026-12-20',
  'Procedimientos de sala escritos para desayuno y restaurante. Valoración media en reseñas ≥ 4,4. Rotación de personal por debajo del 30 %.',
  'SOPs de apertura, servicio y cierre, manual de bienvenida, 6 sesiones de formación y seguimiento mensual.'),
 ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000001','P-2026-02','Puesta en marcha de terraza de verano','apertura','cerrado','verde','a0000000-0000-0000-0000-000000000001','2026-02-15','2026-05-31',
  'Abrir la terraza para Semana Santa con carta reducida.',
  'Carta de terraza, distribución de mesas y cuadrante de personal.')
) as v(id,neg,cod,tit,tipo,est,sal,resp,ini,fin,obj,alc);

insert into proyecto_finanzas (proyecto_id, horas_presupuestadas, horas_consumidas, importe_presupuestado, tarifa_hora) values
 ('c0000000-0000-0000-0000-000000000001', 120, 96, 7200, 60),
 ('c0000000-0000-0000-0000-000000000002', 90, 14, 5400, 60),
 ('c0000000-0000-0000-0000-000000000003', 70, 61, 4200, 60),
 ('c0000000-0000-0000-0000-000000000004', 30, 34, 1800, 60);

insert into proyecto_miembros (proyecto_id, usuario_id, rol)
select id, 'a0000000-0000-0000-0000-000000000001', 'consultor' from proyectos;

-- ---------- Fases e hitos ----------
insert into fases (proyecto_id, nombre, orden, fecha_inicio, fecha_fin, estado) values
 ('c0000000-0000-0000-0000-000000000001','Diagnóstico',1,'2026-07-01','2026-07-31','completada'),
 ('c0000000-0000-0000-0000-000000000001','Plan de acción',2,'2026-08-01','2026-09-15','completada'),
 ('c0000000-0000-0000-0000-000000000001','Implantación',3,'2026-09-16','2026-12-15','en_curso'),
 ('c0000000-0000-0000-0000-000000000001','Seguimiento',4,'2026-12-16','2027-01-31','pendiente'),
 ('c0000000-0000-0000-0000-000000000002','Diagnóstico',1,'2026-11-04','2026-12-05','en_curso'),
 ('c0000000-0000-0000-0000-000000000002','Diseño de nueva carta',2,'2026-12-06','2027-02-01','pendiente'),
 ('c0000000-0000-0000-0000-000000000002','Lanzamiento y formación',3,'2027-02-02','2027-03-15','pendiente'),
 ('c0000000-0000-0000-0000-000000000003','Diagnóstico',1,'2026-03-02','2026-03-31','completada'),
 ('c0000000-0000-0000-0000-000000000003','SOPs y manual',2,'2026-04-01','2026-06-15','completada'),
 ('c0000000-0000-0000-0000-000000000003','Formación',3,'2026-06-16','2026-09-30','completada'),
 ('c0000000-0000-0000-0000-000000000003','Seguimiento',4,'2026-10-01','2026-12-20','en_curso');

insert into hitos (proyecto_id, titulo, fecha, completado) values
 ('c0000000-0000-0000-0000-000000000001','Informe de diagnóstico entregado','2026-07-31',true),
 ('c0000000-0000-0000-0000-000000000001','Escandallos de los 20 platos top','2026-10-15',true),
 ('c0000000-0000-0000-0000-000000000001','Plan de producción diario en marcha','2026-11-30',false),
 ('c0000000-0000-0000-0000-000000000001','Food cost ≤ 33 % dos meses seguidos','2027-01-31',false),
 ('c0000000-0000-0000-0000-000000000002','Diagnóstico de carta presentado','2026-12-05',false),
 ('c0000000-0000-0000-0000-000000000003','Manual de sala impreso y firmado','2026-06-15',true),
 ('c0000000-0000-0000-0000-000000000003','Informe de cierre','2026-12-20',false);

-- ---------- Auditorías con respuestas ----------
-- Se copia el contenido de la plantilla y se generan respuestas con un sesgo por área
create or replace function pg_temp.auditar(p uuid, a text, fecha date, sesgo int, auditor uuid) returns void
language plpgsql as $$
declare aud uuid; pl plantillas;
begin
  select * into pl from plantillas where area = a::area_auditoria limit 1;
  insert into auditorias (proyecto_id, plantilla_id, area, titulo, fecha, auditor_id, estado, contenido)
  values (p, pl.id, pl.area, pl.nombre, fecha, auditor, 'completada', pl.contenido) returning id into aud;
  insert into auditoria_respuestas (auditoria_id, item_id, valor, nota)
  select aud, it->>'id', greatest(0, least(4, sesgo + (abs(hashtext(it->>'id' || p::text)) % 3) - 1)), null
  from jsonb_array_elements(pl.contenido->'secciones') s, jsonb_array_elements(s->'items') it;
  perform recalcular_puntuacion(aud);
end $$;

select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','cocina','2026-07-08',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','compras','2026-07-10',1,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','almacen','2026-07-10',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','sala','2026-07-12',3,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','carta','2026-07-15',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','equipo','2026-07-15',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','appcc','2026-07-17',3,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000002','carta','2026-11-12',1,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000002','cocina','2026-11-13',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','sala','2026-03-10',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','experiencia_cliente','2026-03-11',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','equipo','2026-03-12',1,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','sala','2026-10-20',3,'a0000000-0000-0000-0000-000000000001');

-- ---------- Hallazgos ----------
insert into hallazgos (id, proyecto_id, tipo, muda, dafo, area, titulo, descripcion, impacto, esfuerzo, coste_estimado, creado_por) values
 ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','muda','sobreproduccion',null,'cocina','Se rebozan 8 kg de pescado antes de cada servicio',
  'Se prepara la misma cantidad cada día sin mirar reservas ni día de la semana. Martes y miércoles se tira cerca del 30 %.',5,2,620,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','muda','defectos_mermas',null,'cocina','Aceite de fritura cambiado sin criterio',
  'Se cambia cada 2 días “por si acaso”. Con medidor de compuestos polares se podría alargar a 4-5 días.',4,1,380,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','muda','esperas',null,'sala','Cuello de botella en el pase de 21:30 a 22:30',
  'Los fritos salen tarde porque una sola freidora atiende sala y para llevar. Mesas esperando 18-22 minutos.',4,3,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','muda','inventario',null,'almacen','Exceso de stock en bebidas y aceite',
  'Hay más de 40 días de cobertura en refrescos y 120 litros de aceite almacenados. Dinero parado.',3,1,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','muda','movimientos',null,'cocina','La cámara de pescado está lejos de la freidora',
  'El cocinero de fritura recorre unos 15 metros en cada reposición durante el servicio.',2,3,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000001','muda','sobreprocesos',null,'sala','Comandas apuntadas en papel y luego en el TPV',
  'Doble trabajo y errores: 3-4 platos mal comandados por servicio.',3,2,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000001','muda','transporte',null,'compras','Compras al cash dos veces por semana',
  'El dueño va en persona al cash and carry. Unas 6 horas a la semana que se podrían cubrir con reparto.',2,2,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000001','dafo',null,'fortaleza',null,'Marca muy conocida en el barrio y entre turistas',null,4,1,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000001','dafo',null,'debilidad',null,'Sin escandallos: nadie sabe cuánto cuesta cada plato',null,5,3,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000001','dafo',null,'oportunidad',null,'Crecimiento de la venta para llevar en verano',null,3,2,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000001','dafo',null,'amenaza',null,'Subida del precio del pescado y del aceite',null,4,4,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000002','muda','sobreproduccion',null,'carta','46 referencias en carta con 9 platos que no llegan a 5 ventas al mes',
  'Obligan a mantener género que se pierde.',5,3,900,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000002','dafo',null,'fortaleza',null,'Producto local de calidad y buena relación con proveedores de lonja',null,4,1,null,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000003','muda','esperas',null,'sala','Cola en el buffet de desayuno entre 9:00 y 10:00',null,4,2,null,'a0000000-0000-0000-0000-000000000001');

-- ---------- KPIs y valores mensuales ----------
insert into kpis (id, proyecto_id, codigo, nombre, unidad, valor_base, objetivo, sentido) values
 ('e0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','food_cost','Food cost','%',38.5,32,'bajar'),
 ('e0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','mermas','Mermas sobre ventas','%',6.2,3,'bajar'),
 ('e0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','tiempo_pase','Tiempo de pase en hora punta','min',19,12,'bajar'),
 ('e0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','ticket_medio','Ticket medio','€',17.5,19,'subir'),
 ('e0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000002','food_cost','Food cost de carta','%',35.2,30,'bajar'),
 ('e0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','ticket_medio','Ticket medio','€',38,42,'subir'),
 ('e0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000003','resenas','Valoración media en reseñas','pts',4.1,4.4,'subir'),
 ('e0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000003','rotacion','Rotación de personal anual','%',42,30,'bajar');

insert into kpi_valores (kpi_id, periodo, valor) values
 ('e0000000-0000-0000-0000-000000000001','2026-06-01',38.5),('e0000000-0000-0000-0000-000000000001','2026-07-01',38.1),
 ('e0000000-0000-0000-0000-000000000001','2026-08-01',37.4),('e0000000-0000-0000-0000-000000000001','2026-09-01',36.0),
 ('e0000000-0000-0000-0000-000000000001','2026-10-01',34.6),('e0000000-0000-0000-0000-000000000001','2026-11-01',34.1),
 ('e0000000-0000-0000-0000-000000000002','2026-06-01',6.2),('e0000000-0000-0000-0000-000000000002','2026-07-01',6.0),
 ('e0000000-0000-0000-0000-000000000002','2026-08-01',5.4),('e0000000-0000-0000-0000-000000000002','2026-09-01',4.6),
 ('e0000000-0000-0000-0000-000000000002','2026-10-01',4.1),('e0000000-0000-0000-0000-000000000002','2026-11-01',3.8),
 ('e0000000-0000-0000-0000-000000000003','2026-07-01',19),('e0000000-0000-0000-0000-000000000003','2026-08-01',18),
 ('e0000000-0000-0000-0000-000000000003','2026-09-01',16),('e0000000-0000-0000-0000-000000000003','2026-10-01',14.5),
 ('e0000000-0000-0000-0000-000000000003','2026-11-01',14),
 ('e0000000-0000-0000-0000-000000000004','2026-07-01',17.5),('e0000000-0000-0000-0000-000000000004','2026-08-01',17.9),
 ('e0000000-0000-0000-0000-000000000004','2026-09-01',18.2),('e0000000-0000-0000-0000-000000000004','2026-10-01',18.4),
 ('e0000000-0000-0000-0000-000000000004','2026-11-01',18.6),
 ('e0000000-0000-0000-0000-000000000005','2026-11-01',35.2),('e0000000-0000-0000-0000-000000000006','2026-11-01',38),
 ('e0000000-0000-0000-0000-000000000007','2026-03-01',4.1),('e0000000-0000-0000-0000-000000000007','2026-05-01',4.2),
 ('e0000000-0000-0000-0000-000000000007','2026-07-01',4.3),('e0000000-0000-0000-0000-000000000007','2026-09-01',4.4),
 ('e0000000-0000-0000-0000-000000000007','2026-11-01',4.5),
 ('e0000000-0000-0000-0000-000000000008','2026-03-01',42),('e0000000-0000-0000-0000-000000000008','2026-11-01',31);

-- ---------- Acciones PDCA ----------
insert into acciones (id, proyecto_id, hallazgo_id, kpi_id, titulo, descripcion, fase_pdca, responsable_id, fecha_objetivo, prioridad, resultado) values
 ('f0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000002',
  'Plan de producción diario según reservas y día de la semana','Tabla de producción por día con cantidades de rebozado y descarte medido.','verificar','a0000000-0000-0000-0000-000000000001','2026-11-30','alta',
  'Desde octubre las mermas de pescado han bajado un 40 %. Falta consolidar los domingos.'),
 ('f0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001',
  'Control del aceite con medidor de compuestos polares','Medición diaria y cambio al llegar al 24 % de compuestos polares.','actuar',null,'2026-10-31','media',
  'Cambio cada 4,5 días de media. Ahorro de unos 320 €/mes. Se estandariza en el checklist de cierre.'),
 ('f0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000003',
  'Freidora dedicada para pedidos para llevar','Separar flujos de sala y para llevar en hora punta.','hacer',null,'2026-12-15','alta',null),
 ('f0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000006',null,
  'Comandero digital en sala','Eliminar la comanda en papel.','planificar','a0000000-0000-0000-0000-000000000001','2027-01-15','media',null),
 ('f0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000004',null,
  'Stock mínimo y máximo en bebidas y aceite','Definir niveles y pedido semanal fijo.','hacer','a0000000-0000-0000-0000-000000000001','2026-11-20','media',null),
 ('f0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000005',
  'Reducir la carta a 28 referencias','Usar ventas de los últimos 6 meses y escandallos.','planificar','a0000000-0000-0000-0000-000000000001','2027-01-20','alta',null),
 ('f0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000014','e0000000-0000-0000-0000-000000000007',
  'Segundo punto de huevos y café en el buffet','Duplicar estación caliente entre 9:00 y 10:30.','verificar','a0000000-0000-0000-0000-000000000001','2026-11-15','media',
  'Cola media reducida de 7 a 2 minutos.');

-- ---------- Tareas ----------
insert into tareas (proyecto_id, accion_id, titulo, estado, prioridad, responsable_id, vence, orden) values
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','Registrar descartes de pescado cada noche','en_curso','alta',null,'2026-11-30',1),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','Revisar tabla de producción con jefa de cocina','hecha','media','a0000000-0000-0000-0000-000000000001','2026-11-10',2),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','Pedir presupuesto de segunda freidora','pendiente','alta',null,'2026-11-20',3),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','Redistribuir puesto de fritura para llevar','pendiente','media','a0000000-0000-0000-0000-000000000001','2026-12-10',4),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000005','Definir stock mínimo y máximo de bebidas','en_curso','media','a0000000-0000-0000-0000-000000000001','2026-11-18',5),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000004','Pedir demo de dos comanderos digitales','pendiente','baja','a0000000-0000-0000-0000-000000000001','2026-12-20',6),
 ('c0000000-0000-0000-0000-000000000001',null,'Enviar facturas de octubre a la consultora','bloqueada','media',null,'2026-11-15',7),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000002','Añadir medición de aceite al checklist de cierre','hecha','media','a0000000-0000-0000-0000-000000000001','2026-10-31',8),
 ('c0000000-0000-0000-0000-000000000002',null,'Exportar ventas por plato de los últimos 6 meses del TPV','pendiente','alta',null,'2026-11-28',1),
 ('c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000006','Escandallar los 46 platos actuales','en_curso','alta','a0000000-0000-0000-0000-000000000001','2026-12-05',2),
 ('c0000000-0000-0000-0000-000000000002',null,'Fotografiar la carta actual y la pizarra de sugerencias','hecha','baja',null,'2026-11-10',3),
 ('c0000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000007','Medir colas del buffet durante dos semanas','hecha','media','a0000000-0000-0000-0000-000000000001','2026-11-10',1),
 ('c0000000-0000-0000-0000-000000000003',null,'Preparar informe de cierre','pendiente','alta','a0000000-0000-0000-0000-000000000001','2026-12-15',2),
 ('c0000000-0000-0000-0000-000000000003',null,'Sesión de refresco de alérgenos con el turno de tarde','pendiente','media','a0000000-0000-0000-0000-000000000001','2026-11-21',3);

-- ---------- Agenda ----------
insert into eventos (organizacion_id, proyecto_id, tipo, titulo, inicio, fin, lugar, creado_por)
select o.id, v.p::uuid, v.t::tipo_evento, v.tit, v.ini::timestamptz, v.fin::timestamptz, v.lug, 'a0000000-0000-0000-0000-000000000001'
from organizaciones o, (values
 ('c0000000-0000-0000-0000-000000000001','visita','Visita de seguimiento en cocina','2026-11-26 10:00+01','2026-11-26 12:30+01','Freiduría El Varadero'),
 ('c0000000-0000-0000-0000-000000000002','auditoria','Auditoría de sala en servicio de cena','2026-11-28 20:30+01','2026-11-28 23:30+01','Restaurante Marisma'),
 ('c0000000-0000-0000-0000-000000000003','entrega','Entrega del informe de cierre','2026-12-15 11:00+01',null,'Hotel Arenas de Levante'),
 ('c0000000-0000-0000-0000-000000000002','reunion','Presentación del diagnóstico de carta','2026-12-05 17:00+01','2026-12-05 18:30+01','Restaurante Marisma'),
 ('c0000000-0000-0000-0000-000000000003','formacion','Formación de alérgenos · turno tarde','2026-12-02 16:00+01','2026-12-02 17:30+01','Hotel Arenas de Levante'),
 (null,'reunion','Reunión HORECA Cádiz · mesa de transformación','2026-12-10 10:00+01','2026-12-10 13:00+01','Cádiz')
) as v(p,t,tit,ini,fin,lug);

-- ---------- Actas y comentarios ----------
insert into actas (proyecto_id, fecha, titulo, asistentes, contenido, acuerdos, creado_por) values
 ('c0000000-0000-0000-0000-000000000001','2026-10-29','Revisión mensual de octubre','Manolo Sánchez, Rocío Gil, Antonio Caramé',
  'El food cost baja al 34,6 %. Las mermas de pescado siguen altas los domingos. El aceite ya se mide a diario.',
  '[{"texto":"Ajustar producción de domingo al 80 % del sábado","responsable":"Rocío Gil","hecho":false},{"texto":"Pedir presupuesto de segunda freidora","responsable":"Manolo Sánchez","hecho":false}]',
  'a0000000-0000-0000-0000-000000000001'),
 ('c0000000-0000-0000-0000-000000000002','2026-11-04','Reunión de arranque','Carmen Ruiz, Antonio Caramé',
  'Se acuerdan los objetivos y el calendario. Carmen enviará las ventas por plato del TPV.',
  '[{"texto":"Enviar exportación de ventas del TPV","responsable":"Carmen Ruiz","hecho":false}]','a0000000-0000-0000-0000-000000000001');

insert into comentarios (proyecto_id, entidad, entidad_id, autor_id, texto) values
 ('c0000000-0000-0000-0000-000000000001','accion','f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001',
  'Manolo tiene dos presupuestos de freidora. Revisar antes si la instalación eléctrica aguanta otra.');

-- ---------- Responsables del lado del cliente ----------
update acciones set responsable_externo = 'Manolo Sánchez' where id in ('f0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000003');
update tareas set responsable_externo = 'Manolo Sánchez' where titulo in ('Registrar descartes de pescado cada noche','Pedir presupuesto de segunda freidora','Enviar facturas de octubre a la consultora');
update tareas set responsable_externo = 'Carmen Ruiz' where titulo in ('Exportar ventas por plato de los últimos 6 meses del TPV','Fotografiar la carta actual y la pizarra de sugerencias');


-- =============================================================
-- Fase 2 · Compras y escandallos de Freiduría El Varadero
-- =============================================================
insert into proveedores (id, organizacion_id, nombre, cif, categoria, contacto, email, telefono, condiciones)
select v.id::uuid, o.id, v.n, v.cif, v.cat, v.con, v.mail, v.tel, v.cond from organizaciones o, (values
 ('90000000-0000-0000-0000-000000000001','Pescados Bahía Sur','B11000001','Pescado y marisco','Paco','pedidos@pescadosbahiasur.test','956 100 100','Reparto diario 7:00. Pago a 15 días.'),
 ('90000000-0000-0000-0000-000000000002','Lonja del Puerto Distribución','B11000002','Pescado y marisco','Inma','lonja@lonjapuerto.test','956 200 200','Reparto L-X-V. Pago al contado.'),
 ('90000000-0000-0000-0000-000000000003','Aceites y Secos del Sur','B11000003','Aceites, harinas, secos','Rafa','comercial@aceitesdelsur.test','956 300 300','Pedido mínimo 150 €. Pago a 30 días.'),
 ('90000000-0000-0000-0000-000000000004','Frutas Hermanos Gil','B11000004','Fruta y verdura','José Gil','pedidos@hermanosgil.test','600 400 400','Reparto diario. Pago semanal.')
) as v(id,n,cif,cat,con,mail,tel,cond);

create or replace function pg_temp.prod(nom text, fam text, un text, merma numeric, prov text, alerg text[] default '{}') returns uuid
language sql as $$
  insert into productos (negocio_id, nombre, familia, unidad, merma_pct, proveedor_habitual_id, alergenos)
  values ('b0000000-0000-0000-0000-000000000001', nom, fam, un::unidad_compra, merma, prov::uuid, alerg) returning id
$$;
create or replace function pg_temp.precio(nom text, f date, p numeric, prov text) returns void
language sql as $$
  insert into precios (producto_id, proveedor_id, fecha, precio)
  select id, prov::uuid, f, p from productos where nombre = nom and negocio_id = 'b0000000-0000-0000-0000-000000000001'
$$;

select pg_temp.prod('Chocos limpios','Pescado y marisco','kg',10,'90000000-0000-0000-0000-000000000001','{Moluscos}');
select pg_temp.prod('Cazón en adobo','Pescado y marisco','kg',5,'90000000-0000-0000-0000-000000000001','{Pescado}');
select pg_temp.prod('Boquerón fresco','Pescado y marisco','kg',35,'90000000-0000-0000-0000-000000000001','{Pescado}');
select pg_temp.prod('Pijota','Pescado y marisco','kg',30,'90000000-0000-0000-0000-000000000002','{Pescado}');
select pg_temp.prod('Gamba blanca de Huelva','Pescado y marisco','kg',45,'90000000-0000-0000-0000-000000000002','{Crustáceos}');
select pg_temp.prod('Calamar nacional','Pescado y marisco','kg',25,'90000000-0000-0000-0000-000000000002','{Moluscos}');
select pg_temp.prod('Harina especial fritura','Secos','kg',0,'90000000-0000-0000-0000-000000000003','{Gluten}');
select pg_temp.prod('Aceite de girasol alto oleico','Aceites','l',0,'90000000-0000-0000-0000-000000000003');
select pg_temp.prod('Aceite de oliva virgen extra','Aceites','l',0,'90000000-0000-0000-0000-000000000003');
select pg_temp.prod('Vinagre de Jerez','Secos','l',0,'90000000-0000-0000-0000-000000000003','{Sulfitos}');
select pg_temp.prod('Sal marina','Secos','kg',0,'90000000-0000-0000-0000-000000000003');
select pg_temp.prod('Patata','Fruta y verdura','kg',20,'90000000-0000-0000-0000-000000000004');
select pg_temp.prod('Tomate pera','Fruta y verdura','kg',10,'90000000-0000-0000-0000-000000000004');
select pg_temp.prod('Pimiento verde','Fruta y verdura','kg',15,'90000000-0000-0000-0000-000000000004');
select pg_temp.prod('Cebolla','Fruta y verdura','kg',10,'90000000-0000-0000-0000-000000000004');
select pg_temp.prod('Limón','Fruta y verdura','kg',0,'90000000-0000-0000-0000-000000000004');

-- Precios de junio a noviembre (subidas en pescado y aceite de girasol)
select pg_temp.precio(n, d::date, p, prov) from (values
 ('Chocos limpios','2026-06-10',11.50,'90000000-0000-0000-0000-000000000001'),('Chocos limpios','2026-08-12',11.90,'90000000-0000-0000-0000-000000000001'),('Chocos limpios','2026-10-14',12.40,'90000000-0000-0000-0000-000000000001'),
 ('Cazón en adobo','2026-06-10',9.80,'90000000-0000-0000-0000-000000000001'),('Cazón en adobo','2026-09-09',10.20,'90000000-0000-0000-0000-000000000001'),
 ('Boquerón fresco','2026-06-10',5.90,'90000000-0000-0000-0000-000000000001'),('Boquerón fresco','2026-09-09',6.30,'90000000-0000-0000-0000-000000000001'),
 ('Boquerón fresco','2026-10-20',6.15,'90000000-0000-0000-0000-000000000002'),
 ('Chocos limpios','2026-11-03',11.95,'90000000-0000-0000-0000-000000000002'),
 ('Pijota','2026-06-10',8.20,'90000000-0000-0000-0000-000000000002'),('Pijota','2026-10-01',8.40,'90000000-0000-0000-0000-000000000002'),
 ('Pijota','2026-08-20',7.60,'90000000-0000-0000-0000-000000000001'),
 ('Gamba blanca de Huelva','2026-06-10',28.00,'90000000-0000-0000-0000-000000000002'),('Gamba blanca de Huelva','2026-09-09',29.50,'90000000-0000-0000-0000-000000000002'),
 ('Calamar nacional','2026-06-10',14.50,'90000000-0000-0000-0000-000000000002'),('Calamar nacional','2026-09-23',14.90,'90000000-0000-0000-0000-000000000002'),
 ('Calamar nacional','2026-08-05',13.80,'90000000-0000-0000-0000-000000000001'),
 ('Harina especial fritura','2026-06-03',1.15,'90000000-0000-0000-0000-000000000003'),
 ('Aceite de girasol alto oleico','2026-06-03',1.85,'90000000-0000-0000-0000-000000000003'),('Aceite de girasol alto oleico','2026-09-02',1.98,'90000000-0000-0000-0000-000000000003'),
 ('Aceite de oliva virgen extra','2026-06-03',7.20,'90000000-0000-0000-0000-000000000003'),('Aceite de oliva virgen extra','2026-09-02',6.40,'90000000-0000-0000-0000-000000000003'),
 ('Vinagre de Jerez','2026-06-03',3.20,'90000000-0000-0000-0000-000000000003'),
 ('Sal marina','2026-06-03',0.50,'90000000-0000-0000-0000-000000000003'),
 ('Patata','2026-06-05',0.85,'90000000-0000-0000-0000-000000000004'),('Patata','2026-10-07',0.92,'90000000-0000-0000-0000-000000000004'),
 ('Tomate pera','2026-06-05',1.60,'90000000-0000-0000-0000-000000000004'),('Tomate pera','2026-10-07',1.95,'90000000-0000-0000-0000-000000000004'),
 ('Pimiento verde','2026-06-05',1.90,'90000000-0000-0000-0000-000000000004'),
 ('Cebolla','2026-06-05',0.95,'90000000-0000-0000-0000-000000000004'),
 ('Limón','2026-06-05',1.40,'90000000-0000-0000-0000-000000000004')
) as v(n,d,p,prov);

-- Dos facturas de noviembre ya validadas (generan precios) y una pendiente de revisar
insert into facturas (id, negocio_id, proveedor_id, tipo, numero, fecha, base, iva, total, estado) values
 ('91000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','factura','PBS-2026-1187','2026-11-12',612.40,61.24,673.64,'pendiente'),
 ('91000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000003','factura','AS/26/4410','2026-11-04',318.00,49.88,367.88,'pendiente'),
 ('91000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000004','albaran','HG-88213','2026-11-20',96.60,9.66,106.26,'pendiente');

insert into lineas_factura (factura_id, orden, producto_id, descripcion, cantidad, unidad, precio_unitario, iva_pct, importe)
select f::uuid, o, (select id from productos where nombre = pn and negocio_id = 'b0000000-0000-0000-0000-000000000001'), d, c, u, pu, iva, round(c * pu, 2) from (values
 ('91000000-0000-0000-0000-000000000001',1,'Chocos limpios','CHOCO LIMPIO CAL. 2 (KG)',20,'kg',12.90,10),
 ('91000000-0000-0000-0000-000000000001',2,'Cazón en adobo','CAZON ADOBADO BANDEJA (KG)',15,'kg',10.60,10),
 ('91000000-0000-0000-0000-000000000001',3,'Boquerón fresco','BOQUERON MALAGUEÑO (KG)',18,'kg',6.80,10),
 ('91000000-0000-0000-0000-000000000002',1,'Aceite de girasol alto oleico','ACEITE GIRASOL A.O. GARRAFA 25L',100,'l',2.15,10),
 ('91000000-0000-0000-0000-000000000002',2,'Harina especial fritura','HARINA FRITURA SACO 10KG',20,'kg',1.15,4),
 ('91000000-0000-0000-0000-000000000002',3,'Vinagre de Jerez','VINAGRE JEREZ 5L',10,'l',3.30,21),
 ('91000000-0000-0000-0000-000000000003',1,'Tomate pera','TOMATE PERA',25,'kg',1.95,4),
 ('91000000-0000-0000-0000-000000000003',2,'Patata','PATATA AGRIA SACO 25KG',50,'kg',0.92,4)
) as v(f,o,pn,d,c,u,pu,iva);
select validar_factura('91000000-0000-0000-0000-000000000001');
select validar_factura('91000000-0000-0000-0000-000000000002');

-- Escandallos
insert into escandallos (id, negocio_id, tipo, nombre, categoria, raciones, rendimiento, unidad_rendimiento, pvp, elaboracion) values
 ('92000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','elaboracion','Picadillo','Bases',1,2,'kg',null,'Tomate, pimiento y cebolla en brunoise. Aliñar con aceite y vinagre de Jerez. Reposo 2 h.'),
 ('92000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','plato','Chocos fritos','Fritos',1,null,null,14.00,'Cortar en tiras, enharinar, sacudir y freír a 180 °C.'),
 ('92000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','plato','Cazón en adobo','Fritos',1,null,null,12.00,null),
 ('92000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000001','plato','Boquerones fritos','Fritos',1,null,null,10.00,null),
 ('92000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000001','plato','Gambas a la plancha','Plancha',1,null,null,18.00,null),
 ('92000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000001','plato','Calamares fritos','Fritos',1,null,null,15.00,null),
 ('92000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000001','plato','Papas aliñás','Frías',1,null,null,6.50,null),
 ('92000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000001','plato','Pijotas fritas','Fritos',1,null,null,13.00,null);

insert into ingredientes_escandallo (escandallo_id, orden, producto_id, sub_escandallo_id, cantidad)
select e::uuid, o, (select id from productos where nombre = pn and negocio_id = 'b0000000-0000-0000-0000-000000000001'), sub::uuid, c from (values
 ('92000000-0000-0000-0000-000000000001',1,'Tomate pera',null,1.2),('92000000-0000-0000-0000-000000000001',2,'Pimiento verde',null,0.5),
 ('92000000-0000-0000-0000-000000000001',3,'Cebolla',null,0.5),('92000000-0000-0000-0000-000000000001',4,'Aceite de oliva virgen extra',null,0.15),
 ('92000000-0000-0000-0000-000000000001',5,'Vinagre de Jerez',null,0.05),
 ('92000000-0000-0000-0000-000000000002',1,'Chocos limpios',null,0.25),('92000000-0000-0000-0000-000000000002',2,'Harina especial fritura',null,0.04),
 ('92000000-0000-0000-0000-000000000002',3,'Aceite de girasol alto oleico',null,0.06),('92000000-0000-0000-0000-000000000002',4,'Limón',null,0.03),
 ('92000000-0000-0000-0000-000000000003',1,'Cazón en adobo',null,0.25),('92000000-0000-0000-0000-000000000003',2,'Harina especial fritura',null,0.04),
 ('92000000-0000-0000-0000-000000000003',3,'Aceite de girasol alto oleico',null,0.06),
 ('92000000-0000-0000-0000-000000000004',1,'Boquerón fresco',null,0.30),('92000000-0000-0000-0000-000000000004',2,'Harina especial fritura',null,0.04),
 ('92000000-0000-0000-0000-000000000004',3,'Aceite de girasol alto oleico',null,0.06),
 ('92000000-0000-0000-0000-000000000005',1,'Gamba blanca de Huelva',null,0.25),('92000000-0000-0000-0000-000000000005',2,'Sal marina',null,0.005),
 ('92000000-0000-0000-0000-000000000005',3,'Aceite de oliva virgen extra',null,0.01),
 ('92000000-0000-0000-0000-000000000006',1,'Calamar nacional',null,0.25),('92000000-0000-0000-0000-000000000006',2,'Harina especial fritura',null,0.04),
 ('92000000-0000-0000-0000-000000000006',3,'Aceite de girasol alto oleico',null,0.06),
 ('92000000-0000-0000-0000-000000000007',1,'Patata',null,0.30),('92000000-0000-0000-0000-000000000007',2,null,'92000000-0000-0000-0000-000000000001',0.10),
 ('92000000-0000-0000-0000-000000000007',3,'Aceite de oliva virgen extra',null,0.02),
 ('92000000-0000-0000-0000-000000000008',1,'Pijota',null,0.30),('92000000-0000-0000-0000-000000000008',2,'Harina especial fritura',null,0.04),
 ('92000000-0000-0000-0000-000000000008',3,'Aceite de girasol alto oleico',null,0.06)
) as v(e,o,pn,sub,c);

insert into ventas_plato (escandallo_id, periodo, unidades) values
 ('92000000-0000-0000-0000-000000000002','2026-10-01',640),('92000000-0000-0000-0000-000000000003','2026-10-01',520),
 ('92000000-0000-0000-0000-000000000004','2026-10-01',410),('92000000-0000-0000-0000-000000000005','2026-10-01',95),
 ('92000000-0000-0000-0000-000000000006','2026-10-01',380),('92000000-0000-0000-0000-000000000007','2026-10-01',300),
 ('92000000-0000-0000-0000-000000000008','2026-10-01',120),
 ('92000000-0000-0000-0000-000000000002','2026-11-01',590),('92000000-0000-0000-0000-000000000003','2026-11-01',505),
 ('92000000-0000-0000-0000-000000000004','2026-11-01',360),('92000000-0000-0000-0000-000000000005','2026-11-01',80),
 ('92000000-0000-0000-0000-000000000006','2026-11-01',350),('92000000-0000-0000-0000-000000000007','2026-11-01',280),
 ('92000000-0000-0000-0000-000000000008','2026-11-01',105);

-- =============================================================
-- Inventarios, compras de octubre y mermas · Freiduría El Varadero
-- =============================================================
insert into facturas (id, negocio_id, proveedor_id, tipo, numero, fecha, base, estado) values
 ('91000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','factura','PBS-2026-1090','2026-10-31',null,'pendiente'),
 ('91000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000002','factura','LP-7741','2026-10-31',null,'pendiente'),
 ('91000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000003','factura','AS/26/4102','2026-10-30',null,'pendiente'),
 ('91000000-0000-0000-0000-000000000014','b0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000004','factura','HG-87911','2026-10-31',null,'pendiente');
insert into lineas_factura (factura_id, orden, producto_id, descripcion, cantidad, unidad, precio_unitario, iva_pct, importe)
select f::uuid, o, (select id from productos where nombre = pn and negocio_id = 'b0000000-0000-0000-0000-000000000001'), upper(pn) || ' · OCTUBRE', c, u, pu, 10, round(c * pu, 2) from (values
 ('91000000-0000-0000-0000-000000000011',1,'Chocos limpios',165,'kg',12.40),('91000000-0000-0000-0000-000000000011',2,'Cazón en adobo',135,'kg',10.20),
 ('91000000-0000-0000-0000-000000000011',3,'Boquerón fresco',130,'kg',6.30),
 ('91000000-0000-0000-0000-000000000012',1,'Calamar nacional',100,'kg',14.90),('91000000-0000-0000-0000-000000000012',2,'Pijota',38,'kg',8.40),
 ('91000000-0000-0000-0000-000000000012',3,'Gamba blanca de Huelva',26,'kg',29.50),
 ('91000000-0000-0000-0000-000000000013',1,'Harina especial fritura',105,'kg',1.15),('91000000-0000-0000-0000-000000000013',2,'Aceite de girasol alto oleico',210,'l',1.98),
 ('91000000-0000-0000-0000-000000000013',3,'Aceite de oliva virgen extra',12,'l',6.40),('91000000-0000-0000-0000-000000000013',4,'Vinagre de Jerez',2,'l',3.20),
 ('91000000-0000-0000-0000-000000000014',1,'Patata',95,'kg',0.92),('91000000-0000-0000-0000-000000000014',2,'Tomate pera',22,'kg',1.95),
 ('91000000-0000-0000-0000-000000000014',3,'Pimiento verde',9,'kg',1.90),('91000000-0000-0000-0000-000000000014',4,'Cebolla',9,'kg',0.95),
 ('91000000-0000-0000-0000-000000000014',5,'Limón',20,'kg',1.40)
) as v(f,o,pn,c,u,pu);
update facturas f set base = (select sum(importe) from lineas_factura where factura_id = f.id), iva = round((select sum(importe) from lineas_factura where factura_id = f.id) * 0.1, 2)
 where id::text like '91000000-0000-0000-0000-00000000001_';
update facturas set total = base + iva where id::text like '91000000-0000-0000-0000-00000000001_';
select validar_factura(id) from facturas where id::text like '91000000-0000-0000-0000-00000000001_';

insert into inventarios (id, negocio_id, fecha, nombre, estado) values
 ('93000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','2026-09-30','Cierre de septiembre','cerrado'),
 ('93000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','2026-10-31','Cierre de octubre','cerrado'),
 ('93000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','2026-11-23','Cierre de noviembre','abierto');
insert into inventario_lineas (inventario_id, producto_id, cantidad, precio)
select i::uuid, p.id, c, pr from (values
 ('93000000-0000-0000-0000-000000000001','Chocos limpios',14,11.90),('93000000-0000-0000-0000-000000000002','Chocos limpios',12,12.40),
 ('93000000-0000-0000-0000-000000000001','Cazón en adobo',9,10.20),('93000000-0000-0000-0000-000000000002','Cazón en adobo',11,10.20),
 ('93000000-0000-0000-0000-000000000001','Boquerón fresco',4,6.30),('93000000-0000-0000-0000-000000000002','Boquerón fresco',3,6.30),
 ('93000000-0000-0000-0000-000000000001','Calamar nacional',8,14.90),('93000000-0000-0000-0000-000000000002','Calamar nacional',9,14.90),
 ('93000000-0000-0000-0000-000000000001','Pijota',2,8.40),('93000000-0000-0000-0000-000000000002','Pijota',3,8.40),
 ('93000000-0000-0000-0000-000000000001','Gamba blanca de Huelva',3,29.50),('93000000-0000-0000-0000-000000000002','Gamba blanca de Huelva',4,29.50),
 ('93000000-0000-0000-0000-000000000001','Harina especial fritura',30,1.15),('93000000-0000-0000-0000-000000000002','Harina especial fritura',25,1.15),
 ('93000000-0000-0000-0000-000000000001','Aceite de girasol alto oleico',125,1.98),('93000000-0000-0000-0000-000000000002','Aceite de girasol alto oleico',150,1.98),
 ('93000000-0000-0000-0000-000000000001','Aceite de oliva virgen extra',10,6.40),('93000000-0000-0000-0000-000000000002','Aceite de oliva virgen extra',8,6.40),
 ('93000000-0000-0000-0000-000000000001','Patata',25,0.92),('93000000-0000-0000-0000-000000000002','Patata',20,0.92),
 ('93000000-0000-0000-0000-000000000001','Tomate pera',6,1.95),('93000000-0000-0000-0000-000000000002','Tomate pera',5,1.95),
 ('93000000-0000-0000-0000-000000000001','Limón',4,1.40),('93000000-0000-0000-0000-000000000002','Limón',5,1.40),
 ('93000000-0000-0000-0000-000000000003','Chocos limpios',10,null),('93000000-0000-0000-0000-000000000003','Cazón en adobo',8,null),
 ('93000000-0000-0000-0000-000000000003','Aceite de girasol alto oleico',95,null)
) as v(i,pn,c,pr) join productos p on p.nombre = v.pn and p.negocio_id = 'b0000000-0000-0000-0000-000000000001';
-- El inventario abierto lleva todos los productos activos, contados o no
insert into inventario_lineas (inventario_id, producto_id)
select '93000000-0000-0000-0000-000000000003', id from productos where negocio_id = 'b0000000-0000-0000-0000-000000000001'
on conflict do nothing;

insert into mermas (negocio_id, fecha, producto_id, escandallo_id, cantidad, motivo, coste, notas)
select 'b0000000-0000-0000-0000-000000000001', f::date,
  (select id from productos where nombre = pn and negocio_id = 'b0000000-0000-0000-0000-000000000001'),
  (select id from escandallos where nombre = en and negocio_id = 'b0000000-0000-0000-0000-000000000001'), c, m::motivo_merma, coste, n from (values
 ('2026-10-04','Boquerón fresco',null,4.0,'caducidad',25.20,'Pedido del viernes sin vender el domingo'),
 ('2026-10-11',null,'Chocos fritos',9,'sobreproduccion',33.40,'Rebozado de más un martes'),
 ('2026-10-18','Aceite de girasol alto oleico',null,25,'deterioro',49.50,'Cambio de freidora antes de medir'),
 ('2026-10-25',null,'Calamares fritos',4,'devolucion',16.00,'Mesa 12: aceite pasado'),
 ('2026-10-26','Gamba blanca de Huelva',null,0.8,'deterioro',23.60,null),
 ('2026-11-02',null,'Chocos fritos',6,'sobreproduccion',22.30,null),
 ('2026-11-08','Tomate pera',null,3,'caducidad',5.85,null),
 ('2026-11-15',null,'Cazón en adobo',3,'error_elaboracion',9.20,'Se quemó la tanda'),
 ('2026-11-16','Boquerón fresco',null,2.5,'caducidad',17.00,null),
 ('2026-11-22',null,'Boquerones fritos',5,'sobreproduccion',13.10,'Domingo: producción igual que sábado')
) as v(f,pn,en,c,m,coste,n);

-- =============================================================
-- Estándares y formación
-- =============================================================
insert into plantillas (organizacion_id, tipo, area, nombre, descripcion, contenido)
select o.id, x.tipo::tipo_plantilla, x.area::area_auditoria, x.nombre, x.descr, x.contenido::jsonb from organizaciones o, (values
('checklist','cocina','Checklist de cierre de cocina','Lo que se revisa cada noche antes de apagar.',
 '{"secciones":[{"titulo":"Producto","items":[{"id":"cc1","texto":"Género abierto etiquetado con fecha y tapado"},{"id":"cc2","texto":"Sobrantes registrados en la hoja de mermas"},{"id":"cc3","texto":"Pedido del día siguiente preparado según stock mínimo"}]},{"titulo":"Equipos","items":[{"id":"cc4","texto":"Aceite medido (compuestos polares) y anotado"},{"id":"cc5","texto":"Freidoras filtradas y tapadas"},{"id":"cc6","texto":"Temperaturas de cámaras anotadas"}]},{"titulo":"Limpieza","items":[{"id":"cc7","texto":"Superficies y campana limpias según plan"},{"id":"cc8","texto":"Basura y vidrio sacados"}]}]}'),
('sop','cocina','Gestión del aceite de fritura','Cómo medir, filtrar y cambiar el aceite.',
 '{"secciones":[{"titulo":"Cada servicio","items":[{"id":"ac1","texto":"Freír a 175-180 °C, nunca por encima de 185 °C"},{"id":"ac2","texto":"Sacudir la harina antes de freír para no ensuciar el aceite"}]},{"titulo":"Cada noche","items":[{"id":"ac3","texto":"Medir compuestos polares con el medidor y anotar en la hoja"},{"id":"ac4","texto":"Filtrar el aceite en frío"},{"id":"ac5","texto":"Cambiar el aceite al llegar al 24 % de compuestos polares"}]}]}'),
('checklist','compras','Recepción de mercancía','Controles al recibir a un proveedor.',
 '{"secciones":[{"titulo":"Al descargar","items":[{"id":"rm1","texto":"Comprobar peso o unidades contra el albarán"},{"id":"rm2","texto":"Temperatura de refrigerados ≤ 4 °C y congelados ≤ -18 °C"},{"id":"rm3","texto":"Aspecto, olor y calibre correctos"}]},{"titulo":"Antes de guardar","items":[{"id":"rm4","texto":"Anotar lote y fecha de caducidad"},{"id":"rm5","texto":"Colocar por FIFO: lo nuevo detrás"},{"id":"rm6","texto":"Incidencias apuntadas en el albarán y avisadas al proveedor"}]}]}'),
('sop','sala','Servicio de desayuno buffet','Montaje, reposición y cierre del buffet.',
 '{"secciones":[{"titulo":"Montaje (7:00)","items":[{"id":"db1","texto":"Encender estación caliente a las 7:00"},{"id":"db2","texto":"Carteles de alérgenos en cada bandeja"}]},{"titulo":"Servicio","items":[{"id":"db3","texto":"Reponer cuando la bandeja esté a un tercio"},{"id":"db4","texto":"Segundo punto de huevos y café abierto de 9:00 a 10:30"}]},{"titulo":"Cierre (11:00)","items":[{"id":"db5","texto":"Registrar sobrantes por producto"},{"id":"db6","texto":"Ajustar la producción del día siguiente según ocupación"}]}]}')
) as x(tipo, area, nombre, descr, contenido);

insert into estandares (proyecto_id, plantilla_id, tipo, titulo, area, contenido, estado, responsable_externo, fecha_implantacion)
select v.p::uuid, pl.id, pl.tipo::text::tipo_estandar, pl.nombre, pl.area, pl.contenido, v.est::estado_estandar, v.resp, v.f::date
from (values
 ('c0000000-0000-0000-0000-000000000001','Gestión del aceite de fritura','implantado','Rocío Gil','2026-10-15'),
 ('c0000000-0000-0000-0000-000000000001','Checklist de cierre de cocina','implantado','Rocío Gil','2026-10-31'),
 ('c0000000-0000-0000-0000-000000000001','Recepción de mercancía','en_prueba','Manolo Sánchez',null),
 ('c0000000-0000-0000-0000-000000000003','Servicio de desayuno buffet','implantado','Elena Torres','2026-06-15')
) as v(p, nombre, est, resp, f) join plantillas pl on pl.nombre = v.nombre;

insert into estandares (proyecto_id, tipo, titulo, area, contenido, estado, responsable_externo) values
 ('c0000000-0000-0000-0000-000000000001','ficha','Plan de producción diario de fritos','cocina',
  '{"secciones":[{"titulo":"Base por día (kg de pescado rebozado)","items":[{"id":"pp1","texto":"Lunes cerrado · martes 4 · miércoles 4 · jueves 5"},{"id":"pp2","texto":"Viernes 7 · sábado 9 · domingo 7 (80 % del sábado)"}]},{"titulo":"Ajustes","items":[{"id":"pp3","texto":"+1 kg por cada 10 reservas por encima de la media"},{"id":"pp4","texto":"Rebozar en dos tandas: antes del servicio y a las 21:30"}]}]}','en_prueba','Rocío Gil');

insert into formaciones (proyecto_id, estandar_id, fecha, titulo, formador, duracion_h, contenido, asistentes, valoracion) values
 ('c0000000-0000-0000-0000-000000000001',(select id from estandares where titulo='Gestión del aceite de fritura'),'2026-10-14','Control del aceite y fritura','Antonio Caramé',1.5,
  'Uso del medidor de compuestos polares, temperatura de fritura y filtrado.',
  '[{"nombre":"Rocío Gil","puesto":"Jefa de cocina","asistio":true},{"nombre":"Juanma Ruiz","puesto":"Cocinero","asistio":true},{"nombre":"Laura Díaz","puesto":"Ayudante","asistio":true},{"nombre":"Paco Mena","puesto":"Ayudante","asistio":false}]',8.5),
 ('c0000000-0000-0000-0000-000000000001',(select id from estandares where titulo='Checklist de cierre de cocina'),'2026-10-30','Cierre de cocina y registro de mermas','Antonio Caramé',1,
  'Cómo rellenar la checklist de cierre y la hoja de mermas.',
  '[{"nombre":"Rocío Gil","puesto":"Jefa de cocina","asistio":true},{"nombre":"Juanma Ruiz","puesto":"Cocinero","asistio":true},{"nombre":"Laura Díaz","puesto":"Ayudante","asistio":false},{"nombre":"Paco Mena","puesto":"Ayudante","asistio":true}]',9),
 ('c0000000-0000-0000-0000-000000000003',(select id from estandares where titulo='Servicio de desayuno buffet'),'2026-06-20','Servicio de desayuno','Antonio Caramé',2,null,
  '[{"nombre":"Elena Torres","puesto":"Maître","asistio":true},{"nombre":"Sara Vela","puesto":"Camarera","asistio":true},{"nombre":"Hugo Prieto","puesto":"Camarero","asistio":true}]',8),
 ('c0000000-0000-0000-0000-000000000003',null,'2026-11-18','Alérgenos: refresco para el turno de tarde','Antonio Caramé',1,null,
  '[{"nombre":"Sara Vela","puesto":"Camarera","asistio":true},{"nombre":"Hugo Prieto","puesto":"Camarero","asistio":false}]',null);
