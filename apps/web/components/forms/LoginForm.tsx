"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ToastBanner } from "@/components/ui/Toast";
import {
  loginSchema,
  type LoginFormValues
} from "@/features/auth/login/formSchema";
import { loginDefaults } from "@/features/auth/login/formDefaults";
import { useClientT } from "@/lib/i18n/useClientT";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaults
  });

  const onSubmit = async (values: LoginFormValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("login.messages.error"));
      }

      const nextParam = searchParams.get("next");
      const nextPath =
        nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
      router.push(nextPath);
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("login.messages.fallback"),
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
        label={tCommon("fields.email")}
        placeholder={t("login.placeholders.email")}
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label={tCommon("fields.password")}
        placeholder={t("login.placeholders.password")}
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("login.actions.loading") : tCommon("actions.login")}
      </Button>
    </form>
  );
}
