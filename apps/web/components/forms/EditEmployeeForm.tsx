"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Select } from "@/components/ui/Select";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newEmployeeSchema,
  type NewEmployeeFormValues
} from "@/features/employees/forms/newEmployee/formSchema";
import { useEmployeeRoles } from "@/features/employees/roles";
import type { Employee } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type EditEmployeeFormProps = {
  employee: Employee;
};

export default function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter();
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const { roles } = useEmployeeRoles();
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<NewEmployeeFormValues>({
    resolver: yupResolver(newEmployeeSchema),
    defaultValues: {
      fullName: employee.full_name,
      email: employee.email,
      phone: employee.phone ?? "",
      role: employee.role,
      status: employee.status
    }
  });

  const isActive = watch("status") === "active";

  const onSubmit = async (values: NewEmployeeFormValues) => {
    setToast(null);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.updateError"));
      }

      setToast({ message: t("messages.updated"), variant: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.updateFallback"),
        variant: "error"
      });
    }
  };

  const onDelete = async () => {
    const confirmed = window.confirm(t("messages.deleteConfirm"));
    if (!confirmed) {
      return;
    }
    setToast(null);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }

      router.push("/employees");
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.deleteFallback"),
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
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/employees")}>
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onDelete}>
            {tCommon("actions.remove")}
          </Button>
          <SaveAnimatedButton
            type="submit"
            isLoading={isSubmitting}
            label={tCommon("actions.save")}
            loadingLabel={tCommon("actions.saving")}
          />
        </div>
      </div>
    </form>
  );
}
