"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import OrdersFiltersBar from "./OrdersFiltersBar";
import OrdersKanban from "./OrdersKanban";
import OrdersPagination from "./OrdersPagination";
import OrdersTable from "./OrdersTable";
import StatusUpdateDialog from "./StatusUpdateDialog";
import type { Job } from "@fieldvantage/shared";
import { useClientT } from "@/lib/i18n/useClientT";

type OrdersListClientProps = {
  locale: string;
};

type FiltersState = {
  query: string;
  status: "all" | Job["status"];
  fromDate?: Date | null;
  toDate?: Date | null;
  unassigned?: boolean;
};

type SortKey = "title" | "status" | "startDate";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const parseDate = (value: string | null) =>
  value ? new Date(value) : null;

const toDateTimeLocalValue = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateOnly = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getParam = (params: URLSearchParams, key: string) =>
  params.get(key) ?? "";

const parseState = (params: URLSearchParams) => {
  const parsedPage = Number(getParam(params, "page") || "1");
  const rawSort = getParam(params, "sort");
  const sortKey =
    rawSort === "title" || rawSort === "status" || rawSort === "startDate"
      ? (rawSort as SortKey)
      : "startDate";
  return {
    filters: {
      query: getParam(params, "q"),
      status: (getParam(params, "status") as FiltersState["status"]) || "all",
      fromDate: parseDate(params.get("from")),
      toDate: parseDate(params.get("to")),
      unassigned: getParam(params, "unassigned") === "1"
    },
    sortKey,
    sortDir: (getParam(params, "dir") as SortDir) || "desc",
    page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  };
};

