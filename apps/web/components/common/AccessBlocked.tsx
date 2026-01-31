"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useClientT } from "@/lib/i18n/useClientT";

type AccessBlockedProps = {
  variant: "not_member" | "inactive";
  autoSignOut?: boolean;
};

export default function AccessBlocked({ variant, autoSignOut = false }: AccessBlockedProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useClientT("access");
  useEffect(() => {
    if (!autoSignOut) {
      return;
    }
    const run = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        router.replace("/entrar");
      }
    };
    run();
  }, [autoSignOut, router]);


  const title =
    variant === "inactive" ? t("inactive.title") : t("notMember.title");
  const description =
    variant === "inactive"
      ? t("inactive.description")
      : t("notMember.description");

  return (
    <div className="w-full rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={async () => {
            try {
              setIsLoading(true);
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/entrar");
              router.refresh();
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {t("actions.signOut")}
        </Button>
      </div>
    </div>
  );
}
