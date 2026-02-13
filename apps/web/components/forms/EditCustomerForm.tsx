"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";

import AddressRepeater from "../customers/AddressRepeater";
import CustomerAvatarUpload from "../customers/CustomerAvatarUpload";
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
            country: address.country ?? "USA",
            is_primary: address.is_primary
          }))
        : []
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses"
  });
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

      router.push("/customers");
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
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }

      router.push("/customers");
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.deleteFallback"),
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

      <Textarea
        label={t("fields.notes")}
        placeholder={t("placeholders.notes")}
        error={errors.notes?.message}
        {...register("notes")}
      />

      <AddressRepeater
        fields={fields}
        register={register}
        errors={errors}
        primaryIndex={
          (() => {
            const index = addresses.findIndex((address) => address.is_primary);
            return index >= 0 ? index : null;
          })()
        }
        onAdd={() =>
          append({
            type: "",
            label: "",
            note: "",
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            zip_code: "",
            country: "USA",
            is_primary: fields.length === 0
          })
        }
        onRemove={(index: number) => remove(index)}
        onSetPrimary={(index: number) => {
          const current = addresses ?? [];
          current.forEach((_, idx) => {
            setValue(`addresses.${idx}.is_primary`, idx === index, {
              shouldDirty: true
            });
          });
        }}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/customers")}>
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
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
