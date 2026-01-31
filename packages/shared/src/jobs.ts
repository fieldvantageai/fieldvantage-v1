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
  customer_address_id?: string | null;
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
  customerAddressId: yup
    .string()
    .transform((value) => (value?.trim() === "" ? null : value))
    .nullable()
    .optional()
    .test(
      "customer-address-requires-customer",
      "Selecione um cliente para escolher o endereco.",
      (value, context) => {
        if (!value) {
          return true;
        }
        return Boolean(context.parent.customerId);
      }
    ),
  scheduledFor: yup.string().required("Data obrigatoria."),
  estimatedEndAt: yup
    .string()
    .transform((value) => (value?.trim() === "" ? null : value))
    .nullable()
    .test(
      "end-after-start",
      "Previsao de termino nao pode ser anterior a data inicial.",
      (value, context) => {
        if (!value) {
          return true;
        }
        const startRaw = context.parent.scheduledFor as string | undefined;
        if (!startRaw) {
          return true;
        }
        const start = new Date(startRaw);
        const end = new Date(value);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return false;
        }
        return end.getTime() >= start.getTime();
      }
    ),
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
