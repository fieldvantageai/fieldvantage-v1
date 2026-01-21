export type EmployeeRoleOption = {
  id: string;
  label: string;
};

export const defaultEmployeeRoles: EmployeeRoleOption[] = [
  { id: "owner", label: "Proprietario" },
  { id: "admin", label: "Administrador" },
  { id: "employee", label: "Colaborador" }
];

export const useEmployeeRoles = () => {
  const getRoleLabel = (roleId: string) =>
    defaultEmployeeRoles.find((role) => role.id === roleId)?.label ?? roleId;

  return { roles: defaultEmployeeRoles, getRoleLabel };
};
