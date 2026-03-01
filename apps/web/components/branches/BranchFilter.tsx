"use client";

import { useEffect, useState } from "react";

import type { Branch } from "@/features/branches/service";

type BranchFilterProps = {
  value: string | null;
  onChange: (branchId: string | null) => void;
};

export default function BranchFilter({ value, onChange }: BranchFilterProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/branches", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { data?: Branch[] };
        if (isMounted) setBranches(payload.data ?? []);
      } catch {
        // silent
      } finally {
        if (isMounted) setLoaded(true);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded || branches.length === 0) return null;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text)]"
      aria-label="Filtrar por filial"
    >
      <option value="">Todas as filiais</option>
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>
  );
}
