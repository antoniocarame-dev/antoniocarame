import { defineConfig } from "@playwright/test";

/**
 * Pruebas de extremo a extremo. Requisitos: Supabase local con los datos de ejemplo
 * (`npx supabase db reset`) y la app en marcha (`npm run dev`).
 * Ejecutar: `npm run test:e2e`
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "off", locale: "es-ES", timezoneId: "Europe/Madrid" },
});
