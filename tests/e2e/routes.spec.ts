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

test("la barra flotante restaura la expansión bloqueada", async ({ page }) => {
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("navExpandedLocked", "true"));
  await page.reload();

  await expect(page.getByRole("link", { name: "Sets" }).locator("span")).toHaveClass(/max-w-24/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("navExpandedLocked")))
    .toBe("true");
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

test("los ajustes del proceso dejan solo la comunicación propia", async ({ page }) => {
  await page.goto("/app/procesos/process-qa");
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(page.getByRole("heading", { name: "Ajustes del proceso" })).toBeVisible();
  await expect(page.getByText("Centro de control", { exact: true })).toBeVisible();
  await expect(page.getByText("2/2 canales", { exact: true })).toBeVisible();
  await expect(page.getByText("Comunicación con candidatos", { exact: true })).toBeVisible();
  await expect(page.getByText("Mensaje de WhatsApp", { exact: true })).toBeVisible();
  await expect(page.getByText("Agente de llamada", { exact: true })).toBeVisible();
  await expect(page.getByText("Hola Ada, te llamo de Riwi.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Plantilla inicial aprobada por Meta", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("autorizacion_llamada_ia_v2", { exact: false })).toBeVisible();
  await expect(page.getByText("Extracción de CV", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Evaluación de profiling", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Primer saludo", { exact: true })).not.toBeVisible();
});

test("el saludo vive en el proceso pero el recruiter no puede editarlo libremente", async ({
  page,
}) => {
  await page.goto("/app/procesos/process-qa");
  await page.getByRole("button", { name: "Configuración" }).click();
  const callCard = page
    .getByText("Agente de llamada", { exact: true })
    .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
  await callCard.getByRole("button", { name: "Editar" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar agente de llamada" });
  await expect(dialog.getByText("Gestionado por Admin", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Hola Ada, te llamo de Riwi.", { exact: true })).toBeVisible();
  await expect(dialog.locator("#call-agent-greeting")).toHaveCount(0);
  await expect(page.getByText(/saludo definido en el set de preguntas/i)).toHaveCount(0);
});

test("Admin distingue plantillas oficiales de WhatsApp de los prompts", async ({ page }) => {
  await page.goto("/app/admin");
  // El shell llega por SSR; esperar el dato del tab inicial confirma que React ya hidrató
  // antes de cambiar de pestaña y evita perder el click en runners más lentos.
  await expect(page.getByText("Admin QA", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Parámetros de IA" }).click();
  await expect(page.getByText("Plantillas oficiales de WhatsApp", { exact: true })).toBeVisible();
  await expect(page.getByText("autorizacion_llamada_ia_v2", { exact: true })).toBeVisible();
  await expect(page.getByText("Aprobada", { exact: true })).toBeVisible();
  await expect(page.getByText("Predeterminada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sincronizar Meta" })).toBeVisible();
  const whatsappSection = page
    .getByText("Plantillas oficiales de WhatsApp", { exact: true })
    .locator("xpath=ancestor::section[1]");
  await expect(whatsappSection.getByRole("button", { name: "Nueva plantilla" })).toBeVisible();
});

test("la configuración mantiene la navegación util en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/procesos/process-qa");
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(page.getByRole("heading", { name: "Ajustes del proceso" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Comunicación" }).first()).toBeVisible();
  await expect(page.getByText("Centro de control", { exact: true })).not.toBeVisible();
});

test("inicio pagina en servidor y conserva los totales globales", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText("11 procesos encontrados");
  await expect(page.getByText("Página 1 de 2", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(page.getByText("Proceso página 2 QA", { exact: true })).toBeVisible();
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Anterior/ }).click();
  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();
});

test("inicio reinicia la paginación al aplicar un filtro", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Área" }).click();
  await page.getByRole("menuitem", { name: "Tecnologia" }).click();

  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("Página 1 de 2", { exact: true })).toBeVisible();
});

test("inicio encuentra cerrados y archivados desde el filtro de etapa", async ({ page }) => {
  await page.goto("/app");
  // El SSR ya pinta el shell antes de que React hidrate y llegue la primera página.
  // Esperar un dato del endpoint evita hacer click sobre un trigger aún no interactivo.
  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Etapa" }).click();
  await page.getByRole("menuitem", { name: "Archivado" }).click();
  await expect(page.getByText("Proceso archivado QA", { exact: true })).toBeVisible();
  await expect(page.locator("tbody")).toContainText("Archivado");

  await page.getByRole("button", { name: "Archivado", exact: true }).click();
  await page.getByRole("menuitem", { name: "Cerrado" }).click();
  await expect(page.getByText("Proceso cerrado QA", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Cerrado", exact: true }).click();
  await page.getByRole("menuitem", { name: "Procesos vigentes" }).click();
  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();
});

test("inicio distingue resultados vacíos de errores recuperables", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByText("Backend QA 2026", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Área" }).click();
  await page.getByRole("menuitem", { name: "Diseño" }).click();
  await expect(page.getByText("Ningún proceso coincide con los filtros aplicados.")).toBeVisible();

  await page.getByRole("button", { name: "Diseño" }).click();
  await page.getByRole("menuitem", { name: "Error QA" }).click();
  await expect(page.getByRole("alert")).toContainText("No pudimos cargar los procesos");
  await expect(page.getByRole("alert")).toContainText("Fallo controlado del listado");
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
});

test("rutas clave no presentan violaciones graves de accesibilidad", async ({ page }) => {
  for (const url of ["/app", "/app/procesos/process-qa", "/app/profiling", "/app/sets/set-qa"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      ),
      `Violaciones graves en ${url}`,
    ).toEqual([]);
  }
});

test("login publico asocia etiquetas y no presenta violaciones graves", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
});

test("dashboard conserva comportamiento util en viewport movil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByLabel("Crear proceso")).toBeVisible();
});
