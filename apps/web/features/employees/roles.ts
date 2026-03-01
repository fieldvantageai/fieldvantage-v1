export type EmployeeRoleOption = {
  id: string;
  label: string;
};

export const defaultEmployeeRoles: EmployeeRoleOption[] = [
  { id: "owner", label: "Proprietario" },
  { id: "admin", label: "Administrador" },
  { id: "employee", label: "Colaborador" }
];

/**
 * Filtra as opcoes de role disponiveis com base no contexto do editor.
 * - Owner: ve todas as opcoes
 * - Admin HQ (sem filiais): ve Admin e Colaborador
 * - Admin de filial: ve somente Colaborador
 * - Member: nao deveria chegar aqui, retorna vazio
 */
export function filterRolesForEditor(
  editorRole: string,
  editorIsHq: boolean
): EmployeeRoleOption[] {
  if (editorRole === "owner") return defaultEmployeeRoles;
  if (editorRole === "admin" && editorIsHq) {
    return defaultEmployeeRoles.filter((r) => r.id !== "owner");
  }
  if (editorRole === "admin") {
    return defaultEmployeeRoles.filter((r) => r.id === "employee");
  }
  return [];
}

export const useEmployeeRoles = () => {
  const getRoleLabel = (roleId: string) =>
    defaultEmployeeRoles.find((role) => role.id === roleId)?.label ?? roleId;

  return { roles: defaultEmployeeRoles, getRoleLabel };
};
