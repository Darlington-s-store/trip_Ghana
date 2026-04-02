import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Map,
  ArrowLeft,
  Globe,
  Sparkles,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDestinations, useCreateDestination, useUpdateDestination, useDeleteDestination } from '@/hooks/useApi';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Destination } from '@/types';
import { cn } from '@/lib/utils';

export default function ManageDestinations() {
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', 
    slug: '', 
    description: '', 
    shortDescription: '', 
    image: '', 
    region: '', 
    featured: false 
  });

  const { data: destRes, isLoading, refetch } = useDestinations({ search });
  const createMut = useCreateDestination();
  const updateMut = useUpdateDestination();
  const deleteMut = useDeleteDestination();

  const destinations = (destRes?.data || []) as Destination[];

  const openAdd = () => { 
    setEditId(null); 
    setForm({ 
      name: '', 
      slug: '', 
      description: '', 
      shortDescription: '', 
      image: '', 
      region: '', 
      featured: false 
    }); 
    setView('form'); 
  };

  const openEdit = (d: Destination) => { 
    setEditId(d.id); 
    setForm({ 
      name: d.name, 
      slug: d.slug, 
      description: d.description || '', 
      shortDescription: d.shortDescription || '', 
      image: d.image || '', 
      region: d.region || '', 
      featured: d.featured || false 
    }); 
    setView('form'); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, data: { ...form, slug } });
        toast({ title: 'Success', description: 'Destination updated successfully.' });
      } else {
        await createMut.mutateAsync({ ...form, slug });
        toast({ title: 'Success', description: 'New destination created successfully.' });
      }
      setView('list');
      refetch();
    } catch (err: unknown) { 
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to save destination', 
        variant: 'destructive' 
      }); 
    }
  };

  const handleDelete = async () => { 
    if (!deleteId) return; 
    try { 
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Deleted', description: 'Destination has been removed.' });
      setDeleteId(null);
      refetch();
    } catch (err: unknown) {
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to delete destination', 
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
              <h1 className="text-2xl font-bold tracking-tight">Destinations</h1>
              <p className="text-muted-foreground">Manage regional locations and travel destinations.</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 font-semibold gap-2">
              <Plus className="h-4 w-4" /> Add Destination
            </Button>
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or region..." 
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
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Destination</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Region</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    <th className="p-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading destinations...
                      </td>
                    </tr>
                  ) : destinations.length > 0 ? destinations.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                            {d.image ? (
                              <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                            ) : (
                              <Camera className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{d.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{d.shortDescription}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {d.region}
                        </div>
                      </td>
                      <td className="p-4">
                        {d.featured ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold uppercase text-[10px] px-2 py-0.5 rounded">
                            <Sparkles className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-border font-bold uppercase text-[10px] px-2 py-0.5 rounded">
                            Standard
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d)} className="h-8 w-8 text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)} className="h-8 w-8 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        No destinations found.
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
            <ArrowLeft className="h-4 w-4" /> Back to destination list
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{editId ? 'Edit Destination' : 'Add New Destination'}</h2>
              <p className="text-sm text-muted-foreground">
                {editId ? `Updating geography and details for ${form.name}` : 'Enter the geographical and descriptive details for the new location.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => setView('list')} className="gap-2">
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90 font-semibold min-w-[140px]">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Create Destination'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Destination Name</label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g., Accra" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">URL Slug</label>
                  <Input 
                    value={form.slug} 
                    onChange={e => setForm({...form, slug: e.target.value})} 
                    placeholder="accra-ghana" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Short Summary</label>
                  <Input 
                    required 
                    value={form.shortDescription} 
                    onChange={e => setForm({...form, shortDescription: e.target.value})} 
                    placeholder="Brief highlight of this destination" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Long Description</label>
                  <Textarea 
                    required 
                    rows={6}
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    placeholder="Describe the beauty and attractions of this location..." 
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Region</label>
                  <Input 
                    value={form.region} 
                    onChange={e => setForm({...form, region: e.target.value})} 
                    placeholder="Greater Accra Region" 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Image URL</label>
                  <div className="flex gap-2">
                    <Input 
                      value={form.image} 
                      onChange={e => setForm({...form, image: e.target.value})} 
                      placeholder="https://example.com/image.jpg" 
                    />
                    <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {form.image ? <img src={form.image} className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Featured Location</label>
                    <Switch 
                      checked={form.featured} 
                      onCheckedChange={checked => setForm({...form, featured: checked})} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Displays in the "Top Destinations" section.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Destination?</DialogTitle>
            <DialogDescription>
              This will remove the destination and its details. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
