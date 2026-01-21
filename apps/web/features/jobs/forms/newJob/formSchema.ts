import * as yup from "yup";

export const newJobSchema = yup.object({
  title: yup.string().required("Titulo obrigatorio."),
  customerName: yup.string().required("Cliente obrigatorio."),
  customerId: yup.string().optional(),
  scheduledFor: yup.string().required("Data obrigatoria."),
  expectedCompletion: yup
    .string()
    .required("Previsao de termino obrigatoria."),
  status: yup
    .mixed<"scheduled" | "in_progress" | "completed">()
    .oneOf(["scheduled", "in_progress", "completed"])
    .required("Status obrigatorio."),
  assignedEmployeeIds: yup.array().of(yup.string().required()).default([])
});

export type NewJobFormValues = yup.InferType<typeof newJobSchema>;
