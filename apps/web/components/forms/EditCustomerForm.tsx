"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { AlertTriangle, Camera, Mail, MessageSquare, Phone, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";

import AddressRepeater from "../customers/AddressRepeater";
import CustomerAvatarUpload from "../customers/CustomerAvatarUpload";
import CustomerFormSection from "../customers/CustomerFormSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Textarea } from "@/components/ui/Textarea";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newCustomerSchema,
  type NewCustomerFormValues
} from "@/features/customers/forms/newCustomer/formSchema";
import type { CustomerWithAddresses } from "@/features/customers/service";
import { useClientT } from "@/lib/i18n/useClientT";

type EditCustomerFormProps = {
  customer: CustomerWithAddresses;
};

export default function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const router = useRouter();
  const { t } = useClientT("customers");
  const { t: tCommon } = useClientT("common");
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
    control,
    formState: { errors, isSubmitting }
  } = useForm<NewCustomerFormValues>({
    resolver: yupResolver(newCustomerSchema),
    defaultValues: {
      firstName: customer.first_name,
      lastName: customer.last_name,
      avatarUrl: customer.avatar_url ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      companyName: customer.company_name ?? "",
      notes: customer.notes ?? "",
      addresses: customer.addresses?.length
        ? customer.addresses.map((address) => ({
            type: address.type,
            label: address.label ?? "",
            note: address.note ?? "",
            address_line1: address.address_line1,
            address_line2: address.address_line2 ?? "",
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            country: address.country ?? "Brasil",
            is_primary: address.is_primary
          }))
        : []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    customer.avatar_signed_url ?? null
  );
  const avatarUrl = watch("avatarUrl");
  const addresses = watch("addresses") ?? [];

  const onSubmit = async (values: NewCustomerFormValues) => {
    setToast(null);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.updateError"));
      }
      router.push(`/customers/${customer.id}`);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("messages.updateFallback"),
        variant: "error"
      });
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    setToast(null);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }
      router.push("/customers");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setToast({
        message: error instanceof Error ? error.message : t("messages.deleteFallback"),
        variant: "error"
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
          description="Escolha uma foto de perfil para identificar o cliente."
        >
          <CustomerAvatarUpload
            label={t("fields.avatar")}
            value={avatarUrl}
            previewUrl={avatarPreviewUrl}
            onUpload={async (file: File) => {
              const formData = new FormData();
              formData.append("file", file);
              const response = await fetch("/api/customers/avatar", {
                method: "POST",
                body: formData
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
              label={t("fields.company")}
              placeholder={t("placeholders.company")}
              error={errors.companyName?.message}
              {...register("companyName")}
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
              label={t("fields.email")}
              placeholder={t("placeholders.email")}
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label={t("fields.phone")}
              placeholder={t("placeholders.phone")}
              helperText={t("helpers.phone")}
              error={errors.phone?.message}
              {...register("phone")}
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

        {/* Endereços */}
        <AddressRepeater
          fields={fields}
          register={register}
          errors={errors}
          primaryIndex={(() => {
            const index = addresses.findIndex((a) => a.is_primary);
            return index >= 0 ? index : null;
          })()}
          onAdd={() =>
            append({
              type: "residential",
              label: "",
              note: "",
              address_line1: "",
              address_line2: "",
              city: "",
              state: "",
              zip_code: "",
              country: "Brasil",
              is_primary: fields.length === 0
            })
          }
          onRemove={(index: number) => remove(index)}
          onSetPrimary={(index: number) => {
            const current = addresses ?? [];
            current.forEach((_, idx) => {
              setValue(`addresses.${idx}.is_primary`, idx === index, { shouldDirty: true });
            });
          }}
        />

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/customers/${customer.id}`)}
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
                label={tCommon("actions.save")}
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
                {t("actions.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
