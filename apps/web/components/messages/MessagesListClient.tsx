"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/Input";
import { useClientT } from "@/lib/i18n/useClientT";

type Employee = {
  id: string;
  user_id?: string | null;
  full_name: string;
  email?: string | null;
};

export default function MessagesListClient() {
  const { t } = useClientT("messages");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [meResponse, employeesResponse, unreadResponse] = await Promise.all([
          fetch("/api/employees/me", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
          fetch("/api/messages/unread-by-sender", { cache: "no-store" })
        ]);
        if (!meResponse.ok || !employeesResponse.ok) {
          return;
        }
        const mePayload = (await meResponse.json()) as {
          data?: { user_id?: string | null };
        };
        const employeesPayload = (await employeesResponse.json()) as {
          data?: Employee[];
        };
        if (isMounted) {
          setMeUserId(mePayload.data?.user_id ?? null);
          setEmployees(employeesPayload.data ?? []);
        }
        if (isMounted && unreadResponse.ok) {
          const unreadPayload = (await unreadResponse.json()) as {
            data?: Record<string, number>;
          };
          setUnreadBySender(unreadPayload.data ?? {});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshUnread = async () => {
      try {
        const response = await fetch("/api/messages/unread-by-sender", {
          cache: "no-store"
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          data?: Record<string, number>;
        };
        if (isMounted) {
          setUnreadBySender(payload.data ?? {});
        }
      } catch {
        if (isMounted) {
          setUnreadBySender({});
        }
      }
    };
    const interval = setInterval(refreshUnread, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    const safeQuery = query.trim().toLowerCase();
    return employees
      .filter((employee) => employee.user_id)
      .filter((employee) => employee.user_id !== meUserId)
      .filter((employee) => {
        if (!safeQuery) {
          return true;
        }
        return (
          employee.full_name.toLowerCase().includes(safeQuery) ||
          (employee.email ?? "").toLowerCase().includes(safeQuery)
        );
      })
      .slice()
      .sort((left, right) => {
        const leftUnread = left.user_id
          ? unreadBySender[left.user_id] ?? 0
          : 0;
        const rightUnread = right.user_id
          ? unreadBySender[right.user_id] ?? 0
          : 0;
        if (leftUnread !== rightUnread) {
          return rightUnread - leftUnread;
        }
        return left.full_name.localeCompare(right.full_name);
      });
  }, [employees, meUserId, query, unreadBySender]);

  return (
    <div className="space-y-4">
      <Input
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-11 rounded-2xl bg-slate-100" />
          <div className="h-11 rounded-2xl bg-slate-100" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((employee) => (
            <Link
              key={employee.id}
              href={`/messages/${employee.user_id}`}
              onClick={() => {
                if (!employee.user_id) {
                  return;
                }
                setUnreadBySender((prev) => ({
                  ...prev,
                  [employee.user_id as string]: 0
                }));
              }}
              className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
            >
              <div>
                <p className="font-semibold text-slate-900">{employee.full_name}</p>
                <p className="text-xs text-slate-500">{employee.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {employee.user_id &&
                (unreadBySender[employee.user_id] ?? 0) > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {unreadBySender[employee.user_id] > 99
                      ? "99+"
                      : unreadBySender[employee.user_id]}
                  </span>
                ) : null}
                <span className="text-xs font-semibold text-slate-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
