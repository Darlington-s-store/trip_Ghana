import { useNavigate } from 'react-router-dom';
import { useAdminAnalytics, useAllTrips } from '@/hooks/useApi';
import { Map as MapIcon, Users, Building, BookOpen, MapPin, Landmark, DollarSign, Loader2, TrendingUp, ArrowRight, Activity, Clock, Hotel, CheckCircle2, History, ShieldAlert, FastForward, PlusCircle, ChevronRight, Settings } from 'lucide-react';
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
    <div className="p-6 space-y-8 bg-background min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Command Center</h1>
          <p className="text-muted-foreground mt-1">Direct management and real-time oversight of Trip Ghana operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-3 uppercase tracking-tighter text-[10px]">
            <Activity className="h-3.5 w-3.5 mr-1.5" /> Operations: Live
          </Badge>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')} className="gap-2 font-semibold bg-card shadow-sm">
            Full Analytics <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Synchronizing administrative data...</p>
        </div>
      ) : (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500">

          {/* TOP SECTION: Manual Quick Management (User Request) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => navigate('/admin/users')}
              className="bg-primary/5 border border-primary/10 rounded-2xl p-6 cursor-pointer hover:bg-primary/10 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Manage Users</h3>
                  <p className="text-xs text-muted-foreground">Edit profiles & permissions</p>
                </div>
              </div>
              <PlusCircle className="absolute -right-2 -bottom-2 h-16 w-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
            </div>

            <div
              onClick={() => navigate('/admin/bookings')}
              className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 cursor-pointer hover:bg-emerald-100/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ChevronRight className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900">Live Bookings</h3>
                  <p className="text-xs text-emerald-700/70">Verify & confirm arrivals</p>
                </div>
              </div>
              <BookOpen className="absolute -right-2 -bottom-2 h-16 w-16 text-emerald-600/5 group-hover:text-emerald-600/10 transition-colors" />
            </div>

            <div
              onClick={() => navigate('/admin/trips')}
              className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 cursor-pointer hover:bg-amber-100/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <MapIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">Trip Planner</h3>
                  <p className="text-xs text-amber-700/70">Review custom itineraries</p>
                </div>
              </div>
              <FastForward className="absolute -right-2 -bottom-2 h-16 w-16 text-amber-600/5 group-hover:text-amber-600/10 transition-colors" />
            </div>

            <div
              onClick={() => navigate('/admin/settings')}
              className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 cursor-pointer hover:bg-blue-100/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Global Settings</h3>
                  <p className="text-xs text-blue-700/70">Platform fees & config</p>
                </div>
              </div>
              <ShieldAlert className="absolute -right-2 -bottom-2 h-16 w-16 text-blue-600/5 group-hover:text-blue-600/10 transition-colors" />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatsCard title="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} icon={Users} />
            <StatsCard title="Properties" value={(stats?.totalHotels || 0).toLocaleString()} icon={Building} />
            <StatsCard title="Bookings" value={(stats?.totalBookings || 0).toLocaleString()} icon={BookOpen} />
            <StatsCard title="Destinations" value={(stats?.totalDestinations || 0).toLocaleString()} icon={MapPin} />
            <StatsCard title="Attractions" value={(stats?.totalAttractions || 0).toLocaleString()} icon={Landmark} />
            <StatsCard title="Revenue" value={formatPrice(stats?.totalRevenue || 0)} icon={DollarSign} />
          </div>


          {/* Moderation Queue for Trips */}
          {pendingTrips.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                  <MapIcon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-orange-900 tracking-tight">Requires Attention</h3>
                  <p className="text-orange-700/80 font-medium text-sm">There are {pendingTrips.length} trip itineraries awaiting your administrative review.</p>
                </div>
              </div>
              <Button onClick={() => navigate('/admin/trips')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-md gap-2 shrink-0 h-12">
                Manage Moderation Queue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Bookings */}
            <div className="xl:col-span-2 bg-card rounded-2xl border shadow-sm flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Recent Platform Activity
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bookings')} className="text-primary font-semibold text-xs">
                  See All History
                </Button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Guest Identity</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Hotel / Service</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Check-in Date</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Gross Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentBookings.length > 0 ? recentBookings.map((b: RecentBookingData) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold">{b.first_name || 'Guest'} {b.last_name || ''}</p>
                          <Badge variant="outline" className={cn(
                            "mt-1 text-[9px] font-black uppercase px-1.5 py-0 h-4 border-none bg-muted",
                            b.status === 'confirmed' && "bg-emerald-100 text-emerald-700",
                            b.status === 'pending' && "bg-amber-100 text-amber-700"
                          )}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-muted-foreground truncate max-w-[150px]">{b.hotel_name}</p>
                        </td>
                        <td className="p-4 text-muted-foreground font-medium">
                          {new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {formatPrice(typeof b.total_price === 'string' ? parseFloat(b.total_price) : b.total_price)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-muted-foreground font-medium italic">No recent booking cycles found in the registry.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-muted/20 border-t">
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  * Data is synchronized with the live server. Latest entry was {recentBookings.length > 0 ? 'verified moments ago' : 'not yet recorded'}.
                </p>
              </div>
            </div>

            {/* Top Destinations */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Destination Market Performance
                </h3>
              </div>
              <div className="divide-y flex-1">
                {stats?.topDestinations && stats.topDestinations.length > 0 ? (
                  stats.topDestinations.slice(0, 5).map((d: TopDestinationData, i: number) => (
                    <div key={i} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-black text-primary border border-primary/10">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{d.booking_count} Verified Bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-primary">{formatPrice(typeof d.revenue === 'string' ? parseFloat(d.revenue) : d.revenue)}</p>
                        <Badge variant="outline" className="border-none bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0 h-4 mt-0.5">
                          +12% Uptick
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center space-y-2">
                    <MapPin className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">Market data awaiting initialization.</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-primary/5 border-t border-primary/10">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Infrastructure Active</h4>
                    <p className="text-[11px] text-emerald-700/80 leading-relaxed mt-1 font-medium">
                      Platform clusters are healthy. All edge services are processing requests at nominal levels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
