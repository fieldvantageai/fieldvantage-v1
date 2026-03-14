import { expect } from "@playwright/test";

import { hasRoleCredentials, test, waitForDashboardReady } from "./fixtures/auth";

test.describe("acesso ao dashboard", () => {
  test.describe("owner", () => {
    test.skip(
      !hasRoleCredentials("owner"),
      "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar dashboard autenticado."
    );

    test("carrega o dashboard autenticado", async ({ ownerPage }) => {
      await ownerPage.goto("/dashboard");

      await waitForDashboardReady(ownerPage);
    });
  });

  test.describe("member", () => {
    test.skip(
      !hasRoleCredentials("member"),
      "Defina E2E_MEMBER_EMAIL e E2E_MEMBER_PASSWORD para validar dashboard de colaborador."
    );

    test("carrega o dashboard do colaborador", async ({ memberPage }) => {
      await memberPage.goto("/dashboard");

      await waitForDashboardReady(memberPage);
    });
  });

  test.describe("admin", () => {
    test.skip(
      !hasRoleCredentials("admin"),
      "Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para validar dashboard de administrador."
    );

    test("carrega o dashboard do administrador", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      await waitForDashboardReady(adminPage);
    });
  });
});
