# AC Consultoría · plataforma de proyectos

Plataforma para centralizar los proyectos de consultoría gastronómica con método de mejora continua:
diagnóstico, despilfarros (7 mudas), plan PDCA, KPIs, documentos y portal del cliente.

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
| Biblioteca | 8 plantillas de auditoría (cocina, compras, almacén, sala, carta, equipo, experiencia, APPCC) editables y versionadas |
| Ajustes | Invitar personas por correo, roles, acceso por proyecto |
| Portal del cliente | Sus tareas (las puede avanzar y comentar), KPIs, diagnóstico, plan, documentos (puede subir) y actas |

Las pestañas de Costes, Escandallos, Ventas e Informes aparecen marcadas como Fase 2 y Fase 3.

## Seguridad

Toda la seguridad está en la base de datos (`supabase/migrations/*_seguridad.sql`):

- **Admin**: todo lo de su organización.
- **Colaborador**: solo los proyectos en los que es miembro. No ve `proyecto_finanzas`.
- **Cliente**: solo sus proyectos y lo marcado `visible_cliente`. Puede cambiar el *estado* de sus tareas (un trigger impide tocar el resto), subir documentos y comentar. No ve comentarios internos ni plantillas.
- Nadie salvo un admin puede cambiar roles (trigger `proteger_perfil`).
- Storage: bucket privado `documentos`, rutas `proyectos/<id>/…` y `negocios/<id>/…` con las mismas reglas.
- El registro público está desactivado: se entra solo por invitación. El primer usuario que se registra crea la organización y es admin.

## Probar en local

Requisitos: Node 20+ y Docker.

```bash
npm install
npx supabase start          # levanta Postgres, Auth, Storage y un buzón de pruebas
npx supabase db reset       # aplica migraciones y datos de ejemplo
cp .env.example .env.local  # y pega las claves que muestra `npx supabase status`
npm run dev
```

Abre http://localhost:3000. Usuarios de ejemplo (contraseña `demo1234`):

| Correo | Rol | Ve |
|---|---|---|
| admin@demo.test | Administrador | Todo |
| lucia@demo.test | Colaboradora | Freiduría El Varadero y Hotel Arenas de Levante |
| varadero@demo.test | Cliente | Portal de Freiduría El Varadero |
| marisma@demo.test | Cliente | Portal de Restaurante Marisma |

Los correos de invitación locales se ven en http://127.0.0.1:54324.

## Publicar

1. Crea un proyecto en [supabase.com](https://supabase.com) (región UE).
2. `npx supabase link --project-ref <ref>` y `npx supabase db push` para crear tablas, políticas y el bucket.
3. **No cargues `seed.sql` en producción**: entra con tu correo y serás el admin (el primer usuario crea la organización). Para crear ese primer usuario: Authentication → Users → *Add user*.
4. En Authentication → Providers → Email, desactiva *Allow new users to sign up*. Añade `https://tu-dominio/bienvenida` en *Redirect URLs* y configura un SMTP propio para que las invitaciones salgan de tu dominio.
5. Despliega en Vercel con las variables de `.env.example`.

## Estructura

```
supabase/migrations   esquema, seguridad (RLS), storage
supabase/seed.sql     3 negocios ficticios de Cádiz con proyectos, auditorías, KPIs y plan
src/app/(equipo)      área de la consultora (panel, proyectos, negocios, agenda, biblioteca, ajustes)
src/app/portal        portal del cliente
src/app/acciones      server actions (toda escritura pasa por aquí y por RLS)
src/components        UI, gráficos, checklist, documentos
```

Tipos de la base de datos: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

## Próximas fases

- **Fase 2**: proveedores, productos y precios; facturas y albaranes con lectura automática; escandallos ligados al último precio; ingeniería de menú; inventario y mermas; SOPs y checklists; registros APPCC por el personal.
- **Fase 3**: importación de ventas, cuenta de resultados, prime cost, RevPASH, antes/después; informes PDF; horas y presupuestos; integración con TPV.