export default function OrdersListClient({
  locale
}: OrdersListClientProps) {
  const { t } = useClientT("jobs");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FiltersState>({
    query: "",
    status: "all",
    fromDate: null,
    toDate: null,
    unassigned: false
  });
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Array<Job & { assigned_label: string }>>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [canEditOrders, setCanEditOrders] = useState(false);
  const [statusDialogJob, setStatusDialogJob] = useState<
    (Job & { assigned_label: string }) | null
  >(null);
  const [statusDialogChangedAt, setStatusDialogChangedAt] = useState(
    toDateTimeLocalValue(new Date())
  );
  const [statusDialogNote, setStatusDialogNote] = useState("");
  const [statusDialogPreset, setStatusDialogPreset] = useState<Job["status"] | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const persistStatusChange = async (
    orderId: string,
    status: Job["status"],
    changedAt: string,
    note?: string | null
  ) => {
    const payload = {
      status,
      changedAt,
      note: note?.trim() || null
    };
    const response = await fetch(`/api/jobs/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data?.error ?? t("kanban.updateError"));
    }
    setJobs((prev) =>
      prev.map((job) => (job.id === orderId ? { ...job, status } : job))
    );
  };

  useEffect(() => {
    const parsed = parseState(searchParams);
    setFilters(parsed.filters);
    setSortKey(parsed.sortKey);
    setSortDir(parsed.sortDir);
    setPage(parsed.page);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) {
      params.set("q", filters.query);
    }
    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters.fromDate) {
      params.set("from", filters.fromDate.toISOString().split("T")[0]);
    }
    if (filters.toDate) {
      params.set("to", filters.toDate.toISOString().split("T")[0]);
    }
    if (filters.unassigned) {
      params.set("unassigned", "1");
    }
    params.set("sort", sortKey);
    params.set("dir", sortDir);
    params.set("page", String(page));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      const url = `${pathname}?${nextQuery}`;
      router.replace(url);
    }
  }, [filters, page, pathname, router, searchParams, sortDir, sortKey]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.query) {
        params.set("q", filters.query);
      }
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.fromDate) {
        params.set("from", filters.fromDate.toISOString().split("T")[0]);
      }
      if (filters.toDate) {
        params.set("to", filters.toDate.toISOString().split("T")[0]);
      }
    if (filters.unassigned) {
      params.set("unassigned", "1");
    }
      params.set("sort", sortKey);
      params.set("dir", sortDir);
      params.set("page", String(page));

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          data: Array<Job & { assigned_label: string }>;
          total: number;
        };
        setJobs(payload.data ?? []);
        setTotal(payload.total ?? 0);
      } else {
        setJobs([]);
        setTotal(0);
      }
      setIsLoading(false);
    };

    fetchJobs();
  }, [filters, page, sortDir, sortKey]);

  useEffect(() => {
    let isMounted = true;
    const loadUserRole = async () => {
      try {
        const response = await fetch("/api/employees/me", {
          cache: "no-store"
        });
        if (!isMounted) {
          return;
        }
        if (response.ok) {
          const payload = (await response.json()) as {
            data?: { role?: string | null };
          };
          setCanEditOrders(payload.data?.role === "owner");
          return;
        }
        if (response.status === 404) {
          setCanEditOrders(true);
          return;
        }
        setCanEditOrders(false);
      } catch {
        if (isMounted) {
          setCanEditOrders(false);
        }
      }
    };

    loadUserRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedJobs = jobs;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-background/80 py-4 backdrop-blur-md">
        <OrdersFiltersBar
          filters={filters}
          locale={locale}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onClear={() => {
            setFilters({
              query: "",
              status: "all",
              fromDate: null,
              toDate: null,
              unassigned: false
            });
            setPage(1);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrdersPagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() =>
            setPage((prev) =>
              prev * PAGE_SIZE >= total ? prev : prev + 1
            )
          }
        />
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/95 p-1 text-xs">
          <span className="px-2 text-[11px] font-semibold text-slate-400">
            {t("list.viewLabel")}
          </span>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "table"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100/80"
            }`}
          >
            {t("list.viewTable")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "kanban"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100/80"
            }`}
          >
            {t("list.viewKanban")}
          </button>
        </div>
      </div>
      {viewMode === "kanban" ? (
        <OrdersKanban
          orders={sortedJobs}
          locale={locale}
          isLoading={isLoading}
          canEdit={canEditOrders}
          onPersistStatus={persistStatusChange}
          onView={(job) => router.push(`/jobs/${job.id}`)}
          onEdit={(job) => router.push(`/jobs/${job.id}/edit`)}
          onChangeStatus={(job) => {
            setStatusDialogPreset(null);
            setStatusDialogJob(job);
            setStatusDialogChangedAt(toDateTimeLocalValue(new Date()));
            setStatusDialogNote("");
          }}
          onOpenMap={(job) => router.push(`/jobs/${job.id}`)}
          onCancel={(job) => {
            setStatusDialogPreset("canceled");
            setStatusDialogJob(job);
            setStatusDialogChangedAt(toDateTimeLocalValue(new Date()));
            setStatusDialogNote("");
          }}
        />
      ) : (
        <OrdersTable
          orders={sortedJobs}
          locale={locale}
          emptyMessage={t("filters.empty")}
          isLoading={isLoading}
          canEdit={canEditOrders}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === sortKey) {
              setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
            } else {
              setSortKey(key);
              setSortDir("asc");
            }
            setPage(1);
          }}
          onStatusAction={(job) => {
            setStatusDialogPreset(null);
            setStatusDialogJob(job);
            setStatusDialogChangedAt(toDateTimeLocalValue(new Date()));
            setStatusDialogNote("");
          }}
          onHistoryAction={(job) => {
            router.push(`/jobs/${job.id}#history`);
          }}
        />
      )}
      <StatusUpdateDialog
        open={Boolean(statusDialogJob)}
        status={statusDialogPreset ?? statusDialogJob?.status ?? "scheduled"}
        changedAt={statusDialogChangedAt}
        note={statusDialogNote}
        onCancel={() => {
          setStatusDialogJob(null);
          setStatusDialogPreset(null);
        }}
        onSave={async (nextStatus, changedAt, note) => {
          if (!statusDialogJob || !changedAt || isSavingStatus) {
            return;
          }
          setIsSavingStatus(true);
          try {
            await persistStatusChange(
              statusDialogJob.id,
              nextStatus,
              new Date(changedAt).toISOString(),
              note
            );
            setStatusDialogJob(null);
          } catch {
            // Mantem comportamento atual (sem toast) para a lista.
          }
          setIsSavingStatus(false);
        }}
      />
    </div>
  );
}
