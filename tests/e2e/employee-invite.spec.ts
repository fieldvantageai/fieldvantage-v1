import { test, expect, hasRoleCredentials } from "./fixtures/auth";
import { acceptInviteViaUi, createEmployeeViaUi, uniqueSuffix } from "./helpers/app";

test.describe("colaboradores e convites", () => {
  test.skip(
    !hasRoleCredentials("owner"),
    "Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD para validar criação de colaborador."
  );

  test("permite criar colaborador e aceitar convite", async ({ ownerPage, browser }) => {
    const employee = await createEmployeeViaUi(ownerPage);
    const password = `Playwright!${uniqueSuffix()}`;

    await expect(ownerPage.getByText(/Pendente/i).first()).toBeVisible();

    await acceptInviteViaUi(browser, employee.inviteLink, employee.email, password);

    await ownerPage.goto(`/employees/${employee.id}`);
    await expect(ownerPage.getByRole("heading", { name: employee.name })).toBeVisible();
    await expect(ownerPage.getByText(/Aceito/i).first()).toBeVisible();
    await expect(
      ownerPage.getByText(/já aceitou o convite e tem acesso ativo ao sistema/i)
    ).toBeVisible();
  });
});
