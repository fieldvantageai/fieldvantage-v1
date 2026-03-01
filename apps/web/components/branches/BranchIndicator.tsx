"use client";

import { useEffect, useState } from "react";

type BranchInfo = {
  id: string;
  name: string;
};

const BranchIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export default function BranchIndicator() {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const meRes = await fetch("/api/employees/me", { cache: "no-store" });
        if (!meRes.ok) return;
        const mePayload = (await meRes.json()) as {
          data?: { branch_ids?: string[]; branch_id?: string | null; is_hq?: boolean };
        };

        const isHq = mePayload.data?.is_hq ?? false;
        if (isHq) return; // HQ não exibe indicador

        // Coleta branch_ids (novo) com fallback para branch_id legado
        const rawIds: string[] = mePayload.data?.branch_ids ?? [];
        const effectiveIds =
          rawIds.length > 0
            ? rawIds
            : mePayload.data?.branch_id
              ? [mePayload.data.branch_id]
              : [];

        if (effectiveIds.length === 0) return;

        // Busca detalhes de cada filial (em paralelo)
        const results = await Promise.all(
          effectiveIds.map((bid) =>
            fetch(`/api/branches/${bid}`, { cache: "no-store" })
              .then((r) => (r.ok ? r.json() : null))
              .then((payload: { data?: { id: string; name: string } } | null) =>
                payload?.data ?? null
              )
              .catch(() => null)
          )
        );

        if (isMounted) {
          setBranches(results.filter((b): b is BranchInfo => b !== null));
        }
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

  const badgeClass =
    "hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 sm:inline-flex dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-400";

  if (branches.length === 1) {
    return (
      <span className={badgeClass}>
        <BranchIcon />
        {branches[0].name}
      </span>
    );
  }

  // Múltiplas filiais: mostra contagem com tooltip de nomes
  const names = branches.map((b) => b.name).join(", ");
  return (
    <span className={badgeClass} title={names}>
      <BranchIcon />
      {branches.length} filiais
    </span>
  );
}
