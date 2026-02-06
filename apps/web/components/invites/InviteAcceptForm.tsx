"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ToastBanner } from "@/components/ui/Toast";
import { useClientT } from "@/lib/i18n/useClientT";
import { useLocale } from "@/lib/i18n/localeClient";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showLoginCta, setShowLoginCta] = useState(false);
  const [showWrongAccount, setShowWrongAccount] = useState(false);
  const [autoAcceptAttempted, setAutoAcceptAttempted] = useState(false);
  const returnTo = `/invite/accept?token=${encodeURIComponent(token)}`;

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
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<InviteAcceptValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: email ?? "",
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          const emailValue = data.user?.email?.toLowerCase() ?? null;
          setAuthEmail(emailValue);
          if (!email && emailValue) {
            setValue("email", emailValue);
          }
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (values: InviteAcceptValues) => {
    setToast(null);
    setShowLoginCta(false);
    setShowWrongAccount(false);
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
        const payload = (await response.json()) as {
          error?: string;
          code?: string;
        };
        const message = payload?.error ?? t("form.activateError");
        if (response.status === 401) {
          setShowLoginCta(true);
        }
        if (response.status === 409) {
          if (payload.code === "wrong_account") {
            setShowWrongAccount(true);
            return;
          }
          setShowLoginCta(true);
          router.push(`/entrar?next=${encodeURIComponent(returnTo)}`);
          return;
        }
        throw new Error(
          response.status === 401 ? t("form.loginRequired") : message
        );
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

  const handleAccept = async (currentEmail: string) => {
    setToast(null);
    setShowLoginCta(false);
    setShowWrongAccount(false);
    setIsAccepting(true);
    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: currentEmail
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
          code?: string;
        };
        if (response.status === 401) {
          setShowLoginCta(true);
          throw new Error(t("form.loginRequired"));
        }
        if (response.status === 409 && payload.code === "wrong_account") {
          setShowWrongAccount(true);
          return;
        }
        throw new Error(payload?.error ?? t("form.acceptError"));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t("form.acceptError"),
        variant: "error"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const lockedEmail = Boolean(email);
  const inviteEmail = (email ?? "").toLowerCase();
  const draftEmail = watch("email");
  const isLoggedIn = Boolean(authEmail);
  const isWrongAccount =
    Boolean(authEmail && inviteEmail) && authEmail !== inviteEmail;

  const resolveAcceptEmail = () => {
    if (lockedEmail) {
      return inviteEmail;
    }
    if (draftEmail) {
      return draftEmail.trim().toLowerCase();
    }
    return authEmail ?? "";
  };

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }
    if (!isLoggedIn || isWrongAccount || autoAcceptAttempted) {
      return;
    }
    const currentEmail = resolveAcceptEmail();
    if (!currentEmail) {
      return;
    }
    setAutoAcceptAttempted(true);
    handleAccept(currentEmail);
  }, [
    isCheckingAuth,
    isLoggedIn,
    isWrongAccount,
    autoAcceptAttempted,
    draftEmail,
    authEmail
  ]);

  return (
    <div className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
      {showLoginCta ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{t("form.loginPrompt")}</p>
          <div className="mt-3">
            <Link href={`/entrar?next=${encodeURIComponent(returnTo)}`}>
              <Button type="button" variant="secondary">
                {t("form.loginCta")}
              </Button>
            </Link>
          </div>
        </div>
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
      ) : isCheckingAuth ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-11 rounded-2xl bg-slate-100" />
          <div className="h-11 rounded-2xl bg-slate-100" />
        </div>
      ) : isLoggedIn ? (
        <div className="space-y-4">
          {isWrongAccount || showWrongAccount ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t("form.wrongAccount")}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push(`/entrar?next=${encodeURIComponent(returnTo)}`);
                    router.refresh();
                  }}
                >
                  {t("form.logoutCta")}
                </Button>
                <Link href={`/entrar?next=${encodeURIComponent(returnTo)}`}>
                  <Button type="button">{t("form.loginCta")}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Input
                label={t("form.labels.email")}
                type="email"
                error={errors.email?.message}
                disabled={lockedEmail}
                {...register("email")}
              />
              <Button
                type="button"
                disabled={isAccepting}
                onClick={async () => {
                  const currentEmail = lockedEmail
                    ? inviteEmail
                    : (draftEmail ?? "").trim().toLowerCase();
                  await handleAccept(currentEmail);
                }}
              >
                {isAccepting ? t("form.actions.loading") : t("form.acceptCta")}
              </Button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{t("form.loginPrompt")}</p>
            <div className="mt-3">
              <Link href={`/entrar?next=${encodeURIComponent(returnTo)}`}>
                <Button type="button" variant="secondary">
                  {t("form.loginCta")}
                </Button>
              </Link>
            </div>
          </div>
          <Input
            label={t("form.labels.email")}
            type="email"
            error={errors.email?.message}
            disabled={lockedEmail}
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
            {isSubmitting ? t("form.actions.loading") : t("form.submit")}
          </Button>
          <p className="text-xs text-slate-500">{t("form.createHint")}</p>
        </form>
      )}
    </div>
  );
}
