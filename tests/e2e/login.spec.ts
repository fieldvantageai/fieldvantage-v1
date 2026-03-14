import { expect } from "@playwright/test";

import {
  dismissLanguageModal,
  hasRoleCredentials,
  test,
  waitForDashboardReady,
  waitForPostLoginRoute
} from "./fixtures/auth";

const ownerEmail = process.env.E2E_OWNER_EMAIL ?? "";
const ownerPassword = process.env.E2E_OWNER_PASSWORD ?? "";
const ownerCompanyId = process.env.E2E_OWNER_COMPANY_ID ?? "";

test.describe("login", () => {
  test.skip(
    !hasRoleCredentials("owner"),
    "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar login."
  );

  test("permite autenticar pela UI e entrar no dashboard", async ({ page }) => {
    await page.goto("/entrar");
    await dismissLanguageModal(page);

    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/senha|password/i).fill(ownerPassword);
    await page.getByRole("button", { name: /entrar|login/i }).click();

    await waitForPostLoginRoute(page);

    if (new URL(page.url()).pathname === "/select-company") {
      if (!ownerCompanyId) {
        throw new Error(
          "Defina E2E_OWNER_COMPANY_ID para usuários com múltiplas empresas."
        );
      }

      const response = await page.request.post("/api/me/active-company", {
        data: { company_id: ownerCompanyId }
      });

      expect(response.ok()).toBeTruthy();
      await page.goto("/dashboard");
    }

    await waitForDashboardReady(page);
  });
});
