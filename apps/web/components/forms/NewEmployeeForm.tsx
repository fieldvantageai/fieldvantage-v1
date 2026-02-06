"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import CustomerAvatarUpload from "../customers/CustomerAvatarUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
  const avatarUrl = watch("avatarUrl");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const onSubmit = async (values: NewEmployeeFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.createError"));
      }

      const payload = (await response.json()) as {
        employee: {
          id: string;
        };
      };
      router.push(`/employees/${payload.employee.id}`);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}

      <CustomerAvatarUpload
        label={t("fields.avatar")}
        value={avatarUrl}
        previewUrl={avatarPreviewUrl}
        onUpload={async (file: File) => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/employees/avatar", {
            method: "POST",
            credentials: "include",
            body: formData
          });
          if (!response.ok) {
            const data = (await response.json()) as { error?: string };
            throw new Error(data?.error ?? t("messages.createError"));
          }
          const payload = (await response.json()) as {
            data: { avatar_url: string; avatar_signed_url?: string | null };
          };
          setValue("avatarUrl", payload.data.avatar_url, { shouldDirty: true });
          setAvatarPreviewUrl(payload.data.avatar_signed_url ?? payload.data.avatar_url);
          return payload.data;
        }}
        onRemove={() => {
          setValue("avatarUrl", "", { shouldDirty: true });
          setAvatarPreviewUrl(null);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("fields.firstName")}
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label={t("fields.lastName")}
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Input
        label={t("fields.jobTitle")}
        error={errors.jobTitle?.message}
        {...register("jobTitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("fields.addressLine1")}
          error={errors.addressLine1?.message}
          {...register("addressLine1")}
        />
        <Input
          label={t("fields.addressLine2")}
          error={errors.addressLine2?.message}
          {...register("addressLine2")}
        />
        <Input
          label={t("fields.city")}
          error={errors.city?.message}
          {...register("city")}
        />
        <Input
          label={t("fields.state")}
          error={errors.state?.message}
          {...register("state")}
        />
        <Input
          label={t("fields.zipCode")}
          error={errors.zipCode?.message}
          {...register("zipCode")}
        />
        <Input
          label={t("fields.country")}
          error={errors.country?.message}
          {...register("country")}
        />
      </div>

      <Textarea
        label={t("fields.notes")}
        error={errors.notes?.message}
        {...register("notes")}
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
          label={t("actions.create")}
          loadingLabel={tCommon("actions.saving")}
        />
      </div>
    </form>
  );
}
