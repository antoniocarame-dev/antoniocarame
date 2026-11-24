# Montar la plataforma

Tres servicios: **GitHub** guarda el código, **Supabase** la base de datos, los usuarios y los archivos, y **Vercel** sirve la web. Unos 30 minutos la primera vez.

## 1. GitHub (el código)

1. Conecta tu cuenta de GitHub a Claude en https://claude.ai/connect-github e instala la app de Claude en tu cuenta cuando te lo pida.
2. En https://github.com/new crea un repositorio **privado** y **vacío** (sin README ni licencia), por ejemplo `ac-consultoria`.
3. Dale el nombre a Claude y lo sube.

## 2. Supabase (la base de datos)

1. Entra en https://supabase.com y crea un proyecto:
   - Nombre: `ac-consultoria`.
   - Región: **Central EU (Frankfurt)** o **West EU (Ireland)**. Así los datos de tus clientes se quedan en la UE.
   - Contraseña de la base de datos: genera una y guárdala en tu gestor de contraseñas.
2. Cuando termine de crearse, abre **SQL Editor → New query**, pega entero el archivo `despliegue/instalar.sql` y pulsa **Run**. Debe terminar con «Success».
3. **Authentication → Users → Add user → Create new user**: tu correo y una contraseña, con «Auto Confirm User» marcado. Este primer usuario es el administrador.
4. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up**. Así nadie más puede crearse una cuenta.
5. **Project Settings → API Keys**: copia la **Project URL** y la **publishable key** (o la `anon` key en proyectos antiguos). Las necesitas en el paso 3.

## 3. Vercel (la web)

1. Entra en https://vercel.com con tu cuenta de GitHub.
2. **Add New → Project** e importa el repositorio `ac-consultoria`.
3. En **Environment Variables** añade:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la publishable key de Supabase |
   | `ANTHROPIC_API_KEY` | opcional: tu clave de console.anthropic.com para leer facturas |

4. Pulsa **Deploy**. En dos o tres minutos tendrás una dirección del tipo `ac-consultoria.vercel.app`.
5. Vuelve a Supabase → **Authentication → URL Configuration** y pon esa dirección en **Site URL**.

## 4. Primer uso

1. Entra con tu correo y contraseña.
2. **Ajustes**: pon el nombre de la consultora (sale en informes y presupuestos), tu nombre, teléfono y tarifa por hora.
3. **Negocios → Nuevo negocio** y, desde ahí, tu primer proyecto.
4. Opcional: en Vercel → Settings → Domains puedes usar un dominio propio, por ejemplo `app.tudominio.es`.

## Costes y planes

- **Supabase gratuito**: pausa el proyecto tras una semana sin uso y no tiene copias de seguridad diarias. Para trabajar con datos de clientes conviene el plan **Pro** (unos 25 $/mes): copias diarias y sin pausas.
- **Vercel Hobby (gratuito)**: según sus condiciones, es solo para uso no comercial. Para usarlo en tu negocio corresponde el plan **Pro** (unos 20 $/mes).
- **Lectura de facturas con Claude**: se paga por uso; una factura de una página cuesta céntimos.

## Actualizaciones

Cada cambio que se sube a GitHub se publica solo en Vercel. Si un cambio trae una migración nueva en `supabase/migrations`, se ejecuta en el SQL Editor de Supabase antes de publicar; las notas de cada cambio lo indicarán.
