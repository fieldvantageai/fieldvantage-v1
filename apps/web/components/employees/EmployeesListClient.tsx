"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { ToastBanner } from "@/components/ui/Toast";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import type { Employee } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type EmployeesListClientProps = {
  employees: Array<
    Employee & { job_assignments_count?: number; completed_jobs_count?: number }
  >;
};

export default function EmployeesListClient({ employees }: EmployeesListClientProps) {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const canFilter = normalized.length >= 3;
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openMenuId]);

  const visibleEmployees = useMemo(() => {
    if (!canFilter) {
      return employees;
    }
    return employees.filter((employee) => {
      const name = employee.full_name?.toLowerCase() ?? "";
      const email = employee.email?.toLowerCase() ?? "";
      const role = getEmployeeRoleLabel(employee.role).toLowerCase();
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        role.includes(normalized)
      );
    });
  }, [canFilter, employees, normalized]);

  if (employees.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.subtitle")}
        actionLabel={t("actions.new")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Section title={t("search.title")} description={t("search.description")}>
        <div className="space-y-2">
          <Input
            label={t("search.label")}
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query.trim().length > 0 && !canFilter ? (
            <p className="text-xs text-slate-500">{t("search.minChars")}</p>
          ) : null}
        </div>
      </Section>

      <Section title={t("list.title")} description={t("list.description")}>
        {toast ? (
          <ToastBanner
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        ) : null}
        {canFilter && visibleEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
            {t("search.noResults")}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm">
            <div className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr_1.1fr_1fr] gap-3 border-b border-slate-200/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>{t("table.name")}</span>
              <span>{t("table.email")}</span>
              <span>{t("table.completedJobs")}</span>
              <span>{t("table.createdAt")}</span>
              <span>{t("table.status")}</span>
              <span className="text-right">{t("table.actions")}</span>
            </div>
            <div className="divide-y divide-slate-200/70">
              {visibleEmployees.map((employee) => (
                <div
                  key={employee.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/employees/${employee.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      router.push(`/employees/${employee.id}`);
                    }
                  }}
                  className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr_1.1fr_1fr] items-center gap-3 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {employee.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getEmployeeRoleLabel(employee.role)}
                    </p>
                  </div>
                  <span className="truncate text-xs text-slate-500">
                    {employee.email ?? "-"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {employee.completed_jobs_count ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }).format(new Date(employee.created_at))}
                  </span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {employee.status === "active"
                      ? tCommon("status.active")
                      : tCommon("status.inactive")}
                  </span>
                  <div className="flex justify-end">
                    <div
                      className="relative"
                      ref={employee.id === openMenuId ? menuRef : null}
                    >
                      <button
                        type="button"
                        aria-label={t("table.actionsMenu")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((prev) =>
                            prev === employee.id ? null : employee.id
                          );
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="5" cy="12" r="1.7" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.7" fill="currentColor" />
                          <circle cx="19" cy="12" r="1.7" fill="currentColor" />
                        </svg>
                      </button>
                      {openMenuId === employee.id ? (
                        <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-700 shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(null);
                              router.push(`/employees/${employee.id}/edit`);
                            }}
                          >
                            {t("actions.edit")}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                            onClick={async (event) => {
                              event.stopPropagation();
                              setOpenMenuId(null);
                              const nextStatus =
                                employee.status === "active" ? "inactive" : "active";
                              const response = await fetch(
                                `/api/employees/${employee.id}/status`,
                                {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: nextStatus })
                                }
                              );
                              if (!response.ok) {
                                const payload = (await response.json()) as {
                                  error?: string;
                                };
                                setToast({
                                  message:
                                    payload?.error ??
                                    t("actions.changeStatusError"),
                                  variant: "error"
                                });
                                return;
                              }
                              router.refresh();
                            }}
                          >
                            {t("actions.toggleStatus")}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(null);
                              router.push(`/employees/${employee.id}`);
                            }}
                          >
                            {t("actions.viewDetails")}
                          </button>
                          {employee.status === "inactive" &&
                          (employee.job_assignments_count ?? 0) === 0 ? (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50/70"
                              onClick={async (event) => {
                                event.stopPropagation();
                                setOpenMenuId(null);
                                if (!window.confirm(t("messages.deleteConfirm"))) {
                                  return;
                                }
                                const response = await fetch(
                                  `/api/employees/${employee.id}`,
                                  { method: "DELETE", credentials: "include" }
                                );
                                if (!response.ok) {
                                  const payload = (await response.json()) as {
                                    error?: string;
                                  };
                                  setToast({
                                    message:
                                      payload?.error ?? t("messages.deleteError"),
                                    variant: "error"
                                  });
                                  return;
                                }
                                router.refresh();
                              }}
                            >
                              {t("actions.delete")}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
