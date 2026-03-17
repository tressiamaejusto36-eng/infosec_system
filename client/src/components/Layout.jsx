import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  Hotel, LogOut, LayoutDashboard, BedDouble,
  CalendarCheck, User, ShieldCheck, Menu, X,
  BarChart3, Package, Users
} from "lucide-react";
import { useState } from "react";

const customerNavLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rooms", label: "Rooms", icon: BedDouble },
  { to: "/my-reservations", label: "My Reservations", icon: CalendarCheck },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNavLinks = [
  { to: "/admin?tab=analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin?tab=rooms", label: "Room Management", icon: BedDouble },
  { to: "/admin?tab=reservations", label: "Reservations", icon: CalendarCheck },
  { to: "/admin?tab=inventory", label: "Inventory", icon: Package },
  { to: "/admin?tab=users", label: "User Management", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = isAdmin ? adminNavLinks : customerNavLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 glass border-r border-white/8 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
          <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center shadow-lg">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">SecureStay</h1>
            <p className="text-white/40 text-xs mt-0.5">Hotel System</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon }, index) => {
            // For admin navigation, handle special routing
            let isActive = false;
            
            if (isAdmin && to.startsWith("/admin")) {
              // Admin panel navigation - check if we're on admin page
              isActive = location.pathname === "/admin" && (
                to === "/admin?tab=analytics" || 
                location.search.includes(to.split('?')[1]) ||
                (to === "/admin?tab=analytics" && !location.search)
              );
            } else {
              isActive = location.pathname === to || location.pathname.startsWith(to + "/");
            }
            
            return (
              <Link
                key={`${to}-${index}`}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isAdmin && to.startsWith("/admin") && (
                  <span className="ml-auto text-xs bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/8 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg glass">
            <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/40 text-xs truncate">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-white/8 glass lg:hidden">
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">SecureStay</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
