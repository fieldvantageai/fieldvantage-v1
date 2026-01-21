import * as yup from "yup";

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

export type CompanyProfileFormValues = yup.InferType<typeof companyProfileSchema>;
