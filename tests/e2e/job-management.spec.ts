import { test, expect, hasRoleCredentials } from "./fixtures/auth";
import {
  createCustomerViaUi,
  createJobViaUi,
  updateJobStatusViaUi
} from "./helpers/app";

test.describe("ordens", () => {
  test.skip(
    !hasRoleCredentials("owner"),
    "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar criação de ordens."
  );

  test("permite criar ordem e alterar status no detalhe", async ({ ownerPage }) => {
    const customer = await createCustomerViaUi(ownerPage);
    const job = await createJobViaUi(ownerPage, customer.name);

    await expect(ownerPage.getByRole("heading", { name: job.title })).toBeVisible();
    await expect(ownerPage.getByText(/Agendada/i).first()).toBeVisible();

    await updateJobStatusViaUi(ownerPage, job.id, "in_progress");

    await expect(ownerPage.getByText(/Em andamento/i).first()).toBeVisible();
  });
});
