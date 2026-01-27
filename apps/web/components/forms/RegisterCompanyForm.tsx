"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { ToastBanner } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  registerCompanySchema,
  type RegisterCompanyFormValues
} from "@/features/auth/registerCompany/formSchema";
import { registerCompanyDefaults } from "@/features/auth/registerCompany/formDefaults";
import { useClientT } from "@/lib/i18n/useClientT";

type StepKey =
  | "role"
  | "employeeAccess"
  | "employeeAccessSent"
  | "ownerAccount"
  | "businessType"
  | "teamSize"
  | "companyName";

type CardOption<T extends string = string> = {
  value: T;
  title: string;
  icon: React.ReactNode;
};

const renderIcon = (path: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d={path}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default function RegisterCompanyForm() {
  const router = useRouter();
  const { t } = useClientT("auth");
  const { t: tCommon } = useClientT("common");
  const [step, setStep] = useState<StepKey>("role");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [employeeRequest, setEmployeeRequest] = useState({
    fullName: "",
    contact: "",
    companyName: ""
  });
  const [employeeRequestErrors, setEmployeeRequestErrors] = useState({
    fullName: "",
    contact: ""
  });
  const [employeeRequestModalOpen, setEmployeeRequestModalOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<{
    requester_name: string;
    requester_email: string;
    company_name_optional: string;
    created_at: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterCompanyFormValues>({
    resolver: yupResolver(registerCompanySchema),
    defaultValues: registerCompanyDefaults
  });

  useEffect(() => {
    register("industry");
    register("teamSize");
  }, [register]);

  type IndustryValue = NonNullable<RegisterCompanyFormValues["industry"]>;
  type TeamSizeValue = NonNullable<RegisterCompanyFormValues["teamSize"]>;

  const industry = watch("industry") as IndustryValue | "";
  const teamSize = watch("teamSize") as TeamSizeValue | "";
  const companyName = watch("companyName");

  const businessOptions = useMemo<CardOption<IndustryValue>[]>(
    () => [
      {
        value: "cleaning",
        title: t("onboarding.businessType.options.cleaning"),
        icon: renderIcon("M4 19h16M6 19V8l6-3 6 3v11")
      },
      {
        value: "handyman",
        title: t("onboarding.businessType.options.handyman"),
        icon: renderIcon("M14 7l3 3-7 7H7v-3l7-7Z")
      },
      {
        value: "construction",
        title: t("onboarding.businessType.options.construction"),
        icon: renderIcon("M4 20h16M6 20V8h12v12M9 8V4h6v4")
      },
      {
        value: "landscaping",
        title: t("onboarding.businessType.options.landscaping"),
        icon: renderIcon("M12 3v18M7 8c1.5-1.5 3.5-2 5-2s3.5.5 5 2")
      },
      {
        value: "property_services",
        title: t("onboarding.businessType.options.propertyServices"),
        icon: renderIcon("M7 10h10M7 14h10M9 20V4h6v16")
      },
      {
        value: "other",
        title: t("onboarding.businessType.options.other"),
        icon: renderIcon("M6 12h12M12 6v12")
      }
    ],
    [t]
  );

  const teamOptions = useMemo<CardOption<TeamSizeValue>[]>(
    () => [
      {
        value: "owner_operator",
        title: t("onboarding.teamSize.options.ownerOperator"),
        icon: renderIcon("M12 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8")
      },
      {
        value: "2_5",
        title: t("onboarding.teamSize.options.twoToFive"),
        icon: renderIcon("M7 8a3 3 0 1 1 0 6M17 8a3 3 0 1 1 0 6M4 18a4 4 0 0 1 8 0M12 18a4 4 0 0 1 8 0")
      },
      {
        value: "6_10",
        title: t("onboarding.teamSize.options.sixToTen"),
        icon: renderIcon("M6 9a3 3 0 1 1 0 6M12 9a3 3 0 1 1 0 6M18 9a3 3 0 1 1 0 6")
      },
      {
        value: "11_plus",
        title: t("onboarding.teamSize.options.elevenPlus"),
        icon: renderIcon("M5 12h14M12 5v14")
      }
    ],
    [t]
  );

  const onSubmit = async (values: RegisterCompanyFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("register.messages.error"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("register.messages.fallback"),
        variant: "error"
      });
    }
  };

  const renderOptionGrid = <T extends string>(
    options: CardOption<T>[],
    selectedValue: T | "" | undefined,
    onSelect: (value: T) => void
  ) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition ${
              isSelected
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-200/70 bg-white/90 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              {option.icon}
            </span>
            <span className="font-semibold text-slate-900">{option.title}</span>
          </button>
        );
      })}
    </div>
  );

  const previousStepMap: Record<StepKey, StepKey | "landing"> = {
    role: "landing",
    employeeAccess: "role",
    employeeAccessSent: "employeeAccess",
    ownerAccount: "role",
    businessType: "ownerAccount",
    teamSize: "businessType",
    companyName: "teamSize"
  };

  const showHeader = true;
  const handleBack = () => {
    const previous = previousStepMap[step];
    if (previous === "landing") {
      router.push("/");
      return;
    }
    setStep(previous);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}

      {showHeader ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-brand-600 transition hover:bg-slate-50/70"
              aria-label={tCommon("actions.back")}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
            <p className="text-sm font-semibold text-slate-900">FieldVantage</p>
            <div className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      ) : null}

      {step === "role" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              {t("onboarding.role.title")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("ownerAccount")}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  {renderIcon("M12 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8")}
                </span>
                {t("onboarding.role.owner")}
              </button>
              <button
                type="button"
                onClick={() => setStep("employeeAccess")}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  {renderIcon("M7 8a3 3 0 1 1 0 6M17 8a3 3 0 1 1 0 6M4 18a4 4 0 0 1 8 0M12 18a4 4 0 0 1 8 0")}
                </span>
                {t("onboarding.role.employee")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "employeeAccess" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-base font-semibold text-slate-900">
                {t("onboarding.employeeAccess.title")}
              </p>
              <p className="text-sm text-slate-600">
                {t("onboarding.employeeAccess.message")}
              </p>
              <p className="text-sm text-slate-600">
                {t("onboarding.employeeAccess.followup")}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => setEmployeeRequestModalOpen(true)}
              >
                {t("onboarding.employeeAccess.requestAccess")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/entrar")}
              >
                {t("onboarding.employeeAccess.haveLogin")}
              </Button>
            </div>
          </div>

          {employeeRequestModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEmployeeRequestModalOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 text-brand-600 transition hover:bg-slate-50/70"
                    aria-label={tCommon("actions.back")}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        d="M15 6l-6 6 6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-slate-900">FieldVantage</p>
                  <div className="h-10 w-10" aria-hidden="true" />
                </div>
                <div className="space-y-4">
                  <Input
                    label={t("onboarding.employeeAccess.fullName")}
                    error={employeeRequestErrors.fullName}
                    value={employeeRequest.fullName}
                    onChange={(event) =>
                      setEmployeeRequest((prev) => ({
                        ...prev,
                        fullName: event.target.value
                      }))
                    }
                  />
                  <Input
                    label={t("onboarding.employeeAccess.contact")}
                    error={employeeRequestErrors.contact}
                    value={employeeRequest.contact}
                    onChange={(event) =>
                      setEmployeeRequest((prev) => ({
                        ...prev,
                        contact: event.target.value
                      }))
                    }
                  />
                  <Input
                    label={t("onboarding.employeeAccess.companyOptional")}
                    value={employeeRequest.companyName}
                    onChange={(event) =>
                      setEmployeeRequest((prev) => ({
                        ...prev,
                        companyName: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const nextErrors = {
                        fullName: employeeRequest.fullName.trim()
                          ? ""
                          : t("onboarding.employeeAccess.errors.fullName"),
                        contact: employeeRequest.contact.trim()
                          ? ""
                          : t("onboarding.employeeAccess.errors.contact")
                      };
                      setEmployeeRequestErrors(nextErrors);
                      if (nextErrors.fullName || nextErrors.contact) {
                        return;
                      }
                      const requestPayload = {
                        requester_name: employeeRequest.fullName.trim(),
                        requester_email: employeeRequest.contact.trim(),
                        company_name_optional: employeeRequest.companyName.trim(),
                        created_at: new Date().toISOString()
                      };
                      setLastRequest(requestPayload);
                      setEmployeeRequestModalOpen(false);
                      setStep("employeeAccessSent");
                    }}
                  >
                    {t("onboarding.employeeAccess.submit")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "employeeAccessSent" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              {t("onboarding.employeeAccess.success")}
            </p>
            {lastRequest ? (
              <p className="text-xs text-slate-500">
                {t("onboarding.employeeAccess.requestLogged")}
              </p>
            ) : null}
            <Button type="button" className="w-full" onClick={() => router.push("/entrar")}>
              {t("onboarding.employeeAccess.haveLogin")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "ownerAccount" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <Input
              label={t("onboarding.owner.fullName")}
              error={errors.ownerName?.message}
              {...register("ownerName")}
            />
            <Input
              label={t("onboarding.owner.email")}
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label={t("onboarding.owner.password")}
              type="password"
              helperText={t("onboarding.owner.passwordHelper")}
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={async () => {
                  const valid = await trigger(["ownerName", "email", "password"]);
                  if (valid) {
                    setStep("businessType");
                  }
                }}
              >
                {t("onboarding.actions.next")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "businessType" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              {t("onboarding.businessType.title")}
            </p>
            {renderOptionGrid(businessOptions, industry, (value) =>
              setValue("industry", value, { shouldDirty: true })
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!industry}
                onClick={() => setStep("teamSize")}
              >
                {t("onboarding.actions.next")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "teamSize" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              {t("onboarding.teamSize.title")}
            </p>
            {renderOptionGrid(teamOptions, teamSize, (value) =>
              setValue("teamSize", value, { shouldDirty: true })
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!teamSize}
                onClick={() => setStep("companyName")}
              >
                {t("onboarding.actions.next")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "companyName" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <div className="space-y-4">
            <Input
              label={t("onboarding.companyName.label")}
              error={errors.companyName?.message}
              {...register("companyName")}
            />
            <div className="flex justify-end">
              <SaveAnimatedButton
                type="submit"
                isLoading={isSubmitting}
                label={t("onboarding.actions.createAccount")}
                loadingLabel={tCommon("actions.saving")}
                disabled={!companyName}
              />
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
