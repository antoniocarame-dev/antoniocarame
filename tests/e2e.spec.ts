import { test, expect, type Page } from "@playwright/test";

const P = "/proyectos/c0000000-0000-0000-0000-000000000001";
const URL_API = "http://127.0.0.1:54321";
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

async function entrar(page: Page) {
  await page.goto("/login");
  await page.fill("input[name=email]", "admin@demo.test");
  await page.fill("input[name=password]", "demo1234");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button")]);
}

test.describe("Acceso y seguridad", () => {
  test("sin sesión se redirige al login", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/login/);
  });

  test("la API sin sesión no devuelve datos", async ({ request }) => {
    for (const tabla of ["proyectos", "negocios", "proyecto_finanzas", "facturas", "horas", "presupuestos"]) {
      const r = await request.get(`${URL_API}/rest/v1/${tabla}?select=*`, { headers: { apikey: CLAVE } });
      expect(await r.json(), tabla).toEqual([]);
    }
  });

  test("las exportaciones a Excel exigen sesión", async ({ request }) => {
    const r = await request.get("/exportar/consultora", { maxRedirects: 0 });
    expect(r.status()).toBe(307);
  });
});

test.describe("Recorridos principales", () => {
  test.beforeEach(async ({ page }) => entrar(page));

  test("todas las pantallas cargan sin errores", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    for (const r of ["/panel", "/proyectos", "/negocios", "/agenda", "/biblioteca", "/consultora", "/ajustes", P, `${P}/diagnostico`, `${P}/plan`,
      `${P}/estandares`, `${P}/documentos`, `${P}/actas`, `${P}/costes`, `${P}/escandallos`, `${P}/inventario`, `${P}/resultados`, `${P}/informes`]) {
      const res = await page.goto(r);
      expect(res?.status(), r).toBe(200);
    }
    expect(errores).toEqual([]);
  });

  test("registrar un hallazgo y convertirlo en acción", async ({ page }) => {
    await page.goto(`${P}/diagnostico`);
    await page.click('button:has-text("Registrar hallazgo")');
    await page.fill("[role=dialog] input[name=titulo]", "Prueba: cubos sin tapa");
    await page.selectOption("[role=dialog] select[name=muda]", "defectos_mermas");
    await page.click("[role=dialog] button[type=submit]");
    const tarjeta = page.locator("li", { hasText: "Prueba: cubos sin tapa" });
    await expect(tarjeta).toBeVisible();
    await tarjeta.locator('button:has-text("Acción")').click();
    await expect(tarjeta.getByText("Acción creada en el plan")).toBeVisible();
    await page.goto(`${P}/plan`);
    await expect(page.getByText("Corregir: Prueba: cubos sin tapa")).toBeVisible();
  });

  test("validar un albarán registra los precios", async ({ page }) => {
    await page.goto(`${P}/costes/facturas/91000000-0000-0000-0000-000000000003`);
    await page.click('button:has-text("Validar y registrar precios")');
    await page.waitForURL(/costes\?v=facturas/);
    await expect(page.locator("tr", { hasText: "Frutas Hermanos Gil" }).first()).toContainText("Validada");
  });

  test("crear un plato con una elaboración calcula el food cost", async ({ page }) => {
    await page.goto(`${P}/escandallos/nuevo`);
    await page.locator('label:has-text("Plato") input').first().fill("Prueba: tortillitas");
    await page.locator('label:has-text("PVP con IVA") input').fill("9");
    await page.selectOption("select[aria-label=Ingrediente] >> nth=0", { label: "Harina especial fritura" });
    await page.fill("input[aria-label=Cantidad] >> nth=0", "0.08");
    await expect(page.locator("aside.ticket-edge")).toContainText("Food cost");
    await page.click('button:has-text("Guardar escandallo")');
    await page.waitForURL(/escandallos\/[0-9a-f-]{36}$/);
  });

  test("registrar una merma la valora sola", async ({ page }) => {
    await page.goto(`${P}/inventario`);
    const valor = await page.locator("select[name=origen] option", { hasText: "Chocos fritos" }).getAttribute("value");
    await page.selectOption("select[name=origen]", valor!);
    await page.fill("input[name=cantidad]", "2");
    await page.click('button:has-text("Registrar")');
    await expect(page.locator("li", { hasText: "Chocos fritos" }).first()).toContainText("€");
  });

  test("presupuesto → proyecto → factura cobrada", async ({ page }) => {
    await page.goto("/consultora");
    await page.click('button:has-text("Presupuesto")');
    await page.selectOption("[role=dialog] select[name=negocio_id]", { label: "Restaurante Marisma" });
    await page.fill("[role=dialog] input[name=titulo]", "Prueba de presupuesto");
    await page.click("[role=dialog] button[type=submit]");
    await page.waitForURL(/presupuestos\/[0-9a-f-]{36}$/);
    await page.fill("input[aria-label=Concepto] >> nth=0", "Servicio de prueba");
    await page.fill("input[aria-label=Precio] >> nth=0", "500");
    await page.click('button:has-text("Guardar")');
    await expect(page.getByText("Guardado")).toBeVisible();
    await page.click('button:has-text("Aceptado: crear proyecto")');
    await page.waitForURL(/proyectos\/[0-9a-f-]{36}$/);
    await expect(page.locator("h1")).toContainText("Prueba de presupuesto");
  });

  test("las exportaciones a Excel se descargan", async ({ page }) => {
    for (const t of ["resultados", "escandallos", "compras", "mermas", "plan"]) {
      const r = await page.request.get(`/exportar/${t}?proyecto=c0000000-0000-0000-0000-000000000001`);
      expect(r.status(), t).toBe(200);
      expect(r.headers()["content-type"]).toContain("spreadsheetml");
    }
  });

  test("las hojas imprimibles cargan (auditoría, plantilla en blanco, ficha técnica)", async ({ page }) => {
    await page.goto(`${P}/diagnostico`);
    await page.locator('a', { hasText: "Auditoría de cocina" }).first().click();
    await page.waitForURL(/diagnostico\/[0-9a-f-]{36}$/);
    const informe = await page.locator('a:has-text("Informe PDF")').getAttribute("href");
    await page.goto(informe!);
    await expect(page.getByText("Organización y producción").first()).toBeVisible();
    await page.goto("/biblioteca");
    await page.locator("a", { hasText: "Auditoría de cocina" }).click();
    await page.goto((await page.locator('a:has-text("Hoja en blanco")').getAttribute("href"))!);
    await expect(page.getByText("Firma del auditor")).toBeVisible();
    await page.goto("/imprimir/escandallo/92000000-0000-0000-0000-000000000007");
    await expect(page.getByText("Alérgenos")).toBeVisible();
  });

  test("presupuesto: retención de IRPF y PDF descargable", async ({ page }) => {
    await page.goto("/consultora?v=presupuestos");
    await page.locator("a", { hasText: "Control de costes y reorganización de cocina" }).click();
    await page.waitForURL(/presupuestos\/[0-9a-f-]{36}$/);
    await page.getByLabel("Retención IRPF (%)").fill("15");
    await page.click('button:has-text("Guardar")');
    await expect(page.getByText("Guardado")).toBeVisible();
    await expect(page.getByText("Retención IRPF 15 %")).toBeVisible();
    const r = await page.request.get((await page.locator('a:has-text("Descargar PDF")').getAttribute("href"))!);
    expect(r.headers()["content-type"]).toBe("application/pdf");
    expect((await r.body()).byteLength).toBeGreaterThan(2_000);
  });

  test("resumen del proyecto para el cliente", async ({ page }) => {
    await page.goto(P);
    await page.goto((await page.locator('a:has-text("Resumen para el cliente")').getAttribute("href"))!);
    await expect(page.getByText("Cómo van los números")).toBeVisible();
    await expect(page.getByText("Pendiente por vuestra parte")).toBeVisible();
  });

  test("subir receta sin clave de lectura avisa del motivo", async ({ page }) => {
    test.skip(!!process.env.ANTHROPIC_API_KEY, "con clave se leería de verdad");
    await page.goto(`${P}/escandallos`);
    await page.setInputFiles('label:has-text("Subir receta") input[type=file]', { name: "receta.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
    await expect(page.getByRole("alert").filter({ hasText: "ANTHROPIC_API_KEY" })).toBeVisible();
  });

  test("exportar todos los datos de un cliente y borrarlo conservando facturas y horas", async ({ page }) => {
    const NM = "b0000000-0000-0000-0000-000000000002";
    const x = await page.request.get(`/exportar/cliente?negocio=${NM}`);
    expect(x.status()).toBe(200);
    expect(x.headers()["content-disposition"]).toContain("todos-los-datos");
    await page.goto(`/negocios/${NM}`);
    await page.fill("input[name=confirmacion]", "otro nombre");
    await page.click('button:has-text("Borrar cliente y sus datos")');
    await expect(page.getByRole("alert").filter({ hasText: "Escribe exactamente" })).toBeVisible();
    await page.fill("input[name=confirmacion]", "Restaurante Marisma");
    await page.click('button:has-text("Borrar cliente y sus datos")');
    await page.waitForURL(/\/negocios$/);
    await expect(page.getByText("Restaurante Marisma")).toHaveCount(0);
    await page.goto("/consultora?v=facturacion");
    await expect(page.locator("tr", { hasText: "F-2026-023" })).toContainText("Restaurante Marisma");
    await page.goto("/consultora?v=horas");
    await expect(page.getByText(/\[Restaurante Marisma ·/).first()).toBeVisible();
  });

  test("el informe se genera en PDF", async ({ page }) => {
    await page.goto("/informe/94000000-0000-0000-0000-000000000001");
    await expect(page.getByText("Antes y después del proyecto")).toBeVisible();
    const pdf = await page.pdf({ format: "A4" });
    expect(pdf.byteLength).toBeGreaterThan(20_000);
  });

  test("plantillas predefinidas: instalar, auditar con sí/no, medición y texto, y anotar necesidades", async ({ page }) => {
    await page.goto("/biblioteca");
    await page.getByRole("button", { name: "Instalar plantillas predefinidas" }).click();
    await expect(page.getByRole("button", { name: "Instalar plantillas predefinidas" })).toHaveCount(0);
    await expect(page.locator("a", { hasText: "Cámaras, almacén y stock" })).toBeVisible();
    await expect(page.locator("a", { hasText: "Cliente misterioso" })).toBeVisible();

    await page.goto(`${P}/diagnostico`);
    await page.getByRole("button", { name: "Nueva auditoría" }).click();
    await page.locator("select[name=plantilla_id]").selectOption({ label: "Cámaras, almacén y stock" });
    await page.getByRole("button", { name: "Empezar" }).click();
    await page.waitForURL(/diagnostico\/[0-9a-f-]{36}$/);

    const punto = (id: string) => page.locator(`li[data-item="${id}"]`);
    await expect(punto("ca1")).toContainText("Objetivo: 0 a 4 °C");
    await punto("ca1").getByRole("spinbutton").fill("7");
    await punto("ca1").getByLabel("Comentario").click();
    await expect(punto("ca1")).toContainText("Fuera de objetivo");
    await punto("ca1").getByLabel("Comentario").fill("Puerta mal cerrada");
    await punto("ca4").click();
    await punto("ca4").getByRole("radio", { name: "Sí" }).click();
    await punto("ca14").getByRole("textbox").fill("Seis cajas de gambón congelado sin salida");
    await punto("ca14").getByRole("textbox").blur();
    await punto("ca8").getByRole("button", { name: "Anotar necesidad" }).click();
    await punto("ca8").getByRole("textbox", { name: "Necesidad", exact: true }).fill("Etiquetadora y rotulador para fechas");
    await punto("ca8").getByRole("button", { name: "Anotar", exact: true }).click();
    await expect(page.getByRole("complementary").filter({ hasText: "Necesidades y hallazgos" })).toContainText("Etiquetadora y rotulador para fechas");
    await expect(page.getByText("Guardado")).toBeVisible();

    await page.reload();
    await expect(punto("ca1").getByRole("spinbutton")).toHaveValue("7");
    await expect(punto("ca1").getByLabel("Comentario")).toHaveValue("Puerta mal cerrada");
    await expect(punto("ca4").getByRole("radio", { name: "Sí" })).toHaveAttribute("aria-checked", "true");

    await page.goto((await page.locator('a:has-text("Informe PDF")').getAttribute("href"))!);
    await expect(page.getByText("50/100").first()).toBeVisible();
    await expect(page.getByText("7 °C").first()).toBeVisible();
    await expect(page.getByText("objetivo 0 a 4 °C")).toBeVisible();
    await expect(page.getByText("Seis cajas de gambón congelado sin salida")).toBeVisible();
    await expect(page.getByText("Etiquetadora y rotulador para fechas")).toBeVisible();

    await page.goto("/biblioteca");
    await page.locator("a", { hasText: "Cámaras, almacén y stock" }).click();
    await page.goto((await page.locator('a:has-text("Hoja en blanco")').getAttribute("href"))!);
    await expect(page.getByText("Objetivo: 0 a 4 °C")).toBeVisible();
    await expect(page.getByText("Necesidades detectadas y hallazgos")).toBeVisible();
  });

  test("calendario mensual: crear un evento personal de varios días, editarlo y borrarlo", async ({ page }) => {
    await page.goto("/agenda?mes=2026-12");
    await expect(page.getByRole("heading", { name: "Diciembre de 2026" })).toBeVisible();
    await expect(page.locator('[data-dia="2026-12-07"]')).toContainText("Puente de diciembre");
    await expect(page.locator('[data-dia="2026-12-08"]')).toContainText("Puente de diciembre");
    await page.locator('[data-dia="2026-12-21"]').click();
    await page.getByRole("button", { name: "Añadir" }).click();
    const d = page.getByRole("dialog");
    await d.locator("input[name=titulo]").fill("Vacaciones en familia");
    await d.locator("select[name=tipo]").selectOption("personal");
    await d.getByLabel("Todo el día").check();
    await d.getByLabel("Varios días").check();
    await d.locator("input[name=dia_fin]").fill("2026-12-23");
    await d.getByRole("button", { name: "Añadir" }).click();
    await expect(d).toHaveCount(0);
    for (const dia of ["21", "22", "23"]) await expect(page.locator(`[data-dia="2026-12-${dia}"]`)).toContainText("Vacaciones en familia");
    await expect(page.locator('[data-dia="2026-12-24"]')).not.toContainText("Vacaciones en familia");

    await page.locator('[data-dia="2026-12-22"]').getByRole("button", { name: /Vacaciones en familia/ }).click();
    await page.getByRole("dialog").locator("input[name=titulo]").fill("Vacaciones");
    await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
    await expect(page.locator('[data-dia="2026-12-21"]')).toContainText("Vacaciones");
    await expect(page.locator('[data-dia="2026-12-21"]')).not.toContainText("en familia");

    // Evento con hora en verano: la hora se conserva
    await page.goto("/agenda?mes=2026-07");
    await page.locator('[data-dia="2026-07-15"]').dblclick();
    await page.getByRole("dialog").locator("input[name=titulo]").fill("Cata en bodega");
    await page.getByRole("dialog").getByLabel("Desde: hora").selectOption("10");
    await page.getByRole("dialog").getByLabel("Desde: minutos").selectOption("30");
    await page.getByRole("dialog").getByRole("button", { name: "Añadir" }).click();
    await expect(page.locator('[data-dia="2026-07-15"]')).toContainText("10:30Cata en bodega");

    await page.goto("/agenda?mes=2026-12");
    await page.locator('[data-dia="2026-12-21"]').getByRole("button", { name: /Vacaciones/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Borrar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "¿Borrar el evento?" }).click();
    await expect(page.locator('[data-dia="2026-12-21"]')).not.toContainText("Vacaciones");
  });
});
