"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <line x1="2" x2="22" y1="2" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
          <path d="M5 12.86a10 10 0 0 1 5.17-2.93" />
          <line x1="12" x2="12.01" y1="20" y2="20" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        Sem conexão
      </h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 inline-flex h-10 items-center rounded-lg bg-green-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        Tentar novamente
      </button>
    </div>
  );
}
