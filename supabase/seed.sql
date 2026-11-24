-- =============================================================
-- Datos de ejemplo · 3 negocios ficticios de la provincia de Cádiz
-- Usuarios (contraseña para todos: demo1234)
--   admin@demo.test      Antonio · admin
--   lucia@demo.test      Lucía   · colaboradora
--   varadero@demo.test   Manolo  · cliente (Freiduría El Varadero)
--   marisma@demo.test    Carmen  · cliente (Restaurante Marisma)
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
select pg_temp.crear_usuario('a0000000-0000-0000-0000-000000000002', 'lucia@demo.test',    'Lucía Pérez',    'colaborador');
select pg_temp.crear_usuario('a0000000-0000-0000-0000-000000000003', 'varadero@demo.test', 'Manolo Sánchez', 'cliente');
select pg_temp.crear_usuario('a0000000-0000-0000-0000-000000000004', 'marisma@demo.test',  'Carmen Ruiz',    'cliente');

update organizaciones set nombre = 'AC Soluciones Gastronómicas Integrales';
update perfiles set tarifa_hora = 65 where id = 'a0000000-0000-0000-0000-000000000001';
update perfiles set tarifa_hora = 40 where id = 'a0000000-0000-0000-0000-000000000002';

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
 ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','P-2026-03','Estandarización de sala y formación de equipo','formacion','seguimiento','verde','a0000000-0000-0000-0000-000000000002','2026-03-02','2026-12-20',
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

insert into proyecto_miembros (proyecto_id, usuario_id, rol) values
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','consultor'),
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','colaborador'),
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','cliente'),
 ('c0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','consultor'),
 ('c0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003','cliente'),
 ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','consultor'),
 ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004','cliente'),
 ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002','colaborador'),
 ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','consultor');

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
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','almacen','2026-07-10',2,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','sala','2026-07-12',3,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','carta','2026-07-15',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','equipo','2026-07-15',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000001','appcc','2026-07-17',3,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000002','carta','2026-11-12',1,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000002','cocina','2026-11-13',2,'a0000000-0000-0000-0000-000000000001');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','sala','2026-03-10',2,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','experiencia_cliente','2026-03-11',2,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','equipo','2026-03-12',1,'a0000000-0000-0000-0000-000000000002');
select pg_temp.auditar('c0000000-0000-0000-0000-000000000003','sala','2026-10-20',3,'a0000000-0000-0000-0000-000000000002');

-- ---------- Hallazgos ----------
insert into hallazgos (id, proyecto_id, tipo, muda, dafo, area, titulo, descripcion, impacto, esfuerzo, coste_estimado, creado_por) values
 ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','muda','sobreproduccion',null,'cocina','Se rebozan 8 kg de pescado antes de cada servicio',
  'Se prepara la misma cantidad cada día sin mirar reservas ni día de la semana. Martes y miércoles se tira cerca del 30 %.',5,2,620,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','muda','defectos_mermas',null,'cocina','Aceite de fritura cambiado sin criterio',
  'Se cambia cada 2 días “por si acaso”. Con medidor de compuestos polares se podría alargar a 4-5 días.',4,1,380,'a0000000-0000-0000-0000-000000000001'),
 ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','muda','esperas',null,'sala','Cuello de botella en el pase de 21:30 a 22:30',
  'Los fritos salen tarde porque una sola freidora atiende sala y para llevar. Mesas esperando 18-22 minutos.',4,3,null,'a0000000-0000-0000-0000-000000000002'),
 ('d0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','muda','inventario',null,'almacen','Exceso de stock en bebidas y aceite',
  'Hay más de 40 días de cobertura en refrescos y 120 litros de aceite almacenados. Dinero parado.',3,1,null,'a0000000-0000-0000-0000-000000000002'),
 ('d0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','muda','movimientos',null,'cocina','La cámara de pescado está lejos de la freidora',
  'El cocinero de fritura recorre unos 15 metros en cada reposición durante el servicio.',2,3,null,'a0000000-0000-0000-0000-000000000002'),
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
 ('d0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000003','muda','esperas',null,'sala','Cola en el buffet de desayuno entre 9:00 y 10:00',null,4,2,null,'a0000000-0000-0000-0000-000000000002');

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
  'Control del aceite con medidor de compuestos polares','Medición diaria y cambio al llegar al 24 % de compuestos polares.','actuar','a0000000-0000-0000-0000-000000000003','2026-10-31','media',
  'Cambio cada 4,5 días de media. Ahorro de unos 320 €/mes. Se estandariza en el checklist de cierre.'),
 ('f0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000003',
  'Freidora dedicada para pedidos para llevar','Separar flujos de sala y para llevar en hora punta.','hacer','a0000000-0000-0000-0000-000000000003','2026-12-15','alta',null),
 ('f0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000006',null,
  'Comandero digital en sala','Eliminar la comanda en papel.','planificar','a0000000-0000-0000-0000-000000000002','2027-01-15','media',null),
 ('f0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000004',null,
  'Stock mínimo y máximo en bebidas y aceite','Definir niveles y pedido semanal fijo.','hacer','a0000000-0000-0000-0000-000000000002','2026-11-20','media',null),
 ('f0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000005',
  'Reducir la carta a 28 referencias','Usar ventas de los últimos 6 meses y escandallos.','planificar','a0000000-0000-0000-0000-000000000001','2027-01-20','alta',null),
 ('f0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000014','e0000000-0000-0000-0000-000000000007',
  'Segundo punto de huevos y café en el buffet','Duplicar estación caliente entre 9:00 y 10:30.','verificar','a0000000-0000-0000-0000-000000000002','2026-11-15','media',
  'Cola media reducida de 7 a 2 minutos.');

