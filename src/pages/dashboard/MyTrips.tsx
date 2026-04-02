import { useState } from 'react';
import { Plus, MapPin, Calendar, Loader2, Trash2, Edit2, CheckCircle2, Car, Sparkles, DollarSign } from 'lucide-react';
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
      title: '', startDate: '', endDate: '', destination: '',
      total_budget: '', transport_details: [], activities: [],
      itinerary: [], notes: '',
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
    setFormData(prev => ({ ...prev, [type]: [...prev[type], val.trim()] }));
    setVal('');
  };

  const removeItem = (type: 'transport_details' | 'activities' | 'itinerary', index: number) => {
    setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
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
        toast.success('Trip updated successfully.');
      } else {
        await createTrip.mutateAsync(payload);
        toast.success('New trip created!');
      }
      setIsDialogOpen(false);
      refetch();
    } catch {
      toast.error('Failed to save trip.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      await deleteTrip.mutateAsync(id);
      toast.success('Trip deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete trip.');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'approved': return 'bg-success/10 text-success';
      case 'pending_approval': return 'bg-warning/10 text-warning';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">My Trips</h2>
          <p className="text-muted-foreground">Plan and manage your travel itineraries across Ghana.</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Plan a Trip
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all">
              <div className="bg-primary/5 p-5 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-lg text-card-foreground line-clamp-1">{trip.title}</h3>
                  <Badge className={cn("text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border-none", statusColor(trip.status))}>
                    {trip.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{trip.destination || 'Not specified'}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} –{' '}
                    {trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                  </div>
                  <span className="font-semibold text-primary text-sm">GHS {trip.total_budget || 0}</span>
                </div>

                {(Array.isArray(trip.transport_details) && trip.transport_details.length > 0) && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Transport</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(trip.transport_details as string[]).map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0.5">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(Array.isArray(trip.activities) && trip.activities.length > 0) && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Activities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(trip.activities as string[]).map((item, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0.5">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(trip)} className="flex-1 gap-1.5 text-xs">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)} className="text-destructive hover:bg-destructive/10 text-xs gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-xl border-border">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No trips planned yet</p>
          <p className="text-sm text-muted-foreground/70 mb-4">Start planning your next adventure in Ghana.</p>
          <Button onClick={openAdd} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Plan Your First Trip
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">
              {editingTrip ? 'Edit Trip' : 'Plan a New Trip'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-full">
                <Label>Trip Name</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Kumasi Heritage Tour" required />
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <Input value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="e.g. Ashanti Region" required />
              </div>

              <div className="space-y-2">
                <Label>Budget (GHS)</Label>
                <Input type="number" value={formData.total_budget} onChange={e => setFormData({ ...formData, total_budget: e.target.value })} placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Transport</Label>
                <div className="flex gap-2">
                  <Input value={newTransport} onChange={e => setNewTransport(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('transport_details', newTransport, setNewTransport))} placeholder="e.g. Bus, Private car..." />
                  <Button type="button" size="sm" onClick={() => addItem('transport_details', newTransport, setNewTransport)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.transport_details.map((t, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {t} <button type="button" onClick={() => removeItem('transport_details', i)} className="hover:text-destructive ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Activities & Attractions</Label>
                <div className="flex gap-2">
                  <Input value={newActivity} onChange={e => setNewActivity(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('activities', newActivity, setNewActivity))} placeholder="e.g. Kakum canopy walk..." />
                  <Button type="button" size="sm" onClick={() => addItem('activities', newActivity, setNewActivity)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.activities.map((a, i) => (
                    <Badge key={i} variant="outline" className="gap-1 pr-1">
                      {a} <button type="button" onClick={() => removeItem('activities', i)} className="hover:text-destructive ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Itinerary Steps</Label>
                <div className="flex gap-2">
                  <Input value={newItinerary} onChange={e => setNewItinerary(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('itinerary', newItinerary, setNewItinerary))} placeholder="e.g. Day 1: Arrive in Accra..." />
                  <Button type="button" size="sm" onClick={() => addItem('itinerary', newItinerary, setNewItinerary)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.itinerary.map((it, i) => (
                    <Badge key={i} variant="outline" className="gap-1 pr-1">
                      {it} <button type="button" onClick={() => removeItem('itinerary', i)} className="hover:text-destructive ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes or requirements..." className="min-h-[100px]" />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={updateTrip.isPending || createTrip.isPending}>
                {(updateTrip.isPending || createTrip.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingTrip ? 'Save Changes' : 'Create Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
