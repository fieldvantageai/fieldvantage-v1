export type BaseEntity = {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  industry?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  team_size?: string | null;
  logo_url?: string | null;
};

export type UserProfile = BaseEntity & {
  user_id: string;
  full_name: string;
  role: "owner" | "admin" | "employee";
  email: string;
};

export type Customer = BaseEntity & {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type Employee = BaseEntity & {
  full_name: string;
  role: "owner" | "admin" | "employee";
  email?: string | null;
  phone?: string | null;
  status: "active" | "inactive";
};

export type Team = BaseEntity & {
  name: string;
  lead_employee_id?: string;
};

export type Job = BaseEntity & {
  customer_id: string | null;
  customer_name?: string | null;
  title?: string | null;
  status: "scheduled" | "in_progress" | "done" | "canceled";
  scheduled_for: string;
  expected_completion?: string | null;
  notes?: string | null;
  assigned_employee_ids?: string[];
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
