import { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Search, 
  Star, 
  Clock, 
  MapPin, 
  Ticket,
  ChevronRight,
  X,
  Camera,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencyStore } from '@/store/currencyStore';
import { useAttractions, useCreateAttraction, useUpdateAttraction, useDeleteAttraction } from '@/hooks/useApi';
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
import { Attraction } from '@/types';
import { cn } from '@/lib/utils';

export default function ManageAttractions() {
  const { format } = useCurrencyStore();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    shortDescription: '',
    location: '', 
    category: '', 
    entryFee: '', 
    rating: '', 
    openingHours: '', 
    image: '',
    featured: false
  });

  const { data: attrRes, isLoading, refetch } = useAttractions({ search });
  const createMut = useCreateAttraction();
  const updateMut = useUpdateAttraction();
  const deleteMut = useDeleteAttraction();

  const attractions = (attrRes?.data || []) as Attraction[];

  const openAdd = () => { 
    setEditId(null); 
    setForm({ 
      name: '', 
      description: '', 
      shortDescription: '',
      location: '', 
      category: '', 
      entryFee: '', 
      rating: '', 
      openingHours: '', 
      image: '',
      featured: false
    }); 
    setView('form'); 
  };

  const openEdit = (a: Attraction) => { 
    setEditId(a.id); 
    setForm({ 
      name: a.name, 
      description: a.description || '', 
      shortDescription: a.shortDescription || '',
      location: a.location || '', 
      category: a.category || '', 
      entryFee: String(a.entryFee || ''), 
      rating: String(a.rating || ''), 
      openingHours: a.openingHours || '', 
      image: a.image || '',
      featured: a.featured || false
    }); 
    setView('form'); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      entryFee: parseFloat(form.entryFee) || 0, 
      rating: parseFloat(form.rating) || 0 
    };
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: payload });
        toast({ title: 'Success', description: 'Attraction updated successfully.' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Success', description: 'New attraction added successfully.' });
      }
      setView('list');
      refetch();
    } catch (err: unknown) { 
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to save attraction', 
        variant: 'destructive' 
      }); 
    }
  };

  const handleDelete = async () => { 
    if (!deleteId) return; 
    try { 
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Deleted', description: 'Attraction has been removed.' });
      setDeleteId(null);
      refetch();
    } catch (err: unknown) {
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to delete attraction', 
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
              <h1 className="text-2xl font-bold tracking-tight">Attractions</h1>
              <p className="text-muted-foreground">Manage sightseeing spots and local landmarks.</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Add Attraction
            </Button>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search attractions..." 
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
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Attraction</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Location / Category</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-center">Stats</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : attractions.length > 0 ? attractions.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                            {a.image ? (
                              <img src={a.image} alt={a.name} className="h-full w-full object-cover" />
                            ) : (
                              <Camera className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{a.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{a.shortDescription}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs gap-1.5 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {a.location}
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 rounded">
                            {a.category}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                              <Star className="h-3 w-3 fill-current" /> {a.rating}
                            </div>
                          </div>
                          <div className="text-center border-l pl-3">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Fee</p>
                            <p className="text-xs font-bold text-primary">{format(a.entryFee)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        No attractions found.
                      </td>
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
            <ArrowLeft className="h-4 w-4" /> Back to attraction list
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{editId ? 'Modify Attraction Details' : 'Register New Attraction'}</h2>
              <p className="text-sm text-muted-foreground">
                {editId ? `Updating the operational and descriptive information for ${form.name}` : 'Enter the complete details to list a new point of interest in the directory.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => setView('list')} className="gap-2">
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90 font-semibold min-w-[140px]">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Publish Attraction'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Attraction Name</label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g., Kakum National Park" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Short Subtitle</label>
                  <Input 
                    required 
                    value={form.shortDescription} 
                    onChange={e => setForm({...form, shortDescription: e.target.value})} 
                    placeholder="One-line summary for the list view" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Full Description</label>
                  <Textarea 
                    required 
                    rows={6}
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    placeholder="Tell the full story of this place..." 
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Visual Metadata</h3>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Primary Media URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={form.image} 
                      onChange={e => setForm({...form, image: e.target.value})} 
                      placeholder="https://images.unsplash.com/..." 
                    />
                    <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {form.image ? <img src={form.image} className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Location</label>
                  <Input 
                    value={form.location} 
                    onChange={e => setForm({...form, location: e.target.value})} 
                    placeholder="Central Region, Ghana" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Category</label>
                  <Input 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    placeholder="Nature / History / Adventure" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Entry Fee</label>
                    <Input 
                      type="number" 
                      value={form.entryFee} 
                      onChange={e => setForm({...form, entryFee: e.target.value})} 
                      placeholder="0.00" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Rating</label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      max="5" 
                      value={form.rating} 
                      onChange={e => setForm({...form, rating: e.target.value})} 
                      placeholder="4.5" 
                    />
                  </div>
                </div>
                <div className="grid gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Featured Attraction</label>
                    <Switch 
                      checked={form.featured} 
                      onCheckedChange={checked => setForm({...form, featured: checked})} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight italic">Displays prominently on the landing page</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2 italic"><Clock className="h-4 w-4 text-primary" /> Operational Hours</h3>
                <Input 
                  value={form.openingHours} 
                  onChange={e => setForm({...form, openingHours: e.target.value})} 
                  placeholder="e.g., Daily 8:00 AM - 5:00 PM" 
                />
              </div>
            </div>
          </div>
        </form>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attraction?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This attraction will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
