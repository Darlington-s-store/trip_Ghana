import { useState } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      updateUser(res.data.data);
      toast({ title: 'Profile updated!' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update profile', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div><h2 className="font-heading font-bold text-2xl text-foreground">Profile</h2><p className="text-muted-foreground">Manage your personal information.</p></div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center"><Camera className="h-4 w-4" /></button>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-card-foreground">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">First Name</label><Input value={form.firstName} onChange={e => update('firstName', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Last Name</label><Input value={form.lastName} onChange={e => update('lastName', e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label><Input type="email" value={form.email} disabled className="opacity-60" /></div>
          <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Phone</label><Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+233 XX XXX XXXX" /></div>
          <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
