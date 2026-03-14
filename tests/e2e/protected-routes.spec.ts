import { expect, test } from "@playwright/test";

test.describe("rotas protegidas", () => {
  test("redireciona usuário não autenticado para o login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/entrar\?next=%2Fdashboard/);
    await expect(
      page.getByRole("heading", { name: /bem-vindo de volta|welcome back/i })
    ).toBeVisible();
  });
});
