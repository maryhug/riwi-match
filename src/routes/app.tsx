import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { FloatingNav } from "@/components/app/FloatingNav";
import { Topbar } from "@/components/app/Topbar";
import { FeedbackMagnet } from "@/components/app/FeedbackMagnet";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const topOffset = navPosition === "top";
  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col transition-[padding] duration-500",
        topOffset && "pt-20",
        navPosition === "bottom" && "pb-24",
        navPosition === "left" && "pl-28",
        navPosition === "right" && "pr-28",
      )}
    >
      <Topbar />
      <FeedbackMagnet key={pathname}>
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </FeedbackMagnet>
      <FloatingNav />
      <Toaster richColors position="top-right" />
    </div>
  );
}
