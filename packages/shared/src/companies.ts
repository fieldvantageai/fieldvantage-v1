import * as yup from "yup";

import type { BaseEntity } from "./base";

export type Company = BaseEntity & {
  owner_id: string;
  name: string;
  industry?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  team_size?: string | null;
  logo_url?: string | null;
};

const optionalText = () =>
  yup
    .string()
    .transform((value) => (value?.trim() === "" ? null : value))
    .nullable()
    .optional();

export const companyProfileSchema = yup.object({
  name: yup.string().required("Nome obrigatorio."),
  industry: optionalText(),
  email: optionalText().email("Informe um email valido."),
  phone: optionalText(),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  city: optionalText(),
  state: optionalText(),
  zipCode: optionalText(),
  country: optionalText()
});

export type CompanyProfileFormValues = yup.InferType<
  typeof companyProfileSchema
>;
