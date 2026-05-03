import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  BarChart3,
  GitBranch,
  Layers,
  FileText,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "District Map", icon: MapIcon },
  { to: "/schemes", label: "Scheme Comparison", icon: BarChart3 },
  { to: "/rules", label: "Association Rules", icon: GitBranch },
  { to: "/clusters", label: "District Clusters", icon: Layers },
  { to: "/report", label: "Coverage Report", icon: FileText },
] as const;

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">
            Govt. of Karnataka
          </div>
          <h1 className="text-lg font-semibold leading-tight mt-1">
            Welfare Scheme Analyzer
          </h1>
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
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
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
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}