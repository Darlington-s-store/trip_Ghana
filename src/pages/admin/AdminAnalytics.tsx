import { Loader2, TrendingUp, BarChart3, PieChart, Info, Calendar, DollarSign, Activity } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import { useAdminAnalytics } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnalyticsData, MonthlyRevenueData, TopDestinationData } from '@/types';

export default function AdminAnalytics() {
  const { format } = useCurrencyStore();
  const { data, isLoading } = useAdminAnalytics();

  const stats = data?.data as AnalyticsData | undefined;
  const monthly = stats?.monthlyRevenue || [];
  const topDest = stats?.topDestinations || [];
  
  const getNum = (val: string | number) => typeof val === 'string' ? parseFloat(val) : val;

  const maxRevenue = Math.max(...monthly.map((m: MonthlyRevenueData) => getNum(m.revenue) || 0), 1);

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview & Analytics</h1>
          <p className="text-muted-foreground">Track your platform's growth, bookings, and revenue performance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border">
          <Calendar className="h-4 w-4" /> 
          Last 12 Months
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading analytics data...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Properties', value: stats?.totalHotels || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Destinations', value: stats?.totalDestinations || 0, icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Attractions', value: stats?.totalAttractions || 0, icon: Info, color: 'text-pink-600', bg: 'bg-pink-50' },
              { label: 'Total Revenue', value: format(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((card, i) => (
              <div key={i} className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", card.bg)}>
                    <card.icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-xl font-bold tracking-tight">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Revenue Performance</h3>
                  <p className="text-sm text-muted-foreground">Monthly growth and booking activity</p>
                </div>
                <Badge variant="outline" className="font-bold border-emerald-200 bg-emerald-50 text-emerald-700">
                  +18.4% Growth
                </Badge>
              </div>
              
              <div className="relative h-64 flex items-end justify-between gap-2 px-2">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50 pb-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-dashed" />
                  ))}
                </div>
                
                {monthly.map((m: MonthlyRevenueData, i: number) => {
                  const h = (getNum(m.revenue) / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 group relative flex flex-col items-center">
                      <div 
                        className="w-full max-w-[24px] bg-primary rounded-t-sm transition-all group-hover:bg-primary/80" 
                        style={{ height: `${Math.max(h, 4)}%` }}
                      >
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-xl rounded px-2 py-1 z-10 pointer-events-none whitespace-nowrap">
                            <p className="text-[10px] font-black">{format(getNum(m.revenue))}</p>
                            <p className="text-[8px] text-muted-foreground uppercase">{m.bookings} Bookings</p>
                         </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-tighter">{m.month}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Top Content</h3>
                  <p className="text-sm text-muted-foreground">Popular destinations by revenue</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {topDest.map((d: TopDestinationData, i: number) => (
                  <div key={i} className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center font-black text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{d.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{d.booking_count} Bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{format(getNum(d.revenue))}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
