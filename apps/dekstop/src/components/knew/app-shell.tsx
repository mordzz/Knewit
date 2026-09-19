import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Bookmark,
  Compass,
  Menu,
  Search,
  Settings,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Discover", to: "/", icon: Compass },
  { label: "Markets", to: "/markets", icon: Activity },
  { label: "Watchlist", to: "/watchlist", icon: Bookmark },
  { label: "Portfolio", to: "/portfolio", icon: WalletCards },
  { label: "Activity", to: "/activity", icon: Bell },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-17 items-center px-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main navigation">
          {nav.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${path === to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <Icon className="size-4.5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/sign-in"
            className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <UserRound className="size-4.5" />
            Account
          </Link>
          <button className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <Settings className="size-4.5" />
            Settings
          </button>
        </div>
      </aside>
      <header className="fixed inset-x-0 top-0 z-20 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:left-56 lg:px-7">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="hidden max-w-md lg:block">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm outline-hidden placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="Search markets, assets, or tickers"
              aria-label="Global search"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            {searchOpen ? <X /> : <Search />}
          </Button>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] text-muted-foreground">Available balance · Demo</p>
            <p className="tabular-nums text-sm font-semibold">$12,840.20</p>
          </div>
          <Button size="sm">Add funds</Button>
        </div>
        {searchOpen && (
          <div className="absolute inset-x-3 top-[4.35rem] lg:hidden">
            <input
              autoFocus
              className="h-11 w-full rounded-lg border border-primary bg-secondary px-4 text-sm shadow-xl outline-hidden"
              placeholder="Search markets or assets"
              aria-label="Mobile search"
            />
          </div>
        )}
      </header>
      <main className="min-h-screen pb-24 pt-16 lg:ml-56 lg:pb-8">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-sidebar/98 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        {nav.slice(0, 4).map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-md text-[11px] ${path === to ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
