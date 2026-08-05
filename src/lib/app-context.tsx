import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* eslint-disable react-refresh/only-export-components -- provider and hook are one context API. */

export type NavPosition = "top" | "bottom" | "left" | "right";

interface AppCtx {
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  navPosition: NavPosition;
  setNavPosition: (p: NavPosition) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navPosition, setNavPositionState] = useState<NavPosition>("top");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("navPosition") as NavPosition | null;
      if (saved && ["top", "bottom", "left", "right"].includes(saved)) {
        setNavPositionState(saved);
      }
    } catch {
      // localStorage may be unavailable in private or restricted browsing contexts.
    }
  }, []);

  const setNavPosition = (p: NavPosition) => {
    setNavPositionState(p);
    try {
      localStorage.setItem("navPosition", p);
    } catch {
      // Persisting the preference is best-effort and must not block navigation.
    }
  };

  return (
    <Ctx.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed((c) => !c),
        navPosition,
        setNavPosition,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}
