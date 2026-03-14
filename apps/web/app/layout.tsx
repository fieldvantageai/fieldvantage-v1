import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import LocalePrompt from "@/components/layout/LocalePrompt";
import { getServerLocale } from "@/lib/i18n/localeServer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geklix",
  description: "Operações de campo com foco em produtividade.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Geklix",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
  viewportFit: "cover",
};

/* Anti-FOUC: applies data-theme before React hydrates, preventing a flash
   of the wrong theme on first load. Reads fv_theme from localStorage and
   falls back to the OS prefers-color-scheme. */
const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('fv_theme');var d='light';if(t==='dark')d='dark';else if(t==='light')d='light';else if(window.matchMedia('(prefers-color-scheme: dark)').matches)d='dark';document.documentElement.setAttribute('data-theme',d);}catch(e){}})();`;

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {/* Must be the first script in <head> to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
        <link rel="icon" href="/brand/fav-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <ThemeProvider>
          <LocalePrompt />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
