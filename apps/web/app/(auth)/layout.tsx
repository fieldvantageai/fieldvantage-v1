export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
