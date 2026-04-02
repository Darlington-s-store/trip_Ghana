import { useState } from 'react';
import {
  Search, Trash2, Loader2, Map, ArrowLeft, Calendar,
  User as UserIcon, DollarSign, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllTrips, useDeleteTrip, useApproveTrip, useRejectTrip } from '@/hooks/useApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/types';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/store/currencyStore';

interface TripExtended extends Trip {
  first_name?: string;
  last_name?: string;
  email?: string;
  rejection_reason?: string;
  destination?: string;
}

export default function ManageTrips() {
  const { toast } = useToast();
  const { format: formatPrice } = useCurrencyStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<TripExtended | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const { data: tripRes, isLoading, refetch } = useAllTrips({ search });
  const deleteMut = useDeleteTrip();
  const approveMut = useApproveTrip();
  const rejectMut = useRejectTrip();
  const trips = (tripRes?.data || []) as TripExtended[];

  const filteredTrips = trips.filter(t =>
    (t.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.first_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const openDetail = (t: TripExtended) => { setSelectedTrip(t); setView('detail'); };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Trip deleted.' });
      setDeleteId(null);
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    if (!selectedTrip) return;
    try {
      await approveMut.mutateAsync(selectedTrip.id);
      toast({ title: 'Trip approved.' });
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selectedTrip) return;
    try {
      await rejectMut.mutateAsync({ id: selectedTrip.id, reason: rejectionReason });
      toast({ title: 'Trip rejected.' });
      setRejectId(null);
      setRejectionReason('');
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-warning/10 text-warning';
      case 'approved': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-info/10 text-info';
    }
  };

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Trip Plans</h1>
              <p className="text-muted-foreground">Review and manage user trip itineraries.</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by trip, user or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Trip</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">User</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Dates</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Budget</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Status</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></td></tr>
                  ) : filteredTrips.length > 0 ? filteredTrips.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => openDetail(t)}>
                      <td className="p-4">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.destination || (Array.isArray(t.destinations) ? t.destinations.join(', ') : '—')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{t.first_name} {t.last_name}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 font-semibold text-sm">{formatPrice(t.budget)}</td>
                      <td className="p-4">
                        <Badge className={cn("text-[10px] capitalize border-none font-medium", statusColor(t.status))}>
                          {t.status?.replace('_', ' ') || 'draft'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No trip plans found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 max-w-4xl">
          <Button variant="ghost" onClick={() => setView('list')} className="gap-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to all trips
          </Button>

          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">{selectedTrip?.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={cn("capitalize border-none text-xs", statusColor(selectedTrip?.status || ''))}>
                  {selectedTrip?.status?.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">by {selectedTrip?.first_name} {selectedTrip?.last_name}</span>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteId(selectedTrip!.id)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>

          {/* Approval Banner */}
          {selectedTrip?.status === 'pending_approval' && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <h4 className="font-semibold text-foreground">Awaiting Approval</h4>
                  <p className="text-sm text-muted-foreground">Review and approve or reject this trip plan.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={approveMut.isPending} className="bg-success hover:bg-success/90 text-success-foreground gap-1.5">
                  {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </Button>
                <Button variant="outline" onClick={() => setRejectId(selectedTrip.id)} className="gap-1.5">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}

          {selectedTrip?.status === 'rejected' && selectedTrip?.rejection_reason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">Rejected</h4>
                <p className="text-sm text-muted-foreground">"{selectedTrip.rejection_reason}"</p>
              </div>
            </div>
          )}

          {/* Trip Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" /> Trip Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">{selectedTrip?.destination || (Array.isArray(selectedTrip?.destinations) ? selectedTrip.destinations.join(', ') : '—')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{selectedTrip?.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{selectedTrip?.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : '—'}</span>
                </div>
                {selectedTrip?.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{selectedTrip.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Budget
              </h3>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total Budget</span>
                <span className="text-xl font-bold text-success">{formatPrice(selectedTrip?.budget || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{selectedTrip?.currency || 'GHS'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" /> User Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selectedTrip?.first_name} {selectedTrip?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{selectedTrip?.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Activities
              </h3>
              {Array.isArray(selectedTrip?.activities) && (selectedTrip.activities as string[]).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(selectedTrip.activities as string[]).map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activities listed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip?</DialogTitle>
            <DialogDescription>This will permanently remove this trip plan.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Trip</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this trip plan.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMut.isPending || !rejectionReason}>
              {rejectMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
