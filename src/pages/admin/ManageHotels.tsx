import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Star,
  MapPin,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Check,
  Building2,
  Waves,
  Car,
  X,
  Sparkles,
  ArrowLeft,
  Camera,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencyStore } from '@/store/currencyStore';
import { useHotels, useCreateHotel, useUpdateHotel, useDeleteHotel } from '@/hooks/useApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Hotel } from '@/types';
import { cn } from '@/lib/utils';

const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'ac', label: 'AC', icon: Wind },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
];

export default function ManageHotels() {
  const { format: formatPrice } = useCurrencyStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    pricePerNight: '',
    rating: '',
    image: '',
    amenities: [] as string[],
    featured: false
  });

  const { data: hotelsRes, isLoading, refetch } = useHotels({ search });
  const createMut = useCreateHotel();
  const updateMut = useUpdateHotel();
  const deleteMut = useDeleteHotel();

  const hotels = (hotelsRes?.data || []) as Hotel[];

  const toggleAmenity = (id: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter(a => a !== id)
        : [...f.amenities, id]
    }));
  };

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: '', description: '', location: '', pricePerNight: '',
      rating: '', image: '', amenities: [], featured: false
    });
    setView('form');
  };

  const openEdit = (h: Hotel) => {
    setEditId(h.id);
    setForm({
      name: h.name,
      description: h.description || '',
      location: h.location || '',
      pricePerNight: String(h.pricePerNight || ''),
      rating: String(h.rating || ''),
      image: h.images?.[0] || '',
      amenities: h.amenities || [],
      featured: h.featured || false
    });
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      pricePerNight: Number(form.pricePerNight),
      rating: Number(form.rating),
      images: [form.image]
    };

    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: payload });
        toast({ title: 'Success', description: 'Hotel updated successfully.' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Success', description: 'New hotel added successfully.' });
      }
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save hotel',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Deleted', description: 'Hotel has been removed.' });
      setDeleteId(null);
      refetch();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete hotel',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hotels & Properties</h1>
              <p className="text-muted-foreground">Manage your accommodation listings and pricing.</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 font-semibold gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hotel name or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Property</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Location</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Pricing</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading hotels...
                      </td>
                    </tr>
                  ) : hotels.length > 0 ? hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                            {h.images?.[0] ? (
                              <img src={h.images[0]} alt={h.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{h.name}</p>
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                              <Star className="h-3 w-3 fill-current" /> {h.rating}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {h.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{formatPrice(h.pricePerNight)}<span className="text-[10px] text-muted-foreground font-normal">/night</span></p>
                          {h.featured && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold uppercase text-[9px] px-1.5 py-0 rounded">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(h)} className="h-8 w-8 text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(h.id)} className="h-8 w-8 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">No properties found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
          <Button variant="ghost" type="button" onClick={() => setView('list')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to hotel list
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{editId ? 'Modify Property Details' : 'Register New Property'}</h2>
              <p className="text-sm text-muted-foreground">
                {editId ? `Updating listing information for ${form.name}` : 'Enter the complete details to add a new accommodation to the directory.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => setView('list')} className="gap-2">
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90 font-semibold min-w-[140px]">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Publish Property'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Property Name</label>
                  <Input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Kempinski Gold Coast"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Description</label>
                  <Textarea
                    required
                    rows={6}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the property, rooms, and experience..."
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Amenities & Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AMENITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = form.amenities.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAmenity(opt.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          isSelected
                            ? "bg-primary/5 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-semibold">{opt.label}</span>
                        {isSelected && <Check className="h-3 w-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Location</label>
                  <Input
                    required
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Accra, Ghana"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Price/Night</label>
                    <Input
                      type="number"
                      required
                      value={form.pricePerNight}
                      onChange={e => setForm({ ...form, pricePerNight: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Rating</label>
                    <Input
                      type="number"
                      step="0.1"
                      max="5"
                      required
                      value={form.rating}
                      onChange={e => setForm({ ...form, rating: e.target.value })}
                      placeholder="4.5"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Main Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                      placeholder="https://..."
                    />
                    <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {form.image ? <img src={form.image} className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Featured Property</label>
                    <Switch
                      checked={form.featured}
                      onCheckedChange={checked => setForm({ ...form, featured: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property?</DialogTitle>
            <DialogDescription>
              This will permanently remove the property listing and its associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
