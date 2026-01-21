import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  password: yup.string().required("Senha obrigatoria.")
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
