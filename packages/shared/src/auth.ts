import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  password: yup.string().required("Senha obrigatoria.")
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;

export const registerCompanySchema = yup.object({
  companyName: yup.string().required("Nome da empresa obrigatorio."),
  ownerName: yup.string().required("Nome do responsavel obrigatorio."),
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  password: yup
    .string()
    .min(8, "A senha deve ter no minimo 8 caracteres.")
    .required("Senha obrigatoria."),
  industry: yup
    .string()
    .oneOf(
      [
        "cleaning",
        "handyman",
        "construction",
        "landscaping",
        "property_services",
        "other"
      ],
      "Tipo de negocio invalido."
    )
    .required("Tipo de negocio obrigatorio."),
  teamSize: yup
    .string()
    .oneOf(
      ["owner_operator", "2_5", "6_10", "11_plus"],
      "Tamanho da equipe invalido."
    )
    .required("Tamanho da equipe obrigatorio.")
});

export type RegisterCompanyFormValues = yup.InferType<
  typeof registerCompanySchema
>;
