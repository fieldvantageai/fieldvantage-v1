import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function PublicLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            FieldVantage
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register/company">
              <Button>Criar empresa</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
