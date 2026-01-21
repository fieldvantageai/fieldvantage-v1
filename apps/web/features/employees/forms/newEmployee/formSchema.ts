import * as yup from "yup";

export const newEmployeeSchema = yup.object({
  fullName: yup.string().required("Nome obrigatorio."),
  email: yup
    .string()
    .email("Informe um email valido.")
    .required("Email obrigatorio."),
  phone: yup.string().optional(),
  role: yup
    .mixed<"owner" | "admin" | "employee">()
    .oneOf(["owner", "admin", "employee"])
    .required("Cargo obrigatorio."),
  status: yup
    .mixed<"active" | "inactive">()
    .oneOf(["active", "inactive"])
    .required("Status obrigatorio.")
});

export type NewEmployeeFormValues = yup.InferType<typeof newEmployeeSchema>;
