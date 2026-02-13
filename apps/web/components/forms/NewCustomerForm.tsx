"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import AddressRepeater from "../customers/AddressRepeater";
import CustomerAvatarUpload from "../customers/CustomerAvatarUpload";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Textarea } from "@/components/ui/Textarea";
import { ToastBanner } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  newCustomerSchema,
  type NewCustomerFormValues
} from "@/features/customers/forms/newCustomer/formSchema";
import { newCustomerDefaults } from "@/features/customers/forms/newCustomer/formDefaults";
import { useClientT } from "@/lib/i18n/useClientT";

export default function NewCustomerForm() {
  const { t } = useClientT("customers");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<NewCustomerFormValues>({
    resolver: yupResolver(newCustomerSchema),
    defaultValues: newCustomerDefaults
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses"
  });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarUrl = watch("avatarUrl");
  const addresses = watch("addresses") ?? [];

  const onSubmit = async (values: NewCustomerFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error(t("messages.createError"));
      }

      reset();
      router.push("/customers");
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.createFallback"),
        variant: "error"
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/customers/avatar", {
      method: "POST",
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
  };

  const handleSetPrimary = (index: number) => {
    const current = getValues("addresses") ?? [];
    current.forEach((_, idx) => {
      setValue(`addresses.${idx}.is_primary`, idx === index, {
        shouldDirty: true
      });
    });
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
        onUpload={handleAvatarUpload}
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
        onSetPrimary={(index: number) => handleSetPrimary(index)}
      />
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
              router.push("/customers");
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
