import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Siren, Hospital, Ambulance, FileText, Bot, User, Bell, Map,
  Menu, X, LogOut, HeartPulse, Moon, Sun, Settings,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import type { Role } from "@/services/api";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard }

const byRole: Record<Role, NavItem[]> = {
  patient: [
    { to: "/dashboard/patient", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/patient", label: "Emergency", icon: Siren },
    { to: "/dashboard/map", label: "Nearby Hospitals", icon: Hospital },
    { to: "/dashboard/map", label: "Ambulance", icon: Ambulance },
    { to: "/dashboard/profile", label: "Medical History", icon: FileText },
    { to: "/dashboard/chatbot", label: "AI Assistant", icon: Bot },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  hospital: [
    { to: "/dashboard/hospital", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/hospital", label: "Requests", icon: Siren },
    { to: "/dashboard/hospital", label: "Doctors", icon: Stethoscope },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  doctor: [
    { to: "/dashboard/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/doctor", label: "Patients", icon: User },
    { to: "/dashboard/chatbot", label: "Chat", icon: Bot },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  driver: [
    { to: "/dashboard/driver", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/map", label: "Route Map", icon: Map },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/dashboard/admin", label: "Analytics", icon: LayoutDashboard },
    { to: "/dashboard/admin", label: "Users", icon: User },
    { to: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
};

// Fix: import Stethoscope
import { Stethoscope } from "lucide-react";

const shared: NavItem[] = [
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (!user) return null;

  const items = [...byRole[user.role], ...shared];
  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shadow-soft">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">Emergency</div>
              <div className="text-xs text-primary font-semibold">Healthcare AI</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-3 py-2 font-semibold">
            {user.role}
          </div>
          {items.map((item, i) => {
            const active = pathname === item.to;
            return (
              <Link
                key={`${item.to}-${i}`}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-accent/50">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={toggle} className="gap-1">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              Theme
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => { logout(); navigate({ to: "/" }); }}
            >
              <LogOut className="w-3.5 h-3.5" /> Exit
            </Button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="lg:hidden">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1" />
          <Link to="/dashboard/notifications">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
            </Button>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
