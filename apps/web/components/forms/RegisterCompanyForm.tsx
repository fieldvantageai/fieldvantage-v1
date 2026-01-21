"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
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

export default function RegisterCompanyForm() {
  const router = useRouter();
  const { t } = useClientT("auth");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterCompanyFormValues>({
    resolver: yupResolver(registerCompanySchema),
    defaultValues: registerCompanyDefaults
  });

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

      router.push("/login");
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("register.messages.fallback"),
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
        label={t("register.fields.company")}
        placeholder={t("register.placeholders.company")}
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <Input
        label={t("register.fields.owner")}
        placeholder={t("register.placeholders.owner")}
        error={errors.ownerName?.message}
        {...register("ownerName")}
      />
      <Input
        label={t("register.fields.email")}
        placeholder={t("register.placeholders.email")}
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label={tCommon("fields.password")}
        placeholder={t("register.placeholders.password")}
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
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
