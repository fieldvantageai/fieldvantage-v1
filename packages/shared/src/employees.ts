import * as yup from "yup";

import type { BaseEntity } from "./base";

export type EmployeeRole = "owner" | "admin" | "employee";
export type EmployeeStatus = "active" | "inactive";
export type NavigationPreference = "auto" | "google_maps" | "apple_maps" | "waze";

export type Employee = BaseEntity & {
  first_name: string;
  last_name: string;
  full_name: string;
  role: EmployeeRole;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  notes?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  preferred_navigation_app?: NavigationPreference | null;
  status: EmployeeStatus;
};

const optionalText = () =>
  yup
    .string()
    .transform((value) => (value?.trim() === "" ? null : value))
    .nullable()
    .optional();

const optionalEmail = () =>
  yup
    .string()
    .transform((value) => (value?.trim() === "" ? null : value))
    .nullable()
    .email("Informe um email valido.")
    .optional();

export const newEmployeeSchema = yup.object({
  firstName: yup.string().required("Nome obrigatorio."),
  lastName: yup.string().required("Sobrenome obrigatorio."),
  avatarUrl: optionalText(),
  email: optionalEmail(),
  phone: optionalText(),
  jobTitle: optionalText(),
  notes: optionalText(),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  city: optionalText(),
  state: optionalText(),
  zipCode: optionalText(),
  country: optionalText(),
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
