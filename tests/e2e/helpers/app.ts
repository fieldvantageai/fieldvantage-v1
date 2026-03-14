import { expect, type Browser, type Page, type Response } from "@playwright/test";

import { dismissLanguageModal, waitForDashboardReady, waitForPostLoginRoute } from "../fixtures/auth";

export const uniqueSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function saveFormAndWaitForResponse(
  page: Page,
  responseMatcher: (response: Response) => boolean,
  submitButtonName: RegExp = /salvar|save/i
) {
  const responsePromise = page.waitForResponse(responseMatcher);
  await page.getByRole("button", { name: submitButtonName }).last().click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  return response;
}

export async function fetchBranches(page: Page) {
  const response = await page.request.get("/api/branches");
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as {
    data?: Array<{ id: string; name: string }>;
  };
  return payload.data ?? [];
}

export async function createCustomerViaUi(page: Page, suffix = uniqueSuffix()) {
  const firstName = `ClienteE2E${suffix}`;
  const lastName = "Playwright";
  const companyName = `Empresa ${suffix}`;
  const customerName = `${firstName} ${lastName}`;

  await page.goto("/customers/new");
  await page.getByLabel(/^Nome$/i).fill(firstName);
  await page.getByLabel(/^Sobrenome$/i).fill(lastName);
  await page.getByLabel(/^Empresa$/i).fill(companyName);
  await page.getByLabel(/^Email$/i).fill(`cliente.${suffix}@example.com`);
  await page.getByLabel(/^Telefone$/i).fill("(11) 99999-0000");
  await page.getByRole("button", { name: /adicionar um endereço|adicionar endereço/i }).click();
  await page.getByLabel(/Tipo$/i).last().selectOption("residential");
  await page.getByLabel(/Rua e número/i).fill(`Rua E2E ${suffix}, 100`);
  await page.getByLabel(/^Cidade$/i).last().fill("Sao Paulo");
  await page.getByLabel(/^Estado$/i).last().fill("SP");
  await page.getByLabel(/^CEP$/i).fill("01000-000");
  await page.getByLabel(/^País$/i).last().fill("Brasil");

  const response = await saveFormAndWaitForResponse(
    page,
    (res) => res.url().includes("/api/customers") && res.request().method() === "POST"
  );

  const payload = (await response.json()) as {
    data: { id: string; first_name?: string; last_name?: string };
  };

  await page.goto(`/customers/${payload.data.id}`);
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  return {
    id: payload.data.id,
    name: customerName,
    email: `cliente.${suffix}@example.com`
  };
}

export async function createEmployeeViaUi(page: Page, suffix = uniqueSuffix()) {
  const firstName = `Colab${suffix}`;
  const lastName = "E2E";
  const fullName = `${firstName} ${lastName}`;
  const email = `colab.${suffix}@example.com`;
  const branches = await fetchBranches(page);

  await page.goto("/employees/new");
  await page.getByLabel(/^Nome$/i).fill(firstName);
  await page.getByLabel(/^Sobrenome$/i).fill(lastName);
  await page.getByLabel(/^Cargo$/i).fill("Tester E2E");
  await page.getByLabel(/Email \(obrigatório/i).fill(email);
  await page.getByLabel(/^Telefone$/i).fill("(11) 99999-1111");
  await page.getByLabel(/Perfil de acesso/i).selectOption("employee");

  if (branches.length > 0) {
    const branchLabel = page.getByText(branches[0].name, { exact: true }).last();
    await branchLabel.click();
  }

  const response = await saveFormAndWaitForResponse(
    page,
    (res) => res.url().includes("/api/employees") && res.request().method() === "POST",
    /criar colaborador/i
  );

  const payload = (await response.json()) as {
    employee: { id: string };
    invite_link: string;
  };

  await page.waitForURL(new RegExp(`/employees/${payload.employee.id}$`));
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
  await expect(page.getByText(/Pendente/i).first()).toBeVisible();

  return {
    id: payload.employee.id,
    name: fullName,
    email,
    inviteLink: payload.invite_link
  };
}

export async function acceptInviteViaUi(
  browser: Browser,
  inviteLink: string,
  email: string,
  password: string
) {
  const page = await browser.newPage();

  try {
    await page.goto(inviteLink);
    await dismissLanguageModal(page);
    await page.getByLabel(/^Senha$/i).fill(password);
    await page.getByLabel(/Confirmar senha/i).fill(password);
    await page.getByRole("button", { name: /Criar conta/i }).click();
    await expect(page.getByText(/Conta ativada com sucesso/i)).toBeVisible();

    await page.getByRole("link", { name: /Ir para o login/i }).click();
    await dismissLanguageModal(page);
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Senha$/i).fill(password);
    await page.getByRole("button", { name: /Entrar|Login/i }).click();
    await waitForPostLoginRoute(page);
    await waitForDashboardReady(page);
  } finally {
    await page.close();
  }
}

export async function createJobViaUi(page: Page, customerName: string, suffix = uniqueSuffix()) {
  const title = `Ordem E2E ${suffix}`;
  const branches = await fetchBranches(page);

  await page.goto("/jobs/new");
  await page.getByLabel(/Título da ordem/i).fill(title);
  await page.getByLabel(/^Cliente$/i).selectOption({ label: customerName });

  if (branches.length > 0) {
    await page.getByLabel(/^Filial$/i).selectOption(branches[0].id);
  }

  const dateInputs = page.locator('input[type="datetime-local"]');
  await dateInputs.nth(0).fill("2026-04-10T10:00");
  await dateInputs.nth(1).fill("2026-04-10T12:00");
  await page.getByLabel(/^Notas$/i).fill(`Notas da ordem ${suffix}`);

  const response = await saveFormAndWaitForResponse(
    page,
    (res) => res.url().includes("/api/jobs") && res.request().method() === "POST"
  );

  const payload = (await response.json()) as {
    data: { id: string };
  };

  await page.goto(`/jobs/${payload.data.id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  return {
    id: payload.data.id,
    title
  };
}

export async function updateJobStatusViaUi(
  page: Page,
  jobId: string,
  nextStatus: "scheduled" | "in_progress" | "done" | "canceled"
) {
  await page.goto(`/jobs/${jobId}`);
  await page.getByRole("button", { name: /Atualizar status/i }).first().click();
  await page.getByLabel(/^Status$/i).selectOption(nextStatus);

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/jobs/${jobId}/status`) && res.request().method() === "PATCH"
  );

  await page.getByRole("button", { name: /Salvar/i }).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
}
