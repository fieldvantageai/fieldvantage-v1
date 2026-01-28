"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import OrdersFiltersBar from "./OrdersFiltersBar";
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
};

type SortKey = "title" | "customer" | "assigned" | "status" | "startDate";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const normalize = (value: string) => value.trim().toLowerCase();

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
  return {
    filters: {
      query: getParam(params, "q"),
      status: (getParam(params, "status") as FiltersState["status"]) || "all",
      fromDate: parseDate(params.get("from")),
      toDate: parseDate(params.get("to"))
    },
    sortKey: (getParam(params, "sort") as SortKey) || "startDate",
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
    toDate: null
  });
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Array<Job & { assigned_label: string }>>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialogJob, setStatusDialogJob] = useState<
    (Job & { assigned_label: string }) | null
  >(null);
  const [statusDialogChangedAt, setStatusDialogChangedAt] = useState(
    toDateTimeLocalValue(new Date())
  );
  const [isSavingStatus, setIsSavingStatus] = useState(false);

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

  const sortedJobs = useMemo(() => {
    if (sortKey !== "assigned") {
      return jobs;
    }
    return [...jobs].sort((a, b) => {
      const left = normalize(a.assigned_label);
      const right = normalize(b.assigned_label);
      if (left === right) {
        return 0;
      }
      const order = left < right ? -1 : 1;
      return sortDir === "asc" ? order : -order;
    });
  }, [jobs, sortDir, sortKey]);

  return (
    <div className="space-y-4">
      <OrdersFiltersBar
        filters={filters}
        locale={locale}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onClear={() => {
          setFilters({ query: "", status: "all", fromDate: null, toDate: null });
          setPage(1);
        }}
      />
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
      <OrdersTable
        orders={sortedJobs}
        locale={locale}
        emptyMessage={t("filters.empty")}
        isLoading={isLoading}
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
          setStatusDialogJob(job);
          setStatusDialogChangedAt(toDateTimeLocalValue(new Date()));
        }}
      />
      <StatusUpdateDialog
        open={Boolean(statusDialogJob)}
        status={statusDialogJob?.status ?? "scheduled"}
        changedAt={statusDialogChangedAt}
        onCancel={() => setStatusDialogJob(null)}
        onSave={async (nextStatus, changedAt) => {
          if (!statusDialogJob || !changedAt || isSavingStatus) {
            return;
          }
          setIsSavingStatus(true);
          const payload = {
            status: nextStatus,
            changedAt: new Date(changedAt).toISOString()
          };
          const response = await fetch(
            `/api/jobs/${statusDialogJob.id}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            }
          );
          if (response.ok) {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === statusDialogJob.id
                  ? { ...job, status: nextStatus }
                  : job
              )
            );
            setStatusDialogJob(null);
          }
          setIsSavingStatus(false);
        }}
      />
    </div>
  );
}
