import Sidebar from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-6 py-8">
        <Sidebar />
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
