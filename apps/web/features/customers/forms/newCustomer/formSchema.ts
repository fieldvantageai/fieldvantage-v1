import * as yup from "yup";

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
