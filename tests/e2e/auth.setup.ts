import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = "tests/.auth/admin.json";

setup("inicia sesion con el BFF y guarda cookies httpOnly", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').fill("admin@qa.test");
  await page.locator('input[type="password"]').fill("qa-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
