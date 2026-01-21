import * as yup from "yup";

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
    .required("Senha obrigatoria.")
});

export type RegisterCompanyFormValues = yup.InferType<
  typeof registerCompanySchema
>;
