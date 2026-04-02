import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { CurrencyToggle } from '@/components/features/CurrencyToggle';
import { NotificationBell } from '@/components/features/NotificationBell';

const publicLinks = [
  { label: 'Destinations', href: '/destinations' },
  { label: 'Hotels', href: '/hotels' },
  { label: 'Attractions', href: '/attractions' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">GhanaTravel</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencyToggle />
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <User className="h-4 w-4" />
                    <span>{user?.firstName}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link to="/dashboard" className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-t-lg">Dashboard</Link>
                    <Link to="/dashboard/bookings" className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted">My Bookings</Link>
                    <Link to="/dashboard/trips" className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted">My Trips</Link>
                    <Link to="/dashboard/profile" className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted">Profile</Link>
                    <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted rounded-b-lg flex items-center gap-2">
                      <LogOut className="h-3 w-3" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md text-foreground hover:bg-muted">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border py-4 animate-fade-in">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-md text-sm font-medium ${
                  isActive(link.href) ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 px-4 flex items-center gap-2">
              <CurrencyToggle />
            </div>
            <div className="mt-4 px-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => { logout(); setIsOpen(false); }}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-primary text-primary-foreground">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
