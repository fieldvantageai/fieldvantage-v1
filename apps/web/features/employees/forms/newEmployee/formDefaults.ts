import type { NewEmployeeFormValues } from "./formSchema";

export const newEmployeeDefaults: NewEmployeeFormValues = {
  fullName: "",
  email: "",
  phone: "",
  role: "employee",
  status: "active"
};
