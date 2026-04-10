import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookMarked,
  Bot,
  Compass,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Discover", path: "/discover", icon: Compass },
  { label: "Watchlist", path: "/watchlist", icon: BookMarked },
  { label: "Bot Commands", path: "/bot", icon: Bot },
  { label: "AI Agent", path: "/ai-agent", icon: Sparkles },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { identity, login, clear, isLoginSuccess } = useInternetIdentity();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = !!identity;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      try {
        await login();
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          e.message === "User is already authenticated"
        ) {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col dark">
      {/* Top Header */}
      <header className="bg-card border-b border-border shadow-subtle sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            data-ocid="nav-logo"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                M
              </span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Mihon<span className="text-primary">Bot</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden lg:flex items-center gap-1"
            data-ocid="nav-desktop"
          >
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const active =
                pathname === path ||
                (path !== "/" && pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: auth + mobile toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex text-muted-foreground hover:text-foreground"
              data-ocid="nav-notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant={isAuthenticated ? "ghost" : "default"}
              size="sm"
              onClick={handleAuth}
              disabled={!isLoginSuccess && !isAuthenticated}
              className="hidden lg:flex gap-1.5"
              data-ocid="nav-auth-btn"
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4" /> Logout
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Login
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
              data-ocid="nav-mobile-toggle"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {sidebarOpen && (
          <div
            className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1"
            data-ocid="nav-mobile"
          >
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const active =
                pathname === path ||
                (path !== "/" && pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-1">
              <Button
                variant={isAuthenticated ? "ghost" : "default"}
                size="sm"
                onClick={handleAuth}
                disabled={!isLoginSuccess && !isAuthenticated}
                className="w-full justify-center gap-1.5"
                data-ocid="nav-mobile-auth-btn"
              >
                {isAuthenticated ? (
                  <>
                    <LogOut className="w-4 h-4" /> Logout
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Login with Internet Identity
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background min-h-0">{children}</main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">M</span>
            </div>
            <span className="text-muted-foreground text-xs">
              MihonBot — Track manga, manhwa &amp; comics
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="text-xs bg-accent/10 text-accent border-accent/20"
            >
              WhatsApp Connected
            </Badge>
            <span className="text-muted-foreground text-xs">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.hostname : "",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
