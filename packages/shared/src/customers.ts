import * as yup from "yup";

import type { BaseEntity } from "./base";

export type Customer = BaseEntity & {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  notes?: string | null;
};

export const newCustomerSchema = yup.object({
  name: yup.string().required("Nome obrigatorio."),
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  phone: yup.string().required("Telefone obrigatorio."),
  address: yup.string().required("Endereco obrigatorio.")
});

export type NewCustomerFormValues = yup.InferType<typeof newCustomerSchema>;
