"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Camera, Mail, MapPin, MessageSquare, Phone, Shield, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import CustomerAvatarUpload from "../customers/CustomerAvatarUpload";
import CustomerFormSection from "../customers/CustomerFormSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newEmployeeSchema,
  type NewEmployeeFormValues,
} from "@/features/employees/forms/newEmployee/formSchema";
import { newEmployeeDefaults } from "@/features/employees/forms/newEmployee/formDefaults";
import { useEmployeeRoles } from "@/features/employees/roles";
import { useClientT } from "@/lib/i18n/useClientT";

export default function NewEmployeeForm() {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const router = useRouter();
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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NewEmployeeFormValues>({
    resolver: yupResolver(newEmployeeSchema),
    defaultValues: newEmployeeDefaults,
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
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.createError"));
      }
      const payload = (await response.json()) as { employee: { id: string } };
      router.push(`/employees/${payload.employee.id}`);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("messages.createFallback"),
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-28">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}

      {/* Foto */}
      <CustomerFormSection
        icon={Camera}
        title={t("fields.avatar")}
        description="Escolha uma foto de perfil para identificar o colaborador."
      >
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
              body: formData,
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
      </CustomerFormSection>

      {/* Dados pessoais */}
      <CustomerFormSection
        icon={UserRound}
        title={t("sections.identity")}
        description={t("sections.identitySubtitle")}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("fields.firstName")}
              placeholder={t("placeholders.firstName")}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label={t("fields.lastName")}
              placeholder={t("placeholders.lastName")}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label={t("fields.jobTitle")}
            placeholder={t("placeholders.jobTitle")}
            error={errors.jobTitle?.message}
            {...register("jobTitle")}
          />
        </div>
      </CustomerFormSection>

      {/* Contato */}
      <CustomerFormSection
        icon={Mail}
        title={t("sections.contact")}
        description={t("sections.contactSubtitle")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("fields.emailOptional")}
            placeholder={t("placeholders.email")}
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label={t("fields.phone")}
            placeholder={t("placeholders.phone")}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
      </CustomerFormSection>

      {/* Endereço */}
      <CustomerFormSection
        icon={MapPin}
        title={t("sections.address")}
        description={t("sections.addressSubtitle")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t("fields.addressLine1")}
            placeholder={t("placeholders.addressLine1")}
            error={errors.addressLine1?.message}
            {...register("addressLine1")}
          />
          <Input
            label={t("fields.addressLine2")}
            placeholder={t("placeholders.addressLine2")}
            error={errors.addressLine2?.message}
            {...register("addressLine2")}
          />
          <Input
            label={t("fields.city")}
            placeholder={t("placeholders.city")}
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label={t("fields.state")}
            placeholder={t("placeholders.state")}
            error={errors.state?.message}
            {...register("state")}
          />
          <Input
            label={t("fields.zipCode")}
            placeholder={t("placeholders.zipCode")}
            error={errors.zipCode?.message}
            {...register("zipCode")}
          />
          <Input
            label={t("fields.country")}
            placeholder={t("placeholders.country")}
            error={errors.country?.message}
            {...register("country")}
          />
        </div>
      </CustomerFormSection>

      {/* Observações */}
      <CustomerFormSection
        icon={MessageSquare}
        title={t("sections.notes")}
        description={t("sections.notesSubtitle")}
      >
        <Textarea
          label={t("fields.notes")}
          placeholder={t("placeholders.notes")}
          rows={3}
          error={errors.notes?.message}
          {...register("notes")}
        />
      </CustomerFormSection>

      {/* Acesso */}
      <CustomerFormSection
        icon={Shield}
        title={t("sections.access")}
        description={t("sections.accessSubtitle")}
      >
        <div className="space-y-4">
          <Select
            label={t("fields.role")}
            error={errors.role?.message}
            options={roles.map((role) => ({ value: role.id, label: role.label }))}
            {...register("role")}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              checked={isActive}
              onChange={(e) =>
                setValue("status", e.target.checked ? "active" : "inactive", { shouldDirty: true })
              }
            />
            <div>
              <p className="font-medium">{t("fields.activeStatus")}</p>
              <p className="text-xs text-slate-500">
                {isActive ? t("status.activeHint") : t("status.inactiveHint")}
              </p>
            </div>
          </label>
          <input type="hidden" {...register("status")} />
        </div>
      </CustomerFormSection>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!isDirty || window.confirm(t("messages.cancelConfirm"))) {
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
      </div>
    </form>
  );
}
