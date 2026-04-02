import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building, BookOpen, MapPin, Landmark,
  Settings, Menu, LogOut, ChevronRight, BarChart3, Map, Terminal,
  User, Bell, Search, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Hotels', href: '/admin/hotels', icon: Building },
  { label: 'Bookings', href: '/admin/bookings', icon: BookOpen },
  { label: 'Trip Plans', href: '/admin/trips', icon: Map },
  { label: 'Destinations', href: '/admin/destinations', icon: MapPin },
  { label: 'Attractions', href: '/admin/attractions', icon: Landmark },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'API Strategy', href: '/admin/api-strategy', icon: Terminal },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-heading font-bold text-sm text-sidebar-foreground">Trip Ghana</span>
                <span className="block text-xs text-sidebar-foreground/50">Admin Panel</span>
              </div>
            )}
          </Link>
        </div>

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

        <div className="p-3 mt-auto">
          {!collapsed && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
               <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary uppercase font-bold text-[10px]">
                    {user?.firstName?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans [scrollbar-gutter:stable]">
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-md hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <h1 className="font-heading font-semibold text-foreground">
              {sidebarLinks.find(l => isActive(l.href))?.label || 'Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search command..." 
                className="bg-transparent border-none text-xs focus:ring-0 w-32 placeholder:text-muted-foreground"
              />
              <span className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground">⌘K</span>
            </div>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </Button>

            <div className="h-6 w-[1px] bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-border hover:border-primary/50 transition-colors">
                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user?.firstName?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open('/', '_blank')} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>View Public Site</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-muted/5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
