import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
  BarChart3,
  Wifi,
  WifiOff,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/customers", label: "Customers", icon: Users },
  // { href: "/reports", label: "Reports", icon: BarChart3 },
];

function OnlineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-sidebar-border",
        online
          ? "text-emerald-400"
          : "text-red-400"
      )}
      title={online ? "Connected — all data is live" : "Offline — no connection"}
    >
      {online ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      <span className="hidden lg:inline">{online ? "Live" : "Offline"}</span>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <Package className="h-5 w-5 text-amber-400" />
          <span className="font-bold text-base tracking-tight">Stock Manager</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border space-y-2.5">
          <OnlineIndicator />
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sidebar-accent/40 text-sidebar-foreground">
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate leading-none mt-0.5">@{user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-sidebar-accent rounded text-sidebar-foreground/75 hover:text-red-400 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-bold text-sm truncate">Stock Manager</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <OnlineIndicator />
            <div className="flex flex-col text-right leading-tight max-w-[80px]">
              <span className="text-[10px] font-semibold truncate">{user?.name}</span>
              <span className="text-[8px] text-sidebar-foreground/60 truncate">@{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="p-1 hover:bg-sidebar-accent rounded text-sidebar-foreground/75 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 h-14">
          <div className="flex overflow-x-auto scrollbar-none">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex-1 min-w-[40px] flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors",
                    active ? "text-amber-400" : "text-sidebar-foreground/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
