import type { BaseEntity } from "./base";

export type UserProfile = BaseEntity & {
  user_id: string;
  full_name: string;
  role: "owner" | "admin" | "employee";
  email: string;
};

export type Team = BaseEntity & {
  name: string;
  lead_employee_id?: string;
};

export type JobAssignment = BaseEntity & {
  job_id: string;
  employee_id: string;
  assigned_at: string;
};

export type Note = BaseEntity & {
  job_id: string;
  author_id: string;
  body: string;
};

export type Payment = BaseEntity & {
  job_id: string;
  amount_cents: number;
  status: "pending" | "paid" | "overdue";
  method: "manual";
};

export type Invite = BaseEntity & {
  email: string;
  role: "employee" | "customer";
  token: string;
  expires_at: string;
  used_at?: string;
};
