const roleLabels: Record<string, string> = {
  technician: "Tecnico",
  manager: "Gestor",
  dispatcher: "Despachante"
};

export const getEmployeeRoleLabel = (role: string) => roleLabels[role] ?? role;
