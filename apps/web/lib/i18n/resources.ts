import authEn from "./locales/en/auth.json";
import commonEn from "./locales/en/common.json";
import customersEn from "./locales/en/customers.json";
import dashboardEn from "./locales/en/dashboard.json";
import employeesEn from "./locales/en/employees.json";
import jobsEn from "./locales/en/jobs.json";
import settingsEn from "./locales/en/settings.json";
import teamsEn from "./locales/en/teams.json";

import authEs from "./locales/es/auth.json";
import commonEs from "./locales/es/common.json";
import customersEs from "./locales/es/customers.json";
import dashboardEs from "./locales/es/dashboard.json";
import employeesEs from "./locales/es/employees.json";
import jobsEs from "./locales/es/jobs.json";
import settingsEs from "./locales/es/settings.json";
import teamsEs from "./locales/es/teams.json";

import authPt from "./locales/pt-BR/auth.json";
import commonPt from "./locales/pt-BR/common.json";
import customersPt from "./locales/pt-BR/customers.json";
import dashboardPt from "./locales/pt-BR/dashboard.json";
import employeesPt from "./locales/pt-BR/employees.json";
import jobsPt from "./locales/pt-BR/jobs.json";
import settingsPt from "./locales/pt-BR/settings.json";
import teamsPt from "./locales/pt-BR/teams.json";

export const resources = {
  en: {
    auth: authEn,
    common: commonEn,
    customers: customersEn,
    dashboard: dashboardEn,
    employees: employeesEn,
    jobs: jobsEn,
    settings: settingsEn,
    teams: teamsEn
  },
  "pt-BR": {
    auth: authPt,
    common: commonPt,
    customers: customersPt,
    dashboard: dashboardPt,
    employees: employeesPt,
    jobs: jobsPt,
    settings: settingsPt,
    teams: teamsPt
  },
  es: {
    auth: authEs,
    common: commonEs,
    customers: customersEs,
    dashboard: dashboardEs,
    employees: employeesEs,
    jobs: jobsEs,
    settings: settingsEs,
    teams: teamsEs
  }
} as const;
