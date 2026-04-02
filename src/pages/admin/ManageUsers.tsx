import { useState } from 'react';
import {
  Search, Plus, Edit, Trash2, Loader2, Mail, ShieldCheck,
  UserPlus, Lock, User as UserIcon, ArrowLeft, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { cn } from '@/lib/utils';

export default function ManageUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [resetPassword, setResetPassword] = useState('');

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', phone: '', role: 'user', password: ''
  });

  const { data: userRes, isLoading, refetch } = useUsers({ search });
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const deleteMut = useDeleteUser();
  const users = (userRes?.data || []) as User[];

  const openAdd = () => {
    setEditId(null);
    setForm({ email: '', firstName: '', lastName: '', phone: '', role: 'user', password: '' });
    setView('form');
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({
      email: u.email, firstName: u.firstName || '', lastName: u.lastName || '',
      phone: u.phone || '', role: u.role || 'user', password: ''
    });
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateMut.mutateAsync({
          id: editId,
          data: { email: form.email, firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role, password: form.password || undefined }
        });
        toast({ title: 'User updated successfully.' });
      } else {
        if (!form.password) {
          toast({ title: 'Password is required for new users.', variant: 'destructive' });
          return;
        }
        await createMut.mutateAsync(form);
        toast({ title: 'User created successfully.' });
      }
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save user', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetId || !resetPassword) return;
    try {
      await updateMut.mutateAsync({ id: resetId, data: { password: resetPassword } });
      toast({ title: 'Password reset successfully.' });
      setResetId(null);
      setResetPassword('');
      refetch();
    } catch {
      toast({ title: 'Failed to reset password.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'User deleted.' });
      setDeleteId(null);
      refetch();
    } catch {
      toast({ title: 'Failed to delete user.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions.</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 gap-2">
              <UserPlus className="h-4 w-4" /> Add User
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Name</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Contact</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase">Role</th>
                    <th className="p-4 font-medium text-muted-foreground text-xs uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
                  ) : users.length > 0 ? users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{u.phone || '—'}</td>
                      <td className="p-4">
                        <Badge className={cn(
                          "capitalize text-xs font-medium border-none",
                          u.role === 'admin' ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"
                        )}>
                          {u.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setResetId(u.id); setResetPassword(''); }} className="h-8 w-8 text-warning">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="h-8 w-8 text-info">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(u.id)} className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <Button variant="ghost" type="button" onClick={() => setView('list')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Button>

          <div className="border-b border-border pb-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">{editId ? 'Edit User' : 'Add New User'}</h2>
            <p className="text-muted-foreground text-sm">{editId ? `Editing ${form.email}` : 'Create a new user account.'}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+233 XX XXX XXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={val => setForm({ ...form, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{editId ? 'New Password (optional)' : 'Password'}</label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} placeholder={editId ? 'Leave blank to keep current' : ''} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setView('list')}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editId ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Enter a new password for this user.</DialogDescription>
          </DialogHeader>
          <Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New password" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetId(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={!resetPassword || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User?</DialogTitle>
            <DialogDescription>This will permanently remove the user account and all associated data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