-- ---------- Tareas ----------
insert into tareas (proyecto_id, accion_id, titulo, estado, prioridad, responsable_id, vence, orden) values
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','Registrar descartes de pescado cada noche','en_curso','alta','a0000000-0000-0000-0000-000000000003','2026-11-30',1),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','Revisar tabla de producción con jefa de cocina','hecha','media','a0000000-0000-0000-0000-000000000001','2026-11-10',2),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','Pedir presupuesto de segunda freidora','pendiente','alta','a0000000-0000-0000-0000-000000000003','2026-11-20',3),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','Redistribuir puesto de fritura para llevar','pendiente','media','a0000000-0000-0000-0000-000000000002','2026-12-10',4),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000005','Definir stock mínimo y máximo de bebidas','en_curso','media','a0000000-0000-0000-0000-000000000002','2026-11-18',5),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000004','Pedir demo de dos comanderos digitales','pendiente','baja','a0000000-0000-0000-0000-000000000002','2026-12-20',6),
 ('c0000000-0000-0000-0000-000000000001',null,'Enviar facturas de octubre a la consultora','bloqueada','media','a0000000-0000-0000-0000-000000000003','2026-11-15',7),
 ('c0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000002','Añadir medición de aceite al checklist de cierre','hecha','media','a0000000-0000-0000-0000-000000000001','2026-10-31',8),
 ('c0000000-0000-0000-0000-000000000002',null,'Exportar ventas por plato de los últimos 6 meses del TPV','pendiente','alta','a0000000-0000-0000-0000-000000000004','2026-11-28',1),
 ('c0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000006','Escandallar los 46 platos actuales','en_curso','alta','a0000000-0000-0000-0000-000000000001','2026-12-05',2),
 ('c0000000-0000-0000-0000-000000000002',null,'Fotografiar la carta actual y la pizarra de sugerencias','hecha','baja','a0000000-0000-0000-0000-000000000004','2026-11-10',3),
 ('c0000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000007','Medir colas del buffet durante dos semanas','hecha','media','a0000000-0000-0000-0000-000000000002','2026-11-10',1),
 ('c0000000-0000-0000-0000-000000000003',null,'Preparar informe de cierre','pendiente','alta','a0000000-0000-0000-0000-000000000002','2026-12-15',2),
 ('c0000000-0000-0000-0000-000000000003',null,'Sesión de refresco de alérgenos con el turno de tarde','pendiente','media','a0000000-0000-0000-0000-000000000002','2026-11-21',3);

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

insert into comentarios (proyecto_id, entidad, entidad_id, autor_id, texto, interno)
select 'c0000000-0000-0000-0000-000000000001'::uuid, 'accion'::entidad_comentario, 'f0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid,
       'Tengo dos presupuestos, os los subo esta semana.', false
union all
select 'c0000000-0000-0000-0000-000000000001'::uuid, 'accion'::entidad_comentario, 'f0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid,
       'Ojo: la instalación eléctrica puede no aguantar otra freidora. Revisar antes de comprar.', true;
