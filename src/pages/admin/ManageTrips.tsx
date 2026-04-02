import { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Loader2, 
  Map,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Globe,
  DollarSign,
  Info,
  Car,
  Palmtree,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllTrips, useDeleteTrip, useApproveTrip, useRejectTrip } from '@/hooks/useApi';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/types';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/store/currencyStore';

interface TripDayAttraction {
  id: string;
  attraction_id: string;
  attraction_name: string;
  order: number;
}

interface TripDay {
  id: string;
  day_number: number;
  date: string | null;
  attractions: TripDayAttraction[];
}

interface TripExtended extends Trip {
  first_name?: string;
  last_name?: string;
  email?: string;
  rejection_reason?: string;
  transportType?: string;
  trip_days?: TripDay[];
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

  const openDetail = (t: TripExtended) => {
    setSelectedTrip(t);
    setView('detail');
  };

  const handleDelete = async () => { 
    if (!deleteId) return; 
    try { 
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Plan Removed', description: 'The itinerary has been permanently deleted from the system.' });
      setDeleteId(null);
      setView('list');
      refetch();
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } 
  };

  const handleApprove = async () => {
    if (!selectedTrip) return;
    try {
      await approveMut.mutateAsync(selectedTrip.id);
      setView('list');
      refetch();
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selectedTrip) return;
    try {
      await rejectMut.mutateAsync({ id: selectedTrip.id, reason: rejectionReason });
      setRejectId(null);
      setRejectionReason('');
      setView('list');
      refetch();
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full max-w-full">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fleet Itineraries</h1>
              <p className="text-muted-foreground text-sm">Oversee all custom trip plans created by the system members.</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Lookup by trip name, participant or contact..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 bg-muted/20" 
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Itinerary</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Owner</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Timeline</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Budget</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Phase</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="font-medium">Loading fleet data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTrips.length > 0 ? filteredTrips.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => openDetail(t)}>
                      <td className="p-4">
                        <p className="font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {Array.isArray(t.destinations) ? t.destinations.length : t.destination ? 1 : 0} Stopovers
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">
                            {t.first_name} {t.last_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{t.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'Pending'}
                        </div>
                      </td>
                      <td className="p-4 font-black text-sm">
                        {formatPrice(t.budget)}
                      </td>
                      <td className="p-4">
                        <Badge className={cn(
                          "border-none font-black uppercase text-[8px] px-2 py-0.5 rounded-sm tracking-tighter",
                          t.status === 'pending_approval' ? "bg-orange-100 text-orange-700 animate-pulse" :
                          t.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          t.status === 'rejected' ? "bg-red-100 text-red-700" :
                          t.status === 'draft' ? "bg-muted text-muted-foreground" :
                          "bg-blue-50 text-blue-700"
                        )}>
                          {t.status || 'draft'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} 
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-muted-foreground font-medium">
                        No itineraries found in the fleet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{selectedTrip?.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                    selectedTrip?.status === 'approved' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                    selectedTrip?.status === 'rejected' ? "border-red-200 text-red-700 bg-red-50" :
                    "border-orange-200 text-orange-700 bg-orange-50"
                  )}>
                    Phase: {selectedTrip?.status}
                  </Badge>
                  <div className="text-muted-foreground text-sm flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> 
                    Participant: <span className="font-bold text-foreground">{selectedTrip?.first_name} {selectedTrip?.last_name}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(selectedTrip!.id)} className="gap-2 font-bold px-4 h-9 shadow-sm">
                <Trash2 className="h-4 w-4" /> Delete Records
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Promotion / Moderation Area */}
              {selectedTrip?.status === 'pending_approval' && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in fade-in zoom-in duration-300">
                  <div className="flex gap-4 text-left">
                    <div className="bg-orange-100 p-3 rounded-full h-fit">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-orange-900">Itinerary Pending Review</h4>
                      <p className="text-orange-700 text-sm max-w-md">
                        This custom plan requires coordinator validation before it can be finalized and paid for by the user.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                      onClick={handleApprove} 
                      className="flex-1 md:flex-none gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl"
                      disabled={approveMut.isPending}
                    >
                      {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setRejectId(selectedTrip.id)}
                      className="flex-1 md:flex-none gap-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-bold h-11 px-6 rounded-xl"
                      disabled={rejectMut.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedTrip?.status === 'rejected' && selectedTrip?.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-4 shadow-sm text-left animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-red-100 p-3 rounded-full h-fit">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-red-900">Reviewer Feedback</h4>
                    <p className="text-red-700 text-sm italic">
                      "{selectedTrip?.rejection_reason}"
                    </p>
                  </div>
                </div>
              )}

              {/* Itinerary Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Map className="h-4 w-4" /> Path & Transit
                  </h3>
                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                      <Car className="h-5 w-5 text-primary mt-1" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Transport Strategy</p>
                        <p className="font-bold text-foreground">{selectedTrip?.transportType || 'Private Shuttle'}</p>
                        <p className="text-xs text-muted-foreground">Automated routing between destinations enabled.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                      <Palmtree className="h-5 w-5 text-primary mt-1" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Stopover Count</p>
                        <p className="font-bold text-foreground">{Array.isArray(selectedTrip?.destinations) ? selectedTrip.destinations.length : 1} Regional Destinations</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Financial Allocation
                  </h3>
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Estimated Total</span>
                      <span className="text-xl font-black text-emerald-900">{formatPrice(selectedTrip?.budget || 0)}</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                      <Info className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          Budget includes transport fees, destination access, and estimated accommodation costs based on selected tier.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6 text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Planned Itinerary
                </h3>
                
                <div className="space-y-8">
                   {selectedTrip?.trip_days && selectedTrip.trip_days.length > 0 ? selectedTrip.trip_days.map((day, i) => (
                    <div key={day.id} className="relative pl-8 border-l-2 border-muted pb-8 last:pb-0">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-foreground">Day {day.day_number}</h4>
                          <Badge variant="secondary" className="font-bold">{day.date ? new Date(day.date).toLocaleDateString() : 'Planned'}</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {day.attractions?.map((attr: TripDayAttraction) => (
                            <div key={attr.id} className="bg-muted/20 p-4 rounded-xl flex items-center justify-between border group hover:border-primary/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center text-primary font-black shadow-xs">
                                  {attr.order + 1}
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-sm text-foreground">{attr.attraction_name || 'Destination Point'}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Access Point Activity</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center bg-muted/10 rounded-2xl border-2 border-dashed">
                      <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-muted-foreground font-medium">No daily breakdown available for this plan yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg shadow-primary/20 space-y-6 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Admin Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-4">
                    <span className="text-sm opacity-80">Reference ID</span>
                    <span className="font-mono text-xs font-bold">GT-{selectedTrip?.id.split('-')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-4">
                    <span className="text-sm opacity-80">Creation Date</span>
                    <span className="text-sm font-bold">{selectedTrip?.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Verification Code</span>
                    <Badge className="bg-white/20 text-white border-none font-bold">Sent to Registry</Badge>
                  </div>
                </div>
                <div className="pt-4">
                   <p className="text-[10px] leading-relaxed opacity-60">
                    This itinerary is subject to GhanaTrips terms of service. All modifications are logged in the system audit registry.
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">User Information</h3>
                <div className="space-y-4">
                   <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</p>
                    <p className="text-xs font-bold break-all">{selectedTrip?.email}</p>
                  </div>
                   <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-xl">
                    <p className="text-[10px) font-bold text-muted-foreground uppercase">Permissions</p>
                    <p className="text-xs font-bold">Standard Member</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Remove Itinerary Record?</DialogTitle>
            <DialogDescription className="text-muted-foreground py-2">
              This action will permanently delete <span className="font-bold text-foreground">GT-{deleteId?.split('-')[0].toUpperCase()}</span>. 
              This cannot be undone and the user will lose access to this plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="font-bold">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending} className="font-bold px-8">
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Deletion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Reject Itinerary Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a clear reason for the rejection. This feedback will be sent to the user via their preferred notification channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Rejection Reason</label>
              <Textarea 
                placeholder="e.g., Selected attractions are currently closed for maintenance, or transport fees need adjustment..." 
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="min-h-[120px] rounded-xl bg-muted/20 border-muted focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setRejectId(null)} className="font-bold">Back</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={!rejectionReason || rejectMut.isPending} 
              className="font-bold px-8 gap-2"
            >
              {rejectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Send Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
