import * as yup from "yup";

import type { BaseEntity } from "./base";

export type EmployeeRole = "owner" | "admin" | "employee";
export type EmployeeStatus = "active" | "inactive";

export type Employee = BaseEntity & {
  full_name: string;
  role: EmployeeRole;
  email?: string | null;
  phone?: string | null;
  status: EmployeeStatus;
};

export const newEmployeeSchema = yup.object({
  fullName: yup.string().required("Nome obrigatorio."),
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  phone: yup.string().optional(),
  role: yup
    .mixed<EmployeeRole>()
    .oneOf(["owner", "admin", "employee"])
    .required("Cargo obrigatorio."),
  status: yup
    .mixed<EmployeeStatus>()
    .oneOf(["active", "inactive"])
    .required("Status obrigatorio.")
});

export type NewEmployeeFormValues = yup.InferType<typeof newEmployeeSchema>;
