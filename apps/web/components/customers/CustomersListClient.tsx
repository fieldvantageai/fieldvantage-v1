"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X
} from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { Customer } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

/* ─── avatar color palette (deterministic by name) ─── */
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700"
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* ─── per-row action dropdown ─── */
type CustomerActionsProps = {
  customer: Customer;
  onDeleteRequest: (id: string) => void;
};

function CustomerActions({ customer, onDeleteRequest }: CustomerActionsProps) {
  const { t } = useClientT("customers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("actions.menu")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 text-sm text-slate-700 shadow-xl">
          <Link
            href={`/customers/${customer.id}`}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <Eye className="h-4 w-4 text-indigo-500" />
            {t("actions.view")}
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <Pencil className="h-4 w-4 text-amber-500" />
            {t("actions.edit")}
          </Link>
          <Link
            href={{
              pathname: "/jobs/new",
              query: { customerId: customer.id, customerName: customer.name }
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <Briefcase className="h-4 w-4 text-emerald-500" />
            {t("actions.newJob")}
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 transition hover:bg-rose-50"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDeleteRequest(customer.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            {t("actions.delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── main component ─── */
type CustomersListClientProps = {
  customers: Customer[];
};

export default function CustomersListClient({ customers }: CustomersListClientProps) {
  const { t } = useClientT("customers");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalized = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (normalized.length < 2) return customers;
    return customers.filter((c) => {
      const name = c.name?.toLowerCase() ?? "";
      const email = c.email?.toLowerCase() ?? "";
      const phone = c.phone?.toLowerCase() ?? "";
      const company = c.company_name?.toLowerCase() ?? "";
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        phone.includes(normalized) ||
        company.includes(normalized)
      );
    });
  }, [customers, normalized]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (customers.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.subtitle")}
        actionLabel={t("empty.cta")}
        onAction={() => router.push("/customers/new")}
        illustration={
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        }
      />
    );
  }

  return (
    <>
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 shadow-sm">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm focus-within:border-brand-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600"
              aria-label={t("search.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{visible.length}</span>{" "}
          {t("list.found")}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        {/* Column headers */}
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_44px] items-center gap-4 border-b border-slate-100 px-4 py-2.5 sm:grid">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("list.colName")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("list.colContact")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("list.colCompany")}
          </span>
          <span />
        </div>

        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            {t("search.noResults")}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((customer) => {
              const initials = getInitials(customer.name ?? "?");
              const colorCls = avatarColor(customer.name ?? "");
              return (
                <li
                  key={customer.id}
                  className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3 px-4 py-3 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_44px] sm:gap-4"
                >
                  {/* Name + avatar */}
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={customer.name}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorCls}`}
                      >
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {customer.name}
                      </p>
                      {customer.email ? (
                        <p className="truncate text-xs text-slate-400">
                          {customer.email}
                        </p>
                      ) : null}
                    </div>
                  </Link>

                  {/* Phone */}
                  <p className="hidden truncate text-sm text-slate-500 sm:block">
                    {customer.phone ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </p>

                  {/* Company name */}
                  <p className="hidden truncate text-sm text-slate-500 sm:block">
                    {customer.company_name ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </p>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <CustomerActions
                      customer={customer}
                      onDeleteRequest={setDeleteId}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Delete confirmation dialog ── */}
      {deleteId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {t("messages.deleteConfirm")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("messages.deleteWarning")}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                {t("actions.cancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t("actions.deleting") : t("actions.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
