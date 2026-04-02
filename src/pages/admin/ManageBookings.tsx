import { useState, useMemo } from 'react';
import {
  Search,
  Loader2,
  Calendar,
  User,
  Hotel,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ArrowLeft,
  Receipt,
  History,
  MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/store/currencyStore';
import { useAllBookings, useUpdateBookingStatus } from '@/hooks/useApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Booking } from '@/types';
import { cn } from '@/lib/utils';

interface BookingExtended extends Booking {
  firstName?: string;
}

export default function ManageBookings() {
  const { format: formatPrice } = useCurrencyStore();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookingFull, setSelectedBookingFull] = useState<BookingExtended | null>(null);

  const { data: response, isLoading, refetch } = useAllBookings({
    search: search.length >= 3 ? search : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const statusMut = useUpdateBookingStatus();
  const bookings = useMemo(() => (response?.data as BookingExtended[]) || [], [response]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedBookingFull) return;
    try {
      await statusMut.mutateAsync({
        id: selectedBookingFull.id,
        status: newStatus as "pending" | "confirmed" | "cancelled" | "completed"
      });
      toast({
        title: "Success",
        description: `Booking updated to ${newStatus}.`,
      });
      refetch();
      setSelectedBookingFull(prev => prev ? {
        ...prev,
        status: newStatus as "pending" | "confirmed" | "cancelled" | "completed"
      } : null);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const openDetail = (b: BookingExtended) => {
    setSelectedBookingFull(b);
    setView('detail');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize font-sans">{status}</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize font-sans">{status}</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize font-sans">{status}</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize font-sans">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid'
      ? <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none px-2 py-0.5 rounded text-[10px] font-bold uppercase">Paid</Badge>
      : <Badge variant="outline" className="text-muted-foreground border-border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Unpaid</Badge>;
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Manage Bookings</h1>
              <p className="text-muted-foreground">Monitor and manage all guest reservations.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guest or property..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize h-9 font-medium"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Hotel / Room</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Guest</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Dates</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading bookings...</p>
                      </td>
                    </tr>
                  ) : bookings.length > 0 ? bookings.map((b: BookingExtended) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => openDetail(b)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded bg-muted flex items-center justify-center border shrink-0">
                            <Hotel className="h-4.5 w-4.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{b.hotelName}</p>
                            <p className="text-xs text-muted-foreground">{b.roomType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {b.firstName?.[0] || 'G'}
                          </div>
                          <span className="font-medium">{b.firstName || 'Guest'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">{format(new Date(b.checkIn), 'MMM d')} - {format(new Date(b.checkOut), 'MMM d, yyyy')}</p>
                          <p className="text-[11px] text-muted-foreground uppercase">{b.guests} Guests</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="space-y-1">
                          <p className="font-bold">{formatPrice(b.totalPrice)}</p>
                          {getPaymentBadge(b.paymentStatus)}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
          <Button variant="ghost" onClick={() => setView('list')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to all bookings
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-bold tracking-tight">Booking Details</h2>
              <p className="text-sm text-muted-foreground">
                Reservation: {selectedBookingFull?.hotelName} - {selectedBookingFull?.roomType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{selectedBookingFull?.hotelName}</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {selectedBookingFull?.roomType}
                    </p>
                  </div>
                  {getStatusBadge(selectedBookingFull?.status || '')}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Check-in</p>
                    <p className="text-sm font-semibold">{selectedBookingFull && format(new Date(selectedBookingFull.checkIn), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Check-out</p>
                    <p className="text-sm font-semibold">{selectedBookingFull && format(new Date(selectedBookingFull.checkOut), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Guests</p>
                    <p className="text-sm font-semibold">{selectedBookingFull?.guests} People</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</p>
                    <p className="text-sm font-bold text-primary">{selectedBookingFull && formatPrice(selectedBookingFull.totalPrice)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleStatusUpdate('confirmed')}
                      disabled={selectedBookingFull?.status === 'confirmed' || statusMut.isPending}
                      variant="outline"
                      className="border-green-200 hover:bg-green-50 hover:text-green-700"
                    >
                      Confirm
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={selectedBookingFull?.status !== 'confirmed' || statusMut.isPending}
                      variant="outline"
                    >
                      Mark Completed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={selectedBookingFull?.status === 'cancelled' || statusMut.isPending}
                      className="border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Customer Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {selectedBookingFull?.firstName?.[0] || 'G'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedBookingFull?.firstName || 'Guest'}</p>
                      <p className="text-xs text-muted-foreground">ID: {selectedBookingFull?.userId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="pt-4 space-y-4 border-t">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment Status</p>
                      {getPaymentBadge(selectedBookingFull?.paymentStatus || '')}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Booking Created</p>
                      <p className="text-xs font-medium">{selectedBookingFull && format(new Date(selectedBookingFull.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
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
