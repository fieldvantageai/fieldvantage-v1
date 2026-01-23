"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Select } from "@/components/ui/Select";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newEmployeeSchema,
  type NewEmployeeFormValues
} from "@/features/employees/forms/newEmployee/formSchema";
import { newEmployeeDefaults } from "@/features/employees/forms/newEmployee/formDefaults";
import { useEmployeeRoles } from "@/features/employees/roles";
import { useClientT } from "@/lib/i18n/useClientT";

export default function NewEmployeeForm() {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const router = useRouter();
  const { roles } = useEmployeeRoles();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<NewEmployeeFormValues>({
    resolver: yupResolver(newEmployeeSchema),
    defaultValues: newEmployeeDefaults
  });

  const isActive = watch("status") === "active";

  const onSubmit = async (values: NewEmployeeFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.createError"));
      }

      reset();
      router.push("/employees");
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.createFallback"),
        variant: "error"
      });
    }
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
      <Input
        label={t("fields.fullName")}
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Input
        label={t("fields.email")}
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label={t("fields.phone")}
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Select
        label={t("fields.role")}
        error={errors.role?.message}
        options={roles.map((role) => ({
          value: role.id,
          label: role.label
        }))}
        {...register("role")}
      />
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          checked={isActive}
          onChange={(event) =>
            setValue("status", event.target.checked ? "active" : "inactive", {
              shouldDirty: true
            })
          }
        />
        <span>{t("fields.activeStatus")}</span>
      </label>
      <input type="hidden" {...register("status")} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (
              !isDirty ||
              window.confirm(
                t("messages.cancelConfirm")
              )
            ) {
              router.push("/employees");
            }
          }}
        >
          {tCommon("actions.back")}
        </Button>
        <SaveAnimatedButton
          type="submit"
          isLoading={isSubmitting}
          label={tCommon("actions.save")}
          loadingLabel={tCommon("actions.saving")}
        />
      </div>
    </form>
  );
}
