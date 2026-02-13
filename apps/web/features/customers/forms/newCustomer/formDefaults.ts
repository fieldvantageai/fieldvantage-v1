import type { NewCustomerFormValues } from "./formSchema";

export const newCustomerDefaults: NewCustomerFormValues = {
  firstName: "",
  lastName: "",
  avatarUrl: "",
  email: "",
  phone: "",
  notes: "",
  addresses: []
};
