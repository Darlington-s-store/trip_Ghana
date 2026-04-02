import { useNavigate } from 'react-router-dom';
import { useAdminAnalytics, useAllTrips } from '@/hooks/useApi';
import { Users, Building, BookOpen, MapPin, Landmark, DollarSign, Loader2, TrendingUp, ArrowRight, Map as MapIcon } from 'lucide-react';
import { Trip, AnalyticsData, RecentBookingData, TopDestinationData } from '@/types';
import { StatsCard } from '@/components/features/StatsCard';
import { useCurrencyStore } from '@/store/currencyStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrencyStore();
  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useAdminAnalytics();
  const { data: tripsRes, isLoading: isTripsLoading } = useAllTrips({ status: 'pending_approval' });

  const stats = analyticsRes?.data;
  const pendingTrips = (tripsRes?.data || []) as Trip[];
  const isLoading = isAnalyticsLoading || isTripsLoading;
  const recentBookings = stats?.recentBookings || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform's performance and activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')} className="gap-2">
          View Full Analytics <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title="Users" value={(stats?.totalUsers || 0).toLocaleString()} icon={Users} />
            <StatsCard title="Hotels" value={(stats?.totalHotels || 0).toLocaleString()} icon={Building} />
            <StatsCard title="Bookings" value={(stats?.totalBookings || 0).toLocaleString()} icon={BookOpen} />
            <StatsCard title="Destinations" value={(stats?.totalDestinations || 0).toLocaleString()} icon={MapPin} />
            <StatsCard title="Attractions" value={(stats?.totalAttractions || 0).toLocaleString()} icon={Landmark} />
            <StatsCard title="Revenue" value={formatPrice(stats?.totalRevenue || 0)} icon={DollarSign} />
          </div>

          {/* Pending Trips Alert */}
          {pendingTrips.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                  <MapIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{pendingTrips.length} trips awaiting approval</h3>
                  <p className="text-sm text-muted-foreground">Review and approve or reject pending trip plans.</p>
                </div>
              </div>
              <Button onClick={() => navigate('/admin/trips')} size="sm" className="gap-2">
                Review Trips <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Manage Users', desc: 'Add, edit & remove users', icon: Users, href: '/admin/users', color: 'text-primary bg-primary/10' },
              { label: 'Bookings', desc: 'View all reservations', icon: BookOpen, href: '/admin/bookings', color: 'text-success bg-success/10' },
              { label: 'Trip Plans', desc: 'Review itineraries', icon: MapIcon, href: '/admin/trips', color: 'text-warning bg-warning/10' },
              { label: 'Hotels', desc: 'Manage properties', icon: Building, href: '/admin/hotels', color: 'text-info bg-info/10' },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-md transition-all group"
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-3", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-card-foreground text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </button>
            ))}
          </div>

          {/* Recent Bookings & Top Destinations */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-card rounded-xl border border-border">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-card-foreground">Recent Bookings</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bookings')} className="text-primary text-xs">
                  View All
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-4 text-left font-medium text-muted-foreground text-xs uppercase">Guest</th>
                      <th className="p-4 text-left font-medium text-muted-foreground text-xs uppercase">Hotel</th>
                      <th className="p-4 text-left font-medium text-muted-foreground text-xs uppercase">Check-in</th>
                      <th className="p-4 text-right font-medium text-muted-foreground text-xs uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentBookings.length > 0 ? recentBookings.map((b: RecentBookingData) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{b.first_name || 'Guest'} {b.last_name || ''}</p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] capitalize mt-0.5",
                            b.status === 'confirmed' && "border-success/30 text-success",
                            b.status === 'pending' && "border-warning/30 text-warning"
                          )}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{b.hotel_name}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {formatPrice(typeof b.total_price === 'string' ? parseFloat(b.total_price) : b.total_price)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">No recent bookings.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border">
              <div className="p-5 border-b border-border">
                <h3 className="font-heading font-semibold text-card-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Top Destinations
                </h3>
              </div>
              <div className="divide-y divide-border">
                {stats?.topDestinations && stats.topDestinations.length > 0 ? (
                  stats.topDestinations.slice(0, 5).map((d: TopDestinationData, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.booking_count} bookings</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        {formatPrice(typeof d.revenue === 'string' ? parseFloat(d.revenue) : d.revenue)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No destination data yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
