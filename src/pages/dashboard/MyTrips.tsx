import { useState } from 'react';
import { Plus, MapPin, Calendar, Building, Info, Loader2, Trash2, Edit2, CheckCircle2, ChevronRight, Car, Compass, Camera, Sparkles, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAllTrips, useUpdateTrip, useCreateTrip, useDeleteTrip } from '@/hooks/useApi';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function MyTrips() {
  const { user } = useAuthStore();
  const { data: res, isLoading, refetch } = useAllTrips({ userId: user?.id });
  const updateTrip = useUpdateTrip();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    destination: '',
    total_budget: '',
    transport_details: [] as string[],
    activities: [] as string[],
    itinerary: [] as string[],
    notes: '',
  });

  const [newTransport, setNewTransport] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newItinerary, setNewItinerary] = useState('');

  const trips = (res?.data || []) as Trip[];

  const openAdd = () => {
    setEditingTrip(null);
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      destination: '',
      total_budget: '',
      transport_details: [],
      activities: [],
      itinerary: [],
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      title: trip.title || '',
      startDate: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '',
      endDate: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : '',
      destination: trip.destination || '',
      total_budget: trip.total_budget?.toString() || '',
      transport_details: Array.isArray(trip.transport_details) ? trip.transport_details : [],
      activities: Array.isArray(trip.activities) ? trip.activities : [],
      itinerary: Array.isArray(trip.itinerary) ? trip.itinerary : [],
      notes: trip.notes || '',
    });
    setIsDialogOpen(true);
  };

  const addItem = (type: 'transport_details' | 'activities' | 'itinerary', val: string, setVal: (v: string) => void) => {
    if (!val.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], val.trim()]
    }));
    setVal('');
  };

  const removeItem = (type: 'transport_details' | 'activities' | 'itinerary', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        destination: formData.destination || 'Ghana',
        start_date: formData.startDate,
        end_date: formData.endDate,
        total_budget: parseFloat(formData.total_budget) || 0,
        transport_details: formData.transport_details,
        activities: formData.activities,
        itinerary: formData.itinerary,
        notes: formData.notes,
        currency: 'GHS',
        status: editingTrip ? editingTrip.status : 'planned'
      };

      if (editingTrip) {
        await updateTrip.mutateAsync({ id: editingTrip.id, data: payload });
        toast.success('Itinerary preserved successfully.');
      } else {
        await createTrip.mutateAsync(payload);
        toast.success('New expedition architected!');
      }
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to preserve system data.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Discard this itinerary permanently from the platform?')) return;
    try {
      await deleteTrip.mutateAsync(id);
      toast.success('Expedition discarded.');
      refetch();
    } catch (err) {
      toast.error('Operation failed.');
    }
  };

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-3xl text-foreground tracking-tight">Expedition Architect</h2>
          <p className="text-muted-foreground font-medium">Design and coordinate your manual excursions across Ghana.</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 h-12 gap-2 rounded-2xl">
          <Plus className="h-5 w-5" /> Launch Designer
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-muted-foreground animate-pulse">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="text-sm font-black uppercase tracking-widest">Querying Cloud Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {trips.length > 0 ? trips.map((trip) => (
            <div key={trip.id} className="group flex flex-col h-full rounded-[2rem] border bg-card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 relative">
              <div className="bg-primary/5 p-6 border-b">
                <div className="flex items-center justify-between mb-3">
                   <h3 className="font-black text-xl text-foreground tracking-tight line-clamp-1 uppercase">{trip.title}</h3>
                   <Badge className={cn(
                    "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full border-none shadow-sm",
                    trip.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-primary text-primary-foreground ring-1 ring-primary/20"
                  )}>
                    {trip.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> 
                  <span className="truncate">{trip.destination || 'Uncharted Region'}</span>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border/50">
                   <div className="flex items-center gap-2 text-xs font-black text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {new Date(trip.start_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(trip.end_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                   </div>
                   <div className="font-black text-primary text-sm">
                      GHS {trip.total_budget || 0}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                        <Car className="h-3 w-3 text-primary" /> Logistics Strategy
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                         {(Array.isArray(trip.transport_details) ? trip.transport_details : []).length > 0 ? (trip.transport_details as string[]).map((item, i) => (
                           <Badge key={i} variant="secondary" className="text-[10px] font-bold py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">{item}</Badge>
                         )) : (
                           <span className="text-[10px] italic text-muted-foreground/50">No transport logged</span>
                         )}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary" /> Engagement Portfolio
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                         {(Array.isArray(trip.activities) ? trip.activities : []).length > 0 ? (trip.activities as string[]).map((item, i) => (
                           <Badge key={i} variant="outline" className="text-[10px] font-bold py-0.5 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">{item}</Badge>
                         )) : (
                           <span className="text-[10px] italic text-muted-foreground/50">No activities recorded</span>
                         )}
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-center gap-3 bg-muted/5 group-hover:bg-background transition-colors duration-300">
                 <Button variant="ghost" size="sm" onClick={() => openEdit(trip)} className="flex-1 h-10 font-bold text-xs gap-2 rounded-xl border hover:bg-primary hover:text-white transition-all">
                    <Edit2 className="h-3.5 w-3.5" /> Modify
                 </Button>
                 <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)} className="h-10 font-bold text-xs gap-2 text-destructive hover:bg-destructive hover:text-white rounded-xl border border-destructive/20 shadow-none">
                    <Trash2 className="h-3.5 w-3.5" />
                 </Button>
              </div>
              <Compass className="absolute -right-6 -bottom-6 h-24 w-24 text-primary/5 group-hover:text-primary/10 transition-colors pointer-events-none" />
            </div>
          )) : (
            <div className="col-span-full py-48 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center space-y-6 text-muted-foreground/30 bg-muted/5">
               <Camera className="h-20 w-20 opacity-20" />
               <div className="text-center space-y-1">
                  <p className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground/40">No Manual Expeditions</p>
                  <p className="text-sm font-bold">Launch the architect tool to define your first excursion.</p>
               </div>
               <Button onClick={openAdd} variant="outline" className="mt-4 border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary hover:text-white px-10 h-14 font-black rounded-[2rem] transition-all flex items-center gap-3">
                  <Sparkles className="h-5 w-5" /> Initiate Architecture
               </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogHeader className="p-10 bg-primary relative">
            <DialogTitle className="text-3xl font-black text-primary-foreground flex items-center gap-3 relative z-10 uppercase tracking-tighter">
              {editingTrip ? 'Refine Expedition' : 'New Expedition Architecture'}
            </DialogTitle>
            <p className="text-primary-foreground/70 text-sm font-bold relative z-10 uppercase tracking-widest">Manual Coordination Registry</p>
            <Sparkles className="absolute -right-8 -bottom-8 h-32 w-32 text-primary-foreground/10 rotate-12" />
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-10 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-full">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Excursion Designation</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. KUMASI HERITAGE TOUR" className="h-14 text-xl font-black bg-muted/30 border-none px-6 rounded-[1.5rem] focus-visible:ring-primary shadow-inner placeholder:opacity-30 uppercase" required />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Target Coordinates</Label>
                <Input value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="e.g. Ashanti Region" className="h-12 font-bold bg-muted/30 border-none px-4 rounded-2xl" required />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Projected Budget (GHS)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input type="number" value={formData.total_budget} onChange={e => setFormData({ ...formData, total_budget: e.target.value })} placeholder="0.00" className="h-12 pl-10 font-black bg-muted/30 border-none rounded-2xl shadow-inner" required />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Launch Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="h-12 font-bold bg-muted/30 border-none px-4 rounded-2xl" required />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Return Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="h-12 font-bold bg-muted/30 border-none px-4 rounded-2xl" required />
              </div>

              <div className="space-y-8 col-span-full border-t pt-8 mt-4">
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-[1px] flex-1 bg-muted" />
                   <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-primary whitespace-nowrap">Logistic Modules</h4>
                   <div className="h-[1px] flex-1 bg-muted" />
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Manual Transport Registry</Label>
                   <div className="flex gap-3">
                      <Input value={newTransport} onChange={e => setNewTransport(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('transport_details', newTransport, setNewTransport))} placeholder="Add transport mode..." className="bg-muted/30 h-12 font-bold rounded-xl px-4 border-none" />
                      <Button type="button" onClick={() => addItem('transport_details', newTransport, setNewTransport)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl shrink-0 font-bold"><Plus className="h-5 w-5" /></Button>
                   </div>
                   <div className="flex flex-wrap gap-2 pt-1">
                      {formData.transport_details.map((t, i) => (
                        <Badge key={i} className="pl-4 pr-2 py-2 gap-3 font-bold rounded-[1rem] bg-orange-50 text-orange-700 border border-orange-100 shadow-sm text-xs">
                          {t} <button type="button" onClick={() => removeItem('transport_details', i)} className="hover:bg-red-100 p-1 rounded-full"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Badge>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Manual Activity & Attraction Log</Label>
                   <div className="flex gap-3">
                      <Input value={newActivity} onChange={e => setNewActivity(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('activities', newActivity, setNewActivity))} placeholder="Add activity/attraction..." className="bg-muted/30 h-12 font-bold rounded-xl px-4 border-none" />
                      <Button type="button" onClick={() => addItem('activities', newActivity, setNewActivity)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl shrink-0 font-bold"><Plus className="h-5 w-5" /></Button>
                   </div>
                   <div className="flex flex-wrap gap-2 pt-1">
                      {formData.activities.map((a, i) => (
                        <Badge key={i} className="pl-4 pr-2 py-2 gap-3 font-bold rounded-[1rem] border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm text-xs">
                          {a} <button type="button" onClick={() => removeItem('activities', i)} className="hover:bg-red-100 p-1 rounded-full"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Badge>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Segmented Itinerary Plan</Label>
                   <div className="flex gap-3">
                      <Input value={newItinerary} onChange={e => setNewItinerary(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('itinerary', newItinerary, setNewItinerary))} placeholder="Define itinerary segments..." className="bg-muted/30 h-12 font-bold rounded-xl px-4 border-none" />
                      <Button type="button" onClick={() => addItem('itinerary', newItinerary, setNewItinerary)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl shrink-0 font-bold"><Plus className="h-5 w-5" /></Button>
                   </div>
                   <div className="flex flex-wrap gap-2 pt-1">
                      {formData.itinerary.map((it, i) => (
                        <Badge key={i} variant="outline" className="pl-4 pr-2 py-2 gap-3 font-bold rounded-[1rem] border-blue-100 bg-blue-50 text-blue-700 shadow-sm text-xs">
                          {it} <button type="button" onClick={() => removeItem('itinerary', i)} className="hover:bg-red-100 p-1 rounded-full"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Badge>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Strategy Notes & Logistics Commentary</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Document specific requirements, contact details, or mission objectives..." className="min-h-[140px] bg-muted/30 border-none rounded-[1.5rem] p-6 font-medium focus-visible:ring-primary shadow-inner" />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-10 border-t gap-4 flex-col sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 font-black rounded-2xl border-none uppercase tracking-widest text-xs">
                Decline Changes
              </Button>
              <Button type="submit" className="h-14 font-black px-12 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 flex-1 uppercase tracking-[0.2em] text-[10px] min-w-[240px]" disabled={updateTrip.isPending || createTrip.isPending}>
                {updateTrip.isPending || createTrip.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />}
                Validate & Preserve Itinerary
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
