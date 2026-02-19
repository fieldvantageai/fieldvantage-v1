"use client";

import { Eye, MoreHorizontal, Pencil, Search, Trash2, UserX, X, ZapOff, Zap } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState";
import { ToastBanner } from "@/components/ui/Toast";
import { getEmployeeRoleLabel } from "@/features/employees/roleLabels";
import type { Employee } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type EmployeeWithCounts = Employee & {
  job_assignments_count?: number;
  completed_jobs_count?: number;
};

type EmployeesListClientProps = {
  employees: EmployeeWithCounts[];
};

function EmployeeActions({
  employee,
  onStatusChange,
  onDelete,
}: {
  employee: EmployeeWithCounts;
  onStatusChange: (id: string, status: "active" | "inactive") => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useClientT("employees");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const canDelete =
    employee.status === "inactive" && (employee.job_assignments_count ?? 0) === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("table.actionsMenu")}
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/employees/${employee.id}`); }}
          >
            <Eye className="h-4 w-4 text-slate-400" />
            {t("actions.viewDetails")}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/employees/${employee.id}/edit`); }}
          >
            <Pencil className="h-4 w-4 text-slate-400" />
            {t("actions.edit")}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onStatusChange(employee.id, employee.status === "active" ? "inactive" : "active");
            }}
          >
            {employee.status === "active" ? (
              <ZapOff className="h-4 w-4 text-amber-500" />
            ) : (
              <Zap className="h-4 w-4 text-emerald-500" />
            )}
            {t("actions.toggleStatus")}
          </button>
          {canDelete ? (
            <>
              <div className="my-1 h-px bg-slate-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(employee.id); }}
              >
                <Trash2 className="h-4 w-4" />
                {t("actions.delete")}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function EmployeesListClient({ employees }: EmployeesListClientProps) {
  const { t } = useClientT("employees");
  const { t: tCommon } = useClientT("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalized = query.trim().toLowerCase();

  const visibleEmployees = useMemo(() => {
    if (!normalized) return employees;
    return employees.filter((emp) => {
      const name = emp.full_name?.toLowerCase() ?? "";
      const email = emp.email?.toLowerCase() ?? "";
      const role = getEmployeeRoleLabel(emp.role).toLowerCase();
      return name.includes(normalized) || email.includes(normalized) || role.includes(normalized);
    });
  }, [employees, normalized]);

  const handleStatusChange = async (id: string, status: "active" | "inactive") => {
    const response = await fetch(`/api/employees/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setToast({ message: payload?.error ?? t("actions.changeStatusError"), variant: "error" });
      return;
    }
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setToast({ message: payload?.error ?? t("messages.deleteError"), variant: "error" });
      setIsDeleting(false);
      setDeleteConfirmId(null);
      return;
    }
    setIsDeleting(false);
    setDeleteConfirmId(null);
    router.refresh();
  };

  if (employees.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.subtitle")}
        actionLabel={t("actions.new")}
        onAction={() => router.push("/employees/new")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-2.5 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-md p-0.5 text-slate-400 transition hover:text-slate-600"
            aria-label={t("search.clear")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="shrink-0 text-sm text-slate-400">
            {visibleEmployees.length} {t("list.found")}
          </span>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        {/* Column headers — desktop only */}
        <div className="hidden border-b border-slate-100 px-4 py-2.5 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_44px] sm:items-center sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("table.name")}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("table.email")}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("table.status")}
          </span>
          <span />
        </div>

        {visibleEmployees.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-8 text-sm text-slate-400">
            <UserX className="h-5 w-5" />
            {t("search.noResults")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleEmployees.map((employee) => {
              const name = employee.full_name ?? "—";
              const color = avatarColor(name);
              const initials = getInitials(name);

              return (
                <div
                  key={employee.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/employees/${employee.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/employees/${employee.id}`);
                  }}
                  className="grid cursor-pointer grid-cols-[minmax(0,1fr)_44px] items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_44px]"
                >
                  {/* Avatar + Name + Role */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color.bg} ${color.text}`}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {getEmployeeRoleLabel(employee.role)}
                      </p>
                    </div>
                  </div>

                  {/* Email — desktop only */}
                  <span className="hidden truncate text-sm text-slate-500 sm:block">
                    {employee.email ?? "—"}
                  </span>

                  {/* Status badge — desktop only */}
                  <div className="hidden sm:block">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        employee.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {employee.status === "active"
                        ? tCommon("status.active")
                        : tCommon("status.inactive")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex justify-end"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <EmployeeActions
                      employee={employee}
                      onStatusChange={handleStatusChange}
                      onDelete={(id) => setDeleteConfirmId(id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{t("messages.deleteConfirm")}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("messages.deleteWarning")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
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
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {tCommon("actions.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
