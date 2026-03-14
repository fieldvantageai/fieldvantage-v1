import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import {
  expect,
  test as base,
  type Browser,
  type Page
} from "@playwright/test";
import { loadE2EEnv } from "../loadEnv";

loadE2EEnv();

type Role = "owner" | "admin" | "member";

type RoleCredentials = {
  email: string;
  password: string;
  companyId?: string;
};

type WorkerFixtures = {
  ownerStorageState: string;
  adminStorageState: string;
  memberStorageState: string;
};

type TestFixtures = {
  ownerPage: Page;
  adminPage: Page;
  memberPage: Page;
};

const AUTH_DIR = path.join(process.cwd(), ".playwright", ".auth");
const PLAYWRIGHT_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const envKey = (role: Role, key: "EMAIL" | "PASSWORD" | "COMPANY_ID") =>
  `E2E_${role.toUpperCase()}_${key}`;

export async function dismissLanguageModal(page: Page) {
  const languageHeading = page.getByText(
    /Escolha o idioma do sistema|Choose the system language|Elige el idioma del sistema/i
  );

  if ((await languageHeading.count()) === 0) {
    return;
  }

  const confirmButton = page.getByRole("button", {
    name: /Confirmar idioma|Confirm language|Confirmar idioma/i
  });

  if ((await confirmButton.count()) > 0) {
    await confirmButton.click();
    await expect(languageHeading).toHaveCount(0);
  }
}

export async function waitForPostLoginRoute(page: Page, timeout = 45_000) {
  await page.waitForFunction(
    ({ allowedPaths }) => allowedPaths.includes(window.location.pathname),
    { allowedPaths: ["/dashboard", "/select-company"] },
    { timeout }
  );
}

export async function waitForDashboardReady(page: Page, timeout = 20_000) {
  await expect(page).toHaveURL(/\/dashboard$/, { timeout });
  await expect(
    page.getByRole("heading", { name: /painel|dashboard/i }).first()
  ).toBeVisible({ timeout });
}

export const hasRoleCredentials = (role: Role) =>
  Boolean(process.env[envKey(role, "EMAIL")] && process.env[envKey(role, "PASSWORD")]);

const getRoleCredentials = (role: Role): RoleCredentials => {
  const email = process.env[envKey(role, "EMAIL")]?.trim();
  const password = process.env[envKey(role, "PASSWORD")]?.trim();
  const companyId = process.env[envKey(role, "COMPANY_ID")]?.trim() || undefined;

  if (!email || !password) {
    throw new Error(
      `Credenciais e2e ausentes para "${role}". Defina ${envKey(role, "EMAIL")} e ${envKey(role, "PASSWORD")}.`
    );
  }

  return { email, password, companyId };
};

async function createAuthenticatedStorageState(
  browser: Browser,
  baseURL: string,
  role: Role
) {
  const credentials = getRoleCredentials(role);
  const page = await browser.newPage({ baseURL });

  try {
    await page.goto("/entrar");
    await dismissLanguageModal(page);
    await page.getByLabel(/email/i).fill(credentials.email);
    await page.getByLabel(/senha|password/i).fill(credentials.password);
    await page.getByRole("button", { name: /entrar|login/i }).click();

    await waitForPostLoginRoute(page);

    if (new URL(page.url()).pathname === "/select-company") {
      if (!credentials.companyId) {
        throw new Error(
          `O usuário "${role}" caiu em /select-company. Defina ${envKey(role, "COMPANY_ID")} para selecionar a empresa ativa nos testes.`
        );
      }

      const response = await page.request.post("/api/me/active-company", {
        data: { company_id: credentials.companyId }
      });

      expect(response.ok()).toBeTruthy();
      await page.goto("/dashboard");
    }

    await waitForDashboardReady(page);

    await fs.mkdir(AUTH_DIR, { recursive: true });
    const storageStatePath = path.join(
      AUTH_DIR,
      `${role}-${process.pid}-${crypto.randomUUID()}.json`
    );
    await page.context().storageState({ path: storageStatePath });
    return storageStatePath;
  } finally {
    await page.close();
  }
}

async function buildAuthenticatedPage(
  browser: Browser,
  storageState: string
) {
  return browser.newPage({ storageState });
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  ownerStorageState: [
    async ({ browser }, use) => {
      await use(await createAuthenticatedStorageState(browser, PLAYWRIGHT_BASE_URL, "owner"));
    },
    { scope: "worker" }
  ],

  adminStorageState: [
    async ({ browser }, use) => {
      await use(await createAuthenticatedStorageState(browser, PLAYWRIGHT_BASE_URL, "admin"));
    },
    { scope: "worker" }
  ],

  memberStorageState: [
    async ({ browser }, use) => {
      await use(await createAuthenticatedStorageState(browser, PLAYWRIGHT_BASE_URL, "member"));
    },
    { scope: "worker" }
  ],

  ownerPage: async ({ browser, ownerStorageState }, use) => {
    const page = await buildAuthenticatedPage(browser, ownerStorageState);
    await use(page);
    await page.close();
  },

  adminPage: async ({ browser, adminStorageState }, use) => {
    const page = await buildAuthenticatedPage(browser, adminStorageState);
    await use(page);
    await page.close();
  },

  memberPage: async ({ browser, memberStorageState }, use) => {
    const page = await buildAuthenticatedPage(browser, memberStorageState);
    await use(page);
    await page.close();
  }
});

export { expect };
