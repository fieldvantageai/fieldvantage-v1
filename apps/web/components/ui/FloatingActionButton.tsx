"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

import { useClientT } from "@/lib/i18n/useClientT";

type FloatingActionButtonProps = {
  isVisible: boolean;
};

export default function FloatingActionButton({
  isVisible
}: FloatingActionButtonProps) {
  const { t: tJobs } = useClientT("jobs");
  const { t: tCustomers } = useClientT("customers");
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isVisible && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="md:hidden">
      {isOpen ? (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div
          id={menuId}
          className={`flex flex-col gap-2 transition-all duration-200 ease-out ${
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          <Link
            href="/jobs/new"
            className="flex items-center gap-3 rounded-full border border-brand-200/60 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lg shadow-brand-100 transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {tJobs("actions.new")}
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {tCustomers("new.title")}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label="Acoes rapidas"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition duration-200 ${
              isOpen ? "rotate-45" : "rotate-0"
            }`}
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
