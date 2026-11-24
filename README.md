# AC Consultoría · plataforma de proyectos

Plataforma de **uso personal** para centralizar los proyectos de consultoría gastronómica con método de mejora continua:
diagnóstico, despilfarros (7 mudas), plan PDCA, KPIs y documentos. Los clientes no entran: reciben informes.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind 4 · componentes estilo shadcn/ui (Radix) ·
Supabase (Postgres, Auth, Storage, RLS) · Recharts.

## Qué incluye el MVP

| Área | Contenido |
|---|---|
| Panel | Proyectos activos con fase, semáforo y progreso; horas y cartera (solo admin); tareas vencidas; KPIs fuera de objetivo; agenda de 14 días |
| Proyectos | Tablero por estado (Diagnóstico / En curso / Seguimiento / Cerrado). Alta con 4 fases estándar |
| Proyecto · Resumen | Objetivos, alcance, fases, hitos, equipo, presupuesto de consultoría y margen (solo admin) |
| Proyecto · Diagnóstico | Auditorías por plantilla con checklist móvil (0-4, notas y fotos), radar por áreas, 7 mudas, DAFO, matriz impacto/esfuerzo, hallazgo → acción |
| Proyecto · Plan de mejora | KPIs con evolución mensual y objetivo, acciones PDCA vinculadas a KPI y hallazgo, kanban de tareas, comentarios |
| Proyecto · Documentos | Carpetas, versiones, visibilidad para el cliente, comentarios |
| Proyecto · Actas | Actas con acuerdos que se convierten en tareas |
| Negocios | Ficha del local, contactos, historial de proyectos, documentación general |
| Agenda | Visitas, auditorías, entregas, reuniones y formaciones |
| Biblioteca | Plantillas de auditoría (8 áreas), procedimientos y checklists, editables y versionadas. Un estándar que funciona en un cliente se guarda en la biblioteca con un clic |
| Ajustes | Nombre de la consultora, tus datos y tarifa por hora |
| Proyecto · Costes y compras | Subida de facturas y albaranes (PDF o foto) con lectura automática, revisión línea a línea, enlace a productos (aprende de facturas anteriores), histórico de precios, alertas de subida con platos afectados, comparativa de proveedores con ahorro anual estimado |
| Proyecto · Inventario y mermas | Registro rápido de mermas por motivo (valoradas solas), recuentos de inventario desde el móvil que congelan el precio al cerrar, y consumo real (inicial + compras − final) frente al teórico de los escandallos según las ventas |
| Proyecto · Estándares y formación | Procedimientos, checklists y fichas del local con versión, estado (borrador / en prueba / implantado) y responsable; hoja imprimible (checklist semanal con casillas o SOP numerado); registro de formaciones con asistencia y valoración |
| Proyecto · Ventas y resultados | Importación de ventas diarias y por plato desde CSV del TPV (separador, fechas y decimales a la española, quita el IVA), cuenta de resultados mensual (la materia prima se calcula sola con inventarios y facturas), KPIs del sector (food cost, labour cost, prime cost, EBITDA, ticket medio, gasto por comensal, RevPASH, rotación, mermas), comparativa antes/después del proyecto con impacto anual, y volcado de los KPIs al plan de mejora |
| Proyecto · Informes | Informes de diagnóstico, seguimiento y cierre con secciones a elegir; documento A4 listo para guardar en PDF con tu sello, KPIs con mini gráficas, resultados, antes/después, plan, estándares y lo pendiente por parte del cliente; registro de envío |
| Proyecto · Escandallos y menú | Escandallos con merma y elaboraciones anidadas que se recalculan con el último precio de compra, food cost, margen, PVP recomendado según el objetivo del negocio, alérgenos, y matriz de ingeniería de menú (Estrella / Caballo / Puzzle / Perro) con las ventas mensuales por plato |

Los productos, facturas y escandallos son de cada negocio; los proveedores son tuyos y comunes a todos los clientes.

## Seguridad

- Solo entras tú: el registro público está desactivado y el primer usuario crea la organización como administrador.
- Toda la seguridad está en la base de datos (RLS en `supabase/migrations`). El esquema conserva roles de colaborador y cliente por si algún día los necesitas, pero la interfaz no los usa.
- Los documentos y fotos van a un bucket privado (`documentos`) con enlaces de descarga temporales.
- Las tareas y acciones se asignan a ti o a un contacto del cliente por nombre. El campo «Incluir en los informes» marca qué hallazgos, KPIs, acciones y actas saldrán en los informes (fase 3).

## Lectura automática de facturas

Con `ANTHROPIC_API_KEY` configurada, al subir una factura o albarán se envía a Claude (modelo `claude-opus-5-5`, salida estructurada) y vuelve con proveedor, número, fecha, bases, IVA y líneas. Si el modelo rechaza la petición, la API la reintenta automáticamente con otro modelo (fallback del servidor). Nada cuenta hasta que lo validas en la pantalla de revisión: al validar, cada línea enlazada a un producto registra su precio y los escandallos se recalculan.

Coste orientativo: una factura de una página son unos pocos miles de tokens de entrada, del orden de céntimos.

## Probar en local

Requisitos: Node 20+ y Docker.

```bash
npm install
npx supabase start          # levanta Postgres, Auth, Storage y un buzón de pruebas
npx supabase db reset       # aplica migraciones y datos de ejemplo
cp .env.example .env.local  # y pega las claves que muestra `npx supabase status`
npm run dev
```

Abre http://localhost:3000 y entra con `admin@demo.test` / `demo1234`.

## Publicar

1. Crea un proyecto en [supabase.com](https://supabase.com) (región UE).
2. `npx supabase link --project-ref <ref>` y `npx supabase db push` para crear tablas, políticas y el bucket.
3. **No cargues `seed.sql` en producción**: entra con tu correo y serás el admin (el primer usuario crea la organización). Para crear ese primer usuario: Authentication → Users → *Add user*.
4. En Authentication → Providers → Email, desactiva *Allow new users to sign up*.
5. Despliega en Vercel con las variables de `.env.example`.

## Estructura

```
supabase/migrations   esquema, seguridad (RLS), storage
supabase/seed.sql     3 negocios ficticios de Cádiz con proyectos, auditorías, KPIs y plan
src/app/(equipo)      área de la consultora (panel, proyectos, negocios, agenda, biblioteca, ajustes)
src/app/acciones      server actions (toda escritura pasa por aquí y por RLS)
src/components        UI, gráficos, checklist, documentos
```

Tipos de la base de datos: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

## Próximas fases

- **Módulo interno de la consultora**: registro de horas por proyecto, presupuestos y facturación de tus servicios (enviado / aceptado / cobrado) y rentabilidad real por proyecto.
- **Integración directa con TPV** por API, según el fabricante que use cada cliente (de momento, importación CSV).
