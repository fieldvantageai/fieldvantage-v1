import type { Customer } from "@/features/_shared/types";

const companyId = "00000000-0000-0000-0000-000000000001";
const baseDate = "2026-01-10T09:00:00.000Z";

const seedCustomers: Customer[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    company_id: companyId,
    name: "Alfa Construcao",
    email: "contato@alfaconstrucao.com",
    phone: "+55 11 94567-0101",
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    company_id: companyId,
    name: "Beta Retail",
    email: "financeiro@betaretail.com",
    phone: "+55 21 97888-0202",
    address: "Rua do Ouvidor, 200 - Rio de Janeiro, RJ",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    company_id: companyId,
    name: "Gamma Foods",
    email: "suporte@gammafoods.com",
    phone: "+55 31 91234-0303",
    address: "Av. Afonso Pena, 300 - Belo Horizonte, MG",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    company_id: companyId,
    name: "Delta Energia",
    email: "operacoes@deltaenergia.com",
    phone: "+55 41 99876-0404",
    address: "Rua XV, 400 - Curitiba, PR",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    company_id: companyId,
    name: "Epsilon Logistics",
    email: "contato@epsilonlog.com",
    phone: "+55 51 98877-0505",
    address: "Av. Ipiranga, 500 - Porto Alegre, RS",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    company_id: companyId,
    name: "Zeta Saúde",
    email: "relacionamento@zetasaude.com",
    phone: "+55 61 97766-0606",
    address: "Setor Hospitalar, 600 - Brasilia, DF",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    company_id: companyId,
    name: "Eta Education",
    email: "secretaria@etaedu.com",
    phone: "+55 81 96655-0707",
    address: "Rua da Aurora, 700 - Recife, PE",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    company_id: companyId,
    name: "Theta Tech",
    email: "hello@thetatech.com",
    phone: "+55 71 95544-0808",
    address: "Av. Oceania, 800 - Salvador, BA",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    company_id: companyId,
    name: "Iota Motors",
    email: "posvenda@iotamotors.com",
    phone: "+55 85 94433-0909",
    address: "Av. Beira Mar, 900 - Fortaleza, CE",
    created_at: baseDate,
    updated_at: baseDate
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    company_id: companyId,
    name: "Kappa Hotels",
    email: "reservas@kappahotels.com",
    phone: "+55 92 93322-1010",
    address: "Av. Eduardo Ribeiro, 100 - Manaus, AM",
    created_at: baseDate,
    updated_at: baseDate
  }
];

export type CreateCustomerInput = Pick<
  Customer,
  "name" | "email" | "phone" | "address"
>;

const mockCustomers = [...seedCustomers];

export async function listCustomers() {
  return mockCustomers;
}

export async function getCustomerById(id: string) {
  return mockCustomers.find((customer) => customer.id === id) ?? null;
}

export async function createCustomer(input: CreateCustomerInput) {
  const now = new Date().toISOString();
  const nextIndex = mockCustomers.length + 1;
  const idSuffix = `${nextIndex}`.padStart(12, "0");
  const newCustomer: Customer = {
    id: `00000000-0000-0000-0000-${idSuffix}`,
    company_id: companyId,
    created_at: now,
    updated_at: now,
    ...input
  };
  mockCustomers.push(newCustomer);
  return newCustomer;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const index = mockCustomers.findIndex((customer) => customer.id === id);
  if (index === -1) {
    return null;
  }
  const now = new Date().toISOString();
  const updatedCustomer: Customer = {
    ...mockCustomers[index],
    ...input,
    updated_at: now
  };
  mockCustomers[index] = updatedCustomer;
  return updatedCustomer;
}

export async function deleteCustomer(id: string) {
  const index = mockCustomers.findIndex((customer) => customer.id === id);
  if (index === -1) {
    return false;
  }
  mockCustomers.splice(index, 1);
  return true;
}

export { mockCustomers };
