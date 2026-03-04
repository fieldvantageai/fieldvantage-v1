const roleLabels: Record<string, string> = {
  owner: "Proprietario",
  admin: "Administrador",
  employee: "Colaborador",
  member: "Colaborador"
};

export const getEmployeeRoleLabel = (role: string) => roleLabels[role] ?? role;

/**
 * Retorna o label do role com escopo de filial.
 * Ex: "Administrador · Empresa toda", "Colaborador · Filial Centro", "Administrador · 2 filiais"
 */
export function getEmployeeRoleScopeLabel(
  role: string,
  branchNames: string[],
  isHq: boolean
): string {
  const base = getEmployeeRoleLabel(role);
  if (role === "owner") return base;
  if (isHq) return `${base} · Empresa toda`;
  if (branchNames.length === 0) return `${base} · Sem filial`;
  if (branchNames.length === 1) return `${base} · ${branchNames[0]}`;
  return `${base} · ${branchNames.length} filiais`;
}
