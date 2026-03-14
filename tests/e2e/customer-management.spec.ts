import { test, expect, hasRoleCredentials } from "./fixtures/auth";
import { createCustomerViaUi } from "./helpers/app";

test.describe("clientes", () => {
  test.skip(
    !hasRoleCredentials("owner"),
    "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar criação de cliente."
  );

  test("permite criar um cliente pela UI", async ({ ownerPage }) => {
    const customer = await createCustomerViaUi(ownerPage);

    await expect(ownerPage.getByRole("heading", { name: customer.name })).toBeVisible();
    await expect(ownerPage.getByRole("link", { name: customer.email })).toBeVisible();
  });
});
