import type { Employee } from "@/features/_shared/types";

const companyId = "00000000-0000-0000-0000-000000000001";
const baseDate = "2026-01-11T08:30:00.000Z";

const seedEmployees: Employee[] = [
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    company_id: companyId,
    user_id: "user-1",
    full_name: "Lucas Andrade",
    role: "manager",
    email: "lucas@empresa.com",
    phone: "+55 11 98888-1111",
    status: "active",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    company_id: companyId,
    user_id: "user-2",
    full_name: "Bruna Campos",
    role: "technician",
    email: "bruna@empresa.com",
    phone: "+55 21 97777-2222",
    status: "active",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "11111111-2222-3333-4444-555555555555",
    company_id: companyId,
    user_id: "user-3",
    full_name: "Rafael Lima",
    role: "dispatcher",
    email: "rafael@empresa.com",
    phone: "+55 31 96666-3333",
    status: "inactive",
    created_at: baseDate,
    updated_at: baseDate
  }
];

export type CreateEmployeeInput = Pick<
  Employee,
  "full_name" | "role" | "email" | "phone"
>;

const mockEmployees = [...seedEmployees];

export async function listEmployees() {
  return mockEmployees;
}

export async function getEmployeeById(id: string) {
  return mockEmployees.find((employee) => employee.id === id) ?? null;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const now = new Date().toISOString();
  const nextIndex = mockEmployees.length + 1;
  const idSuffix = `${nextIndex}`.padStart(12, "0");
  const newEmployee: Employee = {
    id: `00000000-0000-0000-0000-${idSuffix}`,
    company_id: companyId,
    user_id: `user-${nextIndex}`,
    status: "active",
    created_at: now,
    updated_at: now,
    ...input
  };
  mockEmployees.push(newEmployee);
  return newEmployee;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput> & {
  status?: Employee["status"];
  role?: Employee["role"];
};

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const index = mockEmployees.findIndex((employee) => employee.id === id);
  if (index === -1) {
    return null;
  }
  const now = new Date().toISOString();
  const updatedEmployee: Employee = {
    ...mockEmployees[index],
    ...input,
    updated_at: now
  };
  mockEmployees[index] = updatedEmployee;
  return updatedEmployee;
}

export async function deleteEmployee(id: string) {
  const index = mockEmployees.findIndex((employee) => employee.id === id);
  if (index === -1) {
    return false;
  }
  mockEmployees.splice(index, 1);
  return true;
}
