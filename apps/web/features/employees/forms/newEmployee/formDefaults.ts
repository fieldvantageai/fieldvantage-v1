import type { NewEmployeeFormValues } from "./formSchema";

export const newEmployeeDefaults: NewEmployeeFormValues = {
  firstName: "",
  lastName: "",
  avatarUrl: "",
  email: "",
  phone: "",
  jobTitle: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "USA",
  notes: "",
  role: "employee",
  status: "active"
};
