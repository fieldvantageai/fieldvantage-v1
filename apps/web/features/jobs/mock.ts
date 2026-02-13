import type { Job } from "@/features/_shared/types";

const companyId = "00000000-0000-0000-0000-000000000001";
const baseDate = "2026-01-12T08:00:00.000Z";

const seedJobs: Job[] = [
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    company_id: companyId,
    customer_id: "11111111-1111-1111-1111-111111111111",
    customer_name: "Alfa Construcao",
    title: "Manutencao preventiva - Loja Paulista",
    status: "scheduled",
    scheduled_for: "2026-01-20T09:00:00.000Z",
    estimated_end_at: "2026-01-22T18:00:00.000Z",
    assigned_membership_ids: ["eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"],
    is_recurring: false,
    recurrence: null,
    notes: null,
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    company_id: companyId,
    customer_id: "22222222-2222-2222-2222-222222222222",
    customer_name: "Beta Retail",
    title: "Instalacao de sensores - Centro RJ",
    status: "in_progress",
    scheduled_for: "2026-01-18T13:30:00.000Z",
    estimated_end_at: "2026-01-19T16:00:00.000Z",
    assigned_membership_ids: [
      "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      "ffffffff-ffff-ffff-ffff-ffffffffffff"
    ],
    is_recurring: true,
    recurrence: { repeat: "weekly", every: 1, weeklyDays: ["Mon", "Wed"] },
    notes: "Levar sensores extras.",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    company_id: companyId,
    customer_id: "33333333-3333-3333-3333-333333333333",
    customer_name: "Gamma Foods",
    title: "Vistoria tecnica - Unidade BH",
    status: "done",
    scheduled_for: "2026-01-15T10:00:00.000Z",
    estimated_end_at: "2026-01-16T15:00:00.000Z",
    assigned_membership_ids: ["11111111-2222-3333-4444-555555555555"],
    is_recurring: false,
    recurrence: null,
    notes: null,
    created_at: baseDate,
    updated_at: baseDate
  }
];

export type CreateJobInput = Pick<
  Job,
  | "title"
  | "status"
  | "scheduled_for"
  | "customer_id"
  | "customer_name"
  | "estimated_end_at"
  | "assigned_membership_ids"
  | "is_recurring"
  | "recurrence"
  | "notes"
>;

const mockJobs = [...seedJobs];

export async function listJobs() {
  return mockJobs;
}

export async function getJobById(id: string) {
  return mockJobs.find((job) => job.id === id) ?? null;
}

export async function createJob(input: CreateJobInput) {
  const now = new Date().toISOString();
  const nextIndex = mockJobs.length + 1;
  const idSuffix = `${nextIndex}`.padStart(12, "0");
  const newJob: Job = {
    id: `00000000-0000-0000-0000-${idSuffix}`,
    company_id: companyId,
    created_at: now,
    updated_at: now,
    ...input
  };
  mockJobs.push(newJob);
  return newJob;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export async function updateJob(id: string, input: UpdateJobInput) {
  const index = mockJobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return null;
  }
  const now = new Date().toISOString();
  const updatedJob: Job = {
    ...mockJobs[index],
    ...input,
    updated_at: now
  };
  mockJobs[index] = updatedJob;
  return updatedJob;
}

export async function deleteJob(id: string) {
  const index = mockJobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return false;
  }
  mockJobs.splice(index, 1);
  return true;
}
