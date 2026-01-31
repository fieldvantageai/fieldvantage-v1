"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ToastBanner } from "@/components/ui/Toast";
import { useClientT } from "@/lib/i18n/useClientT";
import { useLocale } from "@/lib/i18n/localeClient";

type InviteAcceptFormProps = {
  token: string;
  email?: string | null;
  expiresAt: string;
};

type InviteAcceptValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function InviteAcceptForm({
  token,
  email,
  expiresAt
}: InviteAcceptFormProps) {
  const { t } = useClientT("invites");
  const { locale } = useLocale();
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = useMemo(
    () =>
      yup.object({
        email: yup
          .string()
          .email(t("form.errors.emailInvalid"))
          .required(t("form.errors.emailRequired")),
        password: yup
          .string()
          .min(8, t("form.errors.passwordMin"))
          .required(t("form.errors.passwordRequired")),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref("password")], t("form.errors.confirmMatch"))
          .required(t("form.errors.confirmRequired"))
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<InviteAcceptValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: email ?? "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (values: InviteAcceptValues) => {
    setToast(null);
    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: values.email,
          password: values.password
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload?.error ?? t("form.activateError"));
      }

      setIsActivated(true);
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("form.activateError"),
        variant: "error"
      });
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
      <p className="text-xs text-slate-500">
        {(() => {
          const dateLabel = new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date(expiresAt));
          return t("form.expires").replace("{date}", dateLabel);
        })()}
      </p>
      {isActivated ? (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {t("form.successTitle")}
            </p>
            <p className="text-sm text-slate-700">{t("form.successSubtitle")}</p>
          </div>
          <Link href="/entrar">
            <Button type="button">{t("form.loginCta")}</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t("form.labels.email")}
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="invite-password"
            >
              {t("form.labels.password")}
            </label>
            <div className="relative">
              <input
                id="invite-password"
                type={showPassword ? "text" : "password"}
                className={`w-full rounded-xl border bg-white/90 px-3 py-2.5 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
                  errors.password?.message
                    ? "border-rose-400 focus:border-rose-400"
                    : "border-slate-200/70"
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {showPassword ? t("form.actions.hide") : t("form.actions.show")}
              </button>
            </div>
            {errors.password?.message ? (
              <p className="text-xs text-rose-600">{errors.password?.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="invite-confirm-password"
            >
              {t("form.labels.confirmPassword")}
            </label>
            <div className="relative">
              <input
                id="invite-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full rounded-xl border bg-white/90 px-3 py-2.5 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
                  errors.confirmPassword?.message
                    ? "border-rose-400 focus:border-rose-400"
                    : "border-slate-200/70"
                }`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {showConfirmPassword
                  ? t("form.actions.hide")
                  : t("form.actions.show")}
              </button>
            </div>
            {errors.confirmPassword?.message ? (
              <p className="text-xs text-rose-600">
                {errors.confirmPassword?.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {t("form.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
