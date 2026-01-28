import type { NewJobFormValues } from "./formSchema";

export const newJobDefaults: NewJobFormValues = {
  title: "",
  customerName: "",
  customerId: "",
  scheduledFor: "",
  estimatedEndAt: "",
  status: "scheduled",
  assignedEmployeeIds: [],
  isRecurring: false,
  recurrence: null,
  notes: ""
};
