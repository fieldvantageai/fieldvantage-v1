import { expect } from "@playwright/test";

import { hasRoleCredentials, test } from "./fixtures/auth";

test.describe("logout", () => {
  test.skip(
    !hasRoleCredentials("owner"),
    "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar logout."
  );

  test("permite sair da sessão pelo menu da conta", async ({ ownerPage }) => {
    await ownerPage.goto("/dashboard");

    await ownerPage.getByLabel(/perfil|profile/i).click();
    const logoutButton = ownerPage.getByRole("button", { name: /sair|logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(ownerPage).toHaveURL(/\/entrar$/);
    await expect(
      ownerPage.getByRole("heading", { name: /bem-vindo de volta|welcome back/i })
    ).toBeVisible();
  });
});
