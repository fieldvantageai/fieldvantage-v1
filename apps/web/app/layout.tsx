import type { Metadata, Viewport } from "next";

import LocalePrompt from "@/components/layout/LocalePrompt";
import { getServerLocale } from "@/lib/i18n/localeServer";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldVantage",
  description: "Operacoes de campo com foco em produtividade."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
        <LocalePrompt />
        {children}
      </body>
    </html>
  );
}
