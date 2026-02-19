"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { AlertTriangle, Camera, Mail, MapPin, MessageSquare, Phone, Shield, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
import { useEmployeeRoles } from "@/features/employees/roles";
import type { EmployeeWithAvatar } from "@/features/employees/service";
import { useClientT } from "@/lib/i18n/useClientT";

type EditEmployeeFormProps = {
  employee: EmployeeWithAvatar;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewEmployeeFormValues>({
    resolver: yupResolver(newEmployeeSchema),
    defaultValues: {
      firstName: employee.first_name,
      lastName: employee.last_name,
      avatarUrl: employee.avatar_url ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      jobTitle: employee.job_title ?? "",
      addressLine1: employee.address_line1 ?? "",
      addressLine2: employee.address_line2 ?? "",
      city: employee.city ?? "",
      state: employee.state ?? "",
      zipCode: employee.zip_code ?? "",
      country: employee.country ?? "Brasil",
      notes: employee.notes ?? "",
      role: employee.role,
      status: employee.status,
    },
  });

  const isActive = watch("status") === "active";
  const avatarUrl = watch("avatarUrl");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    employee.avatar_signed_url ?? null
  );

  const onSubmit = async (values: NewEmployeeFormValues) => {
    setToast(null);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.updateError"));
      }
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("messages.updateFallback"),
        variant: "error",
      });
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    setToast(null);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }
      router.push("/employees");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setToast({
        message: error instanceof Error ? error.message : t("messages.deleteFallback"),
        variant: "error",
      });
    }
  };

  return (
    <>
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
                throw new Error(data?.error ?? t("messages.updateError"));
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
              onClick={() => router.push(`/employees/${employee.id}`)}
            >
              {tCommon("actions.back")}
            </Button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {tCommon("actions.remove")}
              </button>
              <SaveAnimatedButton
                type="submit"
                isLoading={isSubmitting}
                label={t("actions.saveChanges")}
                loadingLabel={tCommon("actions.saving")}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{t("messages.deleteConfirm")}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t("messages.deleteWarning")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onDelete}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {tCommon("actions.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
