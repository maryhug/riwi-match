import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { AppProvider } from "@/lib/app-context";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </AppProvider>
  );
}
