import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Map, Bell, User, Settings,
  Menu, X, LogOut, MapPin, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

const sidebarLinks = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: BookOpen },
  { label: 'My Trips', href: '/dashboard/trips', icon: Map },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-heading font-bold text-sidebar-foreground">Trip Ghana</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(link.href)
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <link.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
            {isActive(link.href) && !collapsed && <ChevronRight className="h-4 w-4 ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-foreground">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans [scrollbar-gutter:stable]">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-muted">
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-md hover:bg-muted">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-heading font-semibold text-foreground">
              {sidebarLinks.find(l => isActive(l.href))?.label || 'Dashboard'}
            </h1>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">Back to Site</Button>
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
