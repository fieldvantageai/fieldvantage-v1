import type { NewJobFormValues } from "./formSchema";

export const newJobDefaults: NewJobFormValues = {
  title: "",
  customerName: "",
  customerId: "",
  scheduledFor: "",
  expectedCompletion: "",
  status: "scheduled",
  assignedEmployeeIds: []
};
