import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Map as MapIcon, BarChart3, GitBranch, Layers, FileText, Sun, Moon } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "District Map", icon: MapIcon },
  { to: "/schemes", label: "Scheme Comparison", icon: BarChart3 },
  { to: "/rules", label: "Association Rules", icon: GitBranch },
  { to: "/clusters", label: "District Clusters", icon: Layers },
  { to: "/report", label: "Coverage Report", icon: FileText },
] as const;

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("kw-theme") === "dark";
    setDark(saved);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kw-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark] as const;
}

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [dark, setDark] = useDarkMode();
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Govt. of Karnataka</div>
          <h1 className="text-lg font-semibold leading-tight mt-1">Welfare Scheme Analyzer</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                         : "hover:bg-sidebar-accent text-sidebar-foreground/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-sidebar-foreground/50 border-t border-sidebar-border">
          Final Year CSE Project · 2025
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden relative">
        <button
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode"
          className="absolute top-4 right-6 z-10 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {dark ? "Light" : "Dark"}
        </button>
        <Outlet />
      </main>
    </div>
  );
}
