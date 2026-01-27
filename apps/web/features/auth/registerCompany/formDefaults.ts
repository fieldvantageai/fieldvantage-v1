import type { RegisterCompanyFormValues } from "./formSchema";

export const registerCompanyDefaults: Partial<RegisterCompanyFormValues> = {
  companyName: "",
  ownerName: "",
  email: "",
  password: "",
  industry: undefined,
  teamSize: undefined
};
