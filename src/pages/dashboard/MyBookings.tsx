import { useState } from 'react';
import { useCurrencyStore } from '@/store/currencyStore';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMyBookings, useCancelBooking } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Booking } from '@/types';

export default function MyBookings() {
  const { format } = useCurrencyStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: bookingsRes, isLoading } = useMyBookings();
  const cancelMut = useCancelBooking();

  const bookings = (bookingsRes?.data || []) as Booking[];

  const statuses = ['all', 'confirmed', 'pending', 'cancelled', 'completed'];
  const filtered = bookings.filter((b) =>
    (statusFilter === 'all' || b.status === statusFilter) &&
    (b.hotelName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCancel = async () => {
    if (!cancelId) return;
    try { 
      await cancelMut.mutateAsync(cancelId); 
      setCancelId(null); 
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">My Bookings</h2>
          <p className="text-muted-foreground">Manage your hotel reservations.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search bookings..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-lg text-card-foreground">{booking.hotelName}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      booking.status === 'confirmed' ? 'bg-success/10 text-success' :
                      booking.status === 'pending' ? 'bg-warning/10 text-warning' :
                      booking.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-card-foreground">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Room</span>
                      <span className="font-medium">{booking.roomType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Check-in</span>
                      <span className="font-medium">{booking.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Check-out</span>
                      <span className="font-medium">{booking.checkOut}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Guests</span>
                      <span className="font-medium">{booking.guests}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-xl text-primary">{format(booking.totalPrice)}</p>
                  <p className="text-xs text-muted-foreground mb-3 capitalize">{booking.paymentStatus}</p>
                  <div className="flex gap-2 justify-end">
                    {booking.status === 'pending' && (
                      <Button size="sm" variant="destructive" onClick={() => setCancelId(booking.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl border-border">
              No bookings found.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Booking</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to cancel this booking?</p>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMut.isPending}>
              {cancelMut.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Cancel Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

