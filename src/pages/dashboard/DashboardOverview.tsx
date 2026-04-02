import { Link } from 'react-router-dom';
import { BookOpen, Map, TrendingUp, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { StatsCard } from '@/components/features/StatsCard';
import { useCurrencyStore } from '@/store/currencyStore';
import { useMyBookings, useMyTrips } from '@/hooks/useApi';
import { Booking, Trip } from '@/types';

export default function DashboardOverview() {
  const { format } = useCurrencyStore();
  const { data: bookingsRes, isLoading: loadingBookings } = useMyBookings();
  const { data: tripsRes, isLoading: loadingTrips } = useMyTrips();

  const bookings = (bookingsRes?.data || []) as Booking[];
  const trips = (tripsRes?.data || []) as Trip[];

  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
  const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your travel activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Bookings" value={activeBookings} icon={BookOpen} />
        <StatsCard title="Planned Trips" value={trips.length} icon={Map} />
        <StatsCard title="Total Spent" value={format(totalSpent)} icon={TrendingUp} />
        <StatsCard title="Total Bookings" value={bookings.length} icon={Calendar} />
      </div>

      {(loadingBookings || loadingTrips) && (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-semibold text-card-foreground">Recent Bookings</h3>
            <Link to="/dashboard/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">{booking.hotelName}</p>
                  <p className="text-sm text-muted-foreground">{booking.checkIn} → {booking.checkOut}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-semibold text-primary">{format(booking.totalPrice)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-success/10 text-success' : 
                    booking.status === 'pending' ? 'bg-warning/10 text-warning' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
            {!loadingBookings && bookings.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No bookings yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-semibold text-card-foreground">Upcoming Trips</h3>
            <Link to="/dashboard/trips" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {trips.slice(0, 5).map((trip) => (
              <div key={trip.id} className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">{trip.name}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {Array.isArray(trip.destinations) ? trip.destinations.join(', ') : trip.destinations}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{trip.startDate || 'TBD'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    trip.status === 'upcoming' ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground'
                  }`}>
                    {trip.status}
                  </span>
                </div>
              </div>
            ))}
            {!loadingTrips && trips.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No trips planned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

