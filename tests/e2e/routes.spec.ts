import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routeModules = [
  { module: "__root.tsx", url: "/app" },
  { module: "app.tsx", url: "/app" },
  { module: "app.index.tsx", url: "/app" },
  { module: "app.admin.tsx", url: "/app/admin" },
  { module: "app.buscar.tsx", url: "/app/buscar?q=Ada" },
  { module: "app.costos.tsx", url: "/app/costos" },
  { module: "app.equipo.tsx", url: "/app/equipo" },
  { module: "app.procesos.$id.tsx", url: "/app/procesos/process-qa" },
  { module: "app.procesos.nuevo.tsx", url: "/app/procesos/nuevo" },
  { module: "app.profiling.tsx", url: "/app/profiling" },
  { module: "app.sets.tsx", url: "/app/sets" },
  { module: "app.sets.index.tsx", url: "/app/sets" },
  { module: "app.sets.$id.tsx", url: "/app/sets/set-qa" },
  { module: "app.sets.nuevo.tsx", url: "/app/sets/nuevo" },
  { module: "index.tsx", url: "/" },
] as const;

for (const route of routeModules) {
  test(`${route.module} responde sin error de aplicacion`, async ({ page }) => {
    if (route.module === "index.tsx") await page.context().clearCookies();
    const response = await page.goto(route.url);
    expect(response?.status() ?? 500).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(
      /Unexpected Application Error|Internal Server Error/,
    );
    if (route.module === "index.tsx")
      await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    else await expect(page.locator("main")).toBeVisible();
  });
}

test("Topbar y FloatingNav respetan el shell autenticado", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByPlaceholder("Buscar procesos, candidatos, sets…")).toBeVisible();
  await expect(page.getByLabel("Crear proceso")).toBeVisible();
  await expect(page.getByRole("link", { name: "Profiling" })).toBeVisible();
});

test("SetBuilder renderiza datos del backend mock a traves del BFF", async ({ page }) => {
  await page.goto("/app/sets/set-qa");
  await expect
    .poll(() =>
      page
        .locator("input")
        .evaluateAll((inputs) => inputs.some((input) => input.value === "Set tecnico QA")),
    )
    .toBe(true);
  await expect(page.getByText("Cuentanos tu experiencia con FastAPI")).toBeVisible();
});

test("rutas clave no presentan violaciones criticas de accesibilidad", async ({ page }) => {
  for (const url of ["/app", "/app/profiling", "/app/sets/set-qa"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) => violation.impact === "critical"),
      `Violaciones criticas en ${url}`,
    ).toEqual([]);
  }
});

test("dashboard conserva comportamiento util en viewport movil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByLabel("Crear proceso")).toBeVisible();
});
