import * as yup from "yup";

import type { BaseEntity } from "./base";

export type JobStatus = "scheduled" | "in_progress" | "done" | "canceled";

export type Job = BaseEntity & {
  customer_id: string | null;
  customer_name?: string | null;
  title?: string | null;
  status: JobStatus;
  scheduled_for: string;
  expected_completion?: string | null;
  notes?: string | null;
  assigned_employee_ids?: string[];
};

export const newJobSchema = yup.object({
  title: yup.string().required("Titulo obrigatorio."),
  customerName: yup.string().required("Cliente obrigatorio."),
  customerId: yup.string().optional(),
  scheduledFor: yup.string().required("Data obrigatoria."),
  expectedCompletion: yup.string().required("Previsao de termino obrigatoria."),
  status: yup
    .mixed<JobStatus>()
    .oneOf(["scheduled", "in_progress", "done", "canceled"])
    .required("Status obrigatorio."),
  assignedEmployeeIds: yup.array().of(yup.string().required()).default([])
});

export type NewJobFormValues = yup.InferType<typeof newJobSchema>;
