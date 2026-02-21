import Link from "next/link";

export default function PublicLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 backdrop-blur-sm dark:border-[var(--border)] dark:bg-[var(--bg2)]/95">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Light logo (hidden in dark mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-light.svg"
              alt="Geklix"
              width={120}
              height={32}
              className="block h-8 w-auto object-contain dark:hidden"
            />
            {/* Dark logo (shown in dark mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-dark.svg"
              alt="Geklix"
              width={120}
              height={32}
              className="hidden h-8 w-auto object-contain dark:block"
            />
          </Link>
          <Link
            href="/entrar"
            className="inline-flex h-8 items-center rounded-lg border border-slate-200/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text)] dark:hover:bg-[var(--surface2)]"
          >
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
