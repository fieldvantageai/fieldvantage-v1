import * as yup from "yup";

import type { BaseEntity } from "./base";

export type JobStatus = "scheduled" | "in_progress" | "done" | "canceled";

export type JobRecurrence = {
  repeat: "daily" | "weekly" | "monthly" | "yearly";
  every: number;
  weeklyDays?: string[];
  monthlyOccurrence?: "1st" | "2nd" | "3rd" | "4th" | "last";
  monthlyDayOfWeek?: string;
};

export type Job = BaseEntity & {
  customer_id: string | null;
  customer_name?: string | null;
  title?: string | null;
  status: JobStatus;
  scheduled_for: string;
  estimated_end_at?: string | null;
  notes?: string | null;
  assigned_employee_ids?: string[];
  is_recurring?: boolean;
  recurrence?: JobRecurrence | null;
};

export const newJobSchema = yup.object({
  title: yup.string().required("Titulo obrigatorio."),
  customerName: yup.string().required("Cliente obrigatorio."),
  customerId: yup.string().optional(),
  scheduledFor: yup.string().required("Data obrigatoria."),
  estimatedEndAt: yup.string().required("Previsao de termino obrigatoria."),
  status: yup
    .mixed<JobStatus>()
    .oneOf(["scheduled", "in_progress", "done", "canceled"])
    .required("Status obrigatorio."),
  assignedEmployeeIds: yup.array().of(yup.string().required()).default([]),
  allowInactive: yup.boolean().default(false),
  isRecurring: yup.boolean().default(false),
  recurrence: yup
    .mixed<JobRecurrence>()
    .nullable()
    .test(
      "recurrence-required",
      "Recorrencia obrigatoria.",
      (value, context) =>
        !context.parent.isRecurring || Boolean(value)
    ),
  notes: yup.string().optional()
});

export type NewJobFormValues = yup.InferType<typeof newJobSchema>;
