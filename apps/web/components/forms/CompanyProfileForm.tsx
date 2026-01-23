"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { ToastBanner } from "@/components/ui/Toast";
import { companyProfileDefaults } from "@/features/companies/forms/companyProfile/formDefaults";
import {
  companyProfileSchema,
  type CompanyProfileFormValues
} from "@/features/companies/forms/companyProfile/formSchema";
import type { Company } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type CompanyProfileFormProps = {
  company: Company | null;
  logoPreviewUrl?: string | null;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxLogoSizeBytes = 5 * 1024 * 1024;

export default function CompanyProfileForm({
  company,
  logoPreviewUrl
}: CompanyProfileFormProps) {
  const { t } = useClientT("companies");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoPreviewUrl ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CompanyProfileFormValues>({
    resolver: yupResolver(companyProfileSchema),
    defaultValues: {
      ...companyProfileDefaults,
      name: company?.name ?? companyProfileDefaults.name,
      industry: company?.industry ?? companyProfileDefaults.industry,
      email: company?.email ?? companyProfileDefaults.email,
      phone: company?.phone ?? companyProfileDefaults.phone,
      addressLine1: company?.address_line1 ?? companyProfileDefaults.addressLine1,
      addressLine2: company?.address_line2 ?? companyProfileDefaults.addressLine2,
      city: company?.city ?? companyProfileDefaults.city,
      state: company?.state ?? companyProfileDefaults.state,
      zipCode: company?.zip_code ?? companyProfileDefaults.zipCode,
      country: company?.country ?? companyProfileDefaults.country
    }
  });

  useEffect(() => {
    setLogoPreview(logoPreviewUrl ?? null);
  }, [logoPreviewUrl]);

  useEffect(() => {
    if (!logoFile) {
      return;
    }
    const preview = URL.createObjectURL(logoFile);
    setLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [logoFile]);

  const onSubmit = async (values: CompanyProfileFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          industry: values.industry || null,
          email: values.email || null,
          phone: values.phone || null,
          address_line1: values.addressLine1 || null,
          address_line2: values.addressLine2 || null,
          city: values.city || null,
          state: values.state || null,
          zip_code: values.zipCode || null,
          country: values.country || null
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.updateError"));
      }

      const payload = (await response.json()) as { data?: Company };
      const savedCompany = payload.data;

      let nextLogoPreview = logoPreview;

      if (logoFile && savedCompany?.id) {
        if (!allowedTypes.includes(logoFile.type)) {
          throw new Error(t("messages.invalidFile"));
        }
        if (logoFile.size > maxLogoSizeBytes) {
          throw new Error(t("messages.fileTooLarge"));
        }
        const formData = new FormData();
        formData.append("file", logoFile);

        const logoResponse = await fetch("/api/companies/logo", {
          method: "POST",
          body: formData
        });
        if (!logoResponse.ok) {
          const errorPayload = (await logoResponse.json()) as { error?: string };
          throw new Error(errorPayload.error ?? t("messages.uploadError"));
        }

        const logoPayload = (await logoResponse.json()) as {
          data?: { logo_signed_url?: string | null; logo_url?: string | null };
        };

        if (logoPayload.data?.logo_signed_url) {
          nextLogoPreview = logoPayload.data.logo_signed_url;
        }
        setLogoPreview(nextLogoPreview);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fv-company-updated", {
            detail: {
              name: values.name,
              logoUrl: nextLogoPreview ?? null
            }
          })
        );
      }

      setToast({ message: t("messages.updated"), variant: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.updateError"),
        variant: "error"
      });
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: t("messages.invalidFile"), variant: "error" });
      return;
    }
    if (file.size > maxLogoSizeBytes) {
      setToast({ message: t("messages.fileTooLarge"), variant: "error" });
      return;
    }
    setLogoFile(file);
  };

  const handleLogoPick = () => {
    fileInputRef.current?.click();
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
        label={t("fields.name")}
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label={t("fields.industry")}
        error={errors.industry?.message}
        {...register("industry")}
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4">
        <p className="text-sm font-semibold text-slate-900">{t("fields.logo")}</p>
        <p className="text-xs text-slate-500">{t("logo.helper")}</p>
        {logoPreview ? (
          <div className="mt-3 flex items-center gap-4">
            <img
              src={logoPreview}
              alt={t("fields.logo")}
              className="h-16 w-16 rounded-2xl border border-slate-200/70 object-cover shadow-sm"
            />
            <Button type="button" variant="secondary" onClick={handleLogoPick}>
              {t("actions.change")}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={handleLogoPick}
          >
            {t("actions.upload")}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
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
