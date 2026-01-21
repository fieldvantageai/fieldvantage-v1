export type BaseEntity = {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
};

export type Company = BaseEntity & {
  name: string;
  legal_name?: string;
  industry?: string;
};

export type UserProfile = BaseEntity & {
  user_id: string;
  full_name: string;
  role: "owner" | "admin" | "employee";
  email: string;
};

export type Customer = BaseEntity & {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Employee = BaseEntity & {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
};

export type Team = BaseEntity & {
  name: string;
  lead_employee_id?: string;
};

export type Job = BaseEntity & {
  customer_id: string;
  customer_name?: string;
  title: string;
  status: "scheduled" | "in_progress" | "completed";
  scheduled_for: string;
  expected_completion?: string;
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
