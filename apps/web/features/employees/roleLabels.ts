const roleLabels: Record<string, string> = {
  owner: "Proprietario",
  admin: "Administrador",
  employee: "Colaborador"
};

export const getEmployeeRoleLabel = (role: string) => roleLabels[role] ?? role;
