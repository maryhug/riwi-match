import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FloatingNav } from "@/components/app/FloatingNav";
import { Topbar } from "@/components/app/Topbar";
import { AppProvider, useApp } from "@/lib/app-context";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppProvider>
      <LayoutInner />
    </AppProvider>
  );
}

function LayoutInner() {
  const { navPosition } = useApp();
  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col transition-[padding] duration-500",
        navPosition === "top" && "pt-20",
        navPosition === "bottom" && "pb-20",
        navPosition === "left" && "pl-24",
        navPosition === "right" && "pr-24",
      )}
    >
      <Topbar />
      <main className="flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
      <FloatingNav />
      <Toaster richColors position="top-right" />
    </div>
  );
}
