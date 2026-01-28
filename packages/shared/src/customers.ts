import * as yup from "yup";

import type { BaseEntity } from "./base";

export type Customer = BaseEntity & {
  name: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type CustomerAddress = {
  id: string;
  company_id: string;
  customer_id: string;
  type: "residential" | "business";
  label?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string | null;
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

export const customerAddressSchema = yup.object({
  type: yup
    .mixed<"residential" | "business">()
    .oneOf(["residential", "business"])
    .required("Tipo de endereco obrigatorio."),
  label: optionalText(),
  address_line1: yup.string().required("Endereco obrigatorio."),
  address_line2: optionalText(),
  city: yup.string().required("Cidade obrigatoria."),
  state: yup.string().required("Estado obrigatorio."),
  zip_code: yup.string().required("CEP obrigatorio."),
  country: yup.string().default("USA").required("Pais obrigatorio."),
  is_primary: yup.boolean().default(false)
});

export const newCustomerSchema = yup.object({
  firstName: yup.string().required("Nome obrigatorio."),
  lastName: yup.string().required("Sobrenome obrigatorio."),
  avatarUrl: optionalText(),
  email: optionalEmail(),
  phone: optionalText(),
  companyName: optionalText(),
  notes: optionalText(),
  addresses: yup
    .array()
    .of(customerAddressSchema)
    .default([])
    .test(
      "single-primary",
      "Apenas um endereco pode ser principal.",
      (addresses) =>
        !addresses ||
        addresses.filter((address) => address?.is_primary).length <= 1
    )
});

export type NewCustomerFormValues = yup.InferType<typeof newCustomerSchema>;
