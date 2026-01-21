"use client";

import { useEffect, useState } from "react";

export type EmployeeRoleOption = {
  id: string;
  label: string;
};

const storageKey = "fv_employee_roles_v1";

export const defaultEmployeeRoles: EmployeeRoleOption[] = [
  { id: "technician", label: "Tecnico" },
  { id: "manager", label: "Gestor" },
  { id: "dispatcher", label: "Despachante" }
];

const buildRoleId = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

export const readEmployeeRoles = (): EmployeeRoleOption[] => {
  if (typeof window === "undefined") {
    return defaultEmployeeRoles;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultEmployeeRoles;
    }
    const parsed = JSON.parse(raw) as EmployeeRoleOption[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultEmployeeRoles;
    }
    return parsed.filter((role) => role.id && role.label);
  } catch {
    return defaultEmployeeRoles;
  }
};

export const saveEmployeeRoles = (roles: EmployeeRoleOption[]) => {
  if (typeof window === "undefined") {
    return roles;
  }
  const sanitized = roles
    .map((role) => ({
      id: role.id || buildRoleId(role.label),
      label: role.label.trim()
    }))
    .filter((role) => role.id && role.label);
  window.localStorage.setItem(storageKey, JSON.stringify(sanitized));
  window.dispatchEvent(
    new CustomEvent("fv-employee-roles-updated", { detail: sanitized })
  );
  return sanitized;
};

export const useEmployeeRoles = () => {
  const [roles, setRoles] = useState<EmployeeRoleOption[]>(defaultEmployeeRoles);

  useEffect(() => {
    const current = readEmployeeRoles();
    setRoles(current);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setRoles(readEmployeeRoles());
      }
    };

    const handleCustom = (event: Event) => {
      const custom = event as CustomEvent<EmployeeRoleOption[]>;
      if (Array.isArray(custom.detail)) {
        setRoles(custom.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("fv-employee-roles-updated", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("fv-employee-roles-updated", handleCustom);
    };
  }, []);

  const getRoleLabel = (roleId: string) =>
    roles.find((role) => role.id === roleId)?.label ?? roleId;

  return { roles, getRoleLabel };
};
