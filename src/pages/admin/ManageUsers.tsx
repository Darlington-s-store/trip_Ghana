import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  UserCircle2, 
  Mail, 
  ShieldCheck, 
  UserPlus,
  Lock,
  User as UserIcon,
  Check,
  MoreVertical,
  X,
  ArrowLeft,
  Activity,
  Clock,
  KeyRound,
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { cn } from '@/lib/utils';

export default function ManageUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  
  const [form, setForm] = useState({ 
    email: '', 
    firstName: '', 
    lastName: '', 
    phone: '',
    role: 'user', 
    password: '' 
  });

  const { data: userRes, isLoading, refetch } = useUsers({ search });
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const deleteMut = useDeleteUser();

  const users = (userRes?.data || []) as User[];

  const openAdd = () => { 
    setEditId(null); 
    setForm({ 
      email: '', 
      firstName: '', 
      lastName: '', 
      phone: '',
      role: 'user', 
      password: '' 
    }); 
    setView('form');
  };

  const openEdit = (u: User) => { 
    setEditId(u.id); 
    setForm({ 
      email: u.email, 
      firstName: u.firstName || '', 
      lastName: u.lastName || '', 
      phone: u.phone || '',
      role: u.role || 'user', 
      password: '' 
    }); 
    setView('form');
  };

  const openDetail = (u: User) => {
    setSelectedUser(u);
    setView('detail');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateMut.mutateAsync({ 
          id: editId, 
          data: { 
            email: form.email, 
            firstName: form.firstName, 
            lastName: form.lastName, 
            phone: form.phone,
            role: form.role,
            password: form.password || undefined
          } 
        });
        toast({ title: 'Profile Preserved', description: `Administrative changes for ${form.email} have been synchronized.` });
      } else {
        if (!form.password) { 
          toast({ title: 'Security Key Required', description: 'Please assign an initial access key for the participant.', variant: 'destructive' }); 
          return; 
        }
        await createMut.mutateAsync(form);
        toast({ title: 'Registration Complete', description: 'Participant has been granted system access.' });
      }
      setView('list');
      refetch();
    } catch (err: unknown) { 
      toast({ 
        title: 'System Conflict', 
        description: err instanceof Error ? err.message : 'Database collision detected', 
        variant: 'destructive' 
      }); 
    }
  };

  const handleResetPassword = async () => {
    if (!resetId || !resetPassword) return;
    try {
      await updateMut.mutateAsync({
        id: resetId,
        data: { password: resetPassword }
      });
      toast({ title: 'Security Credentials Updated', description: 'Password reset has been successfully finalized.' });
      setResetId(null);
      setResetPassword('');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Reset Failed', description: 'Security override rejected by server.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => { 
    if (!deleteId) return; 
    try { 
      await deleteMut.mutateAsync(deleteId);
      toast({ title: 'Access Revoked', description: 'Account and associated metadata permanently deleted.' });
      setDeleteId(null);
      setView('list');
      refetch();
    } catch (err: unknown) {
      toast({ title: 'Deletion Aborted', variant: 'destructive' });
    } 
  };

  return (
    <div className="p-6 space-y-8 bg-background min-h-full max-w-full">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Identity & Access Management</h1>
              <p className="text-muted-foreground font-medium">Control platform participation and assign administrative clearance levels.</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 font-black gap-2 px-8 h-12 shadow-lg shadow-primary/20 uppercase tracking-widest text-xs rounded-2xl">
              <UserPlus className="h-5 w-5" /> Register Participant
            </Button>
          </div>

          <div className="bg-card rounded-[2rem] border p-6 shadow-sm flex items-center justify-between gap-4 border-muted/50">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
              <Input 
                placeholder="Lookup by identity, contact or clearance..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-12 h-12 bg-muted/30 border-none rounded-xl font-bold placeholder:font-medium placeholder:opacity-50" 
              />
            </div>
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-tighter text-[10px] px-3 py-1 rounded-lg">
                  {users.length} Active Accounts
               </Badge>
            </div>
          </div>

          <div className="bg-card rounded-[2rem] border shadow-sm overflow-hidden border-muted/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-5 font-black text-muted-foreground uppercase text-[10px] tracking-[0.2em]">System Identity</th>
                    <th className="p-5 font-black text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Communication</th>
                    <th className="p-5 font-black text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Clearance Level</th>
                    <th className="p-5 font-black text-muted-foreground uppercase text-[10px] tracking-[0.2em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                          <span className="font-black text-muted-foreground uppercase tracking-widest text-[10px]">Synchronizing Participant Registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length > 0 ? users.map((u) => (
                    <tr key={u.id} className="hover:bg-primary/[0.02] transition-colors group cursor-pointer" onClick={() => openDetail(u)}>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-[1rem] bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0 group-hover:scale-110 transition-transform">
                            <UserIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-foreground text-base tracking-tight truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground font-bold truncate flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3.5 w-3.5 text-primary/40" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-xs font-black text-muted-foreground tracking-widest whitespace-nowrap bg-muted/30 px-3 py-1.5 rounded-lg inline-block">
                          {u.phone || '000-000-000'}
                        </p>
                      </td>
                      <td className="p-5">
                        <Badge className={cn(
                          "bg-muted/50 text-muted-foreground border-none font-black uppercase text-[9px] px-3 py-1.5 rounded-lg tracking-widest",
                          u.role === 'admin' && "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                        )}>
                          {u.role === 'admin' ? (
                            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Administrator</span>
                          ) : 'General Member'}
                        </Badge>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setResetId(u.id); setResetPassword(''); }} title="Manual Password Reset" className="h-10 w-10 text-orange-600 hover:bg-orange-50 rounded-xl">
                            <KeyRound className="h-4.5 w-4.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Modify Permissions" className="h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-xl">
                            <Edit className="h-4.5 w-4.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(u.id)} title="Revoke Access" className="h-10 w-10 text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-24 text-center text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-30">
                        Zero participants located in current registry segment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : view === 'form' ? (
        <form onSubmit={handleSubmit} className="w-full space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-4">
              <Button variant="ghost" type="button" onClick={() => setView('list')} className="h-12 w-12 rounded-2xl border bg-card hover:bg-muted p-0 text-muted-foreground hover:text-foreground shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-1 w-12 bg-primary/20 rounded-full" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Registry Modification</p>
           </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
            <div className="space-y-3">
              <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                {editId ? 'Modify Participant' : 'Architect Access'}
              </h2>
              <p className="text-muted-foreground font-medium text-lg">
                {editId ? `Provisioning new parameters for: ${form.email}` : 'Define high-level access protocols for a new system entity.'}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Button variant="ghost" type="button" onClick={() => setView('list')} className="px-8 h-14 font-bold rounded-2xl uppercase tracking-widest text-xs">
                Abort
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90 font-black px-12 h-14 shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] rounded-[1.5rem] min-w-[200px]">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                {editId ? 'Commit Synchronization' : 'Initialize Participant'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              <div className="bg-card rounded-[2.5rem] border p-10 shadow-sm space-y-10 border-muted/50">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="p-3 bg-primary/10 rounded-[1.2rem] text-primary">
                    <UserCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Identity Registry</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Personal Identification Metrics</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Legal Given Name</label>
                    <Input 
                      required 
                      value={form.firstName} 
                      onChange={e => setForm({...form, firstName: e.target.value})} 
                      placeholder="SAMUEL" 
                      className="h-14 bg-muted/20 border-none rounded-2xl text-lg font-black uppercase px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Legal Surname</label>
                    <Input 
                      required 
                      value={form.lastName} 
                      onChange={e => setForm({...form, lastName: e.target.value})} 
                      placeholder="MENSAH" 
                      className="h-14 bg-muted/20 border-none rounded-2xl text-lg font-black uppercase px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Email Communication</label>
                    <Input 
                      type="email" 
                      required 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})} 
                      placeholder="name@domain.com" 
                      className="h-14 bg-muted/20 border-none rounded-2xl font-bold px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Verified Phone Connection</label>
                    <div className="relative">
                      <Input 
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})} 
                        placeholder="+233 55 000 0000" 
                        className="h-14 bg-muted/20 border-none rounded-2xl font-black px-6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editId && (
                <div className="bg-orange-50/30 rounded-[2.5rem] border border-orange-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-[1.2rem] text-orange-600">
                        <Lock className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-orange-900">Security Override</h3>
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Manual Credential Reset</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3 max-w-lg">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800 ml-1">New Access Key</label>
                      <Input 
                        type="password" 
                        value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                        placeholder="Enter manual override sequence..." 
                        className="h-14 border-orange-200 bg-white shadow-inner font-black px-6 rounded-2xl focus-visible:ring-orange-500"
                      />
                      <div className="flex items-start gap-2 text-orange-700 mt-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold leading-relaxed">Leave this segment empty to preserve the participant's current secure authentication sequence.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8 sticky top-10">
              <div className="bg-card rounded-[2.5rem] border p-10 shadow-sm space-y-10 border-muted/50">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="p-3 bg-blue-50 rounded-[1.2rem] text-blue-600">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Clearance</h3>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Sector Authorization</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block ml-1">Assigned Protocols</label>
                    <Select value={form.role} onValueChange={val => setForm({...form, role: val})}>
                      <SelectTrigger className="h-14 font-black rounded-2xl bg-muted/20 border-none px-6 text-lg">
                        <SelectValue placeholder="Define Protocols" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="user" className="h-12 font-bold rounded-xl focus:bg-primary/5 focus:text-primary">REGULAR PARTICIPANT</SelectItem>
                        <SelectItem value="admin" className="h-12 font-black rounded-xl text-primary focus:bg-primary focus:text-white uppercase tracking-widest">SYSTEM ADMINISTRATOR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-8 rounded-[1.5rem] bg-muted/20 border border-border/50 space-y-5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                       Operational Scope
                    </p>
                    <ul className="space-y-4">
                      {[ 
                        'Personalized data management', 
                        'Historical activity logs', 
                        form.role === 'admin' ? 'Global administrative override' : null,
                        form.role === 'admin' ? 'Database segment modification' : null
                      ].filter(Boolean).map((scope, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={cn("mt-1 h-2 w-2 rounded-full", form.role === 'admin' && idx >= 2 ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                          <span className={cn("text-xs font-bold", form.role === 'admin' && idx >= 2 ? "text-primary uppercase tracking-tighter" : "text-muted-foreground/80")}>
                            {scope}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {!editId && (
                <div className="bg-primary/5 rounded-[2.5rem] border border-primary/20 p-10 space-y-6">
                  <div className="flex items-center gap-3 text-primary">
                    <Lock className="h-6 w-6" />
                    <h4 className="font-black uppercase tracking-tighter text-xl">Initial Access Key</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Manual Provisioning</label>
                    <Input 
                      type="password" 
                      required 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      placeholder="DEFINE SECURITY KEY" 
                      className="bg-white h-14 rounded-2xl border-none shadow-inner font-black px-6"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                      Participants are mandated to authenticate with this manual key for initial platform discovery.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
           <div className="flex items-center gap-4">
              <Button variant="ghost" type="button" onClick={() => setView('list')} className="h-12 w-12 rounded-2xl border bg-card hover:bg-muted p-0 text-muted-foreground hover:text-foreground shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-1 w-12 bg-primary/20 rounded-full" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Participant intelligence</p>
           </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 border-b pb-12">
            <div className="flex items-center gap-10">
              <div className="h-32 w-32 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary border-4 border-white shadow-2xl relative">
                <UserIcon className="h-14 w-14" />
                <Badge className="absolute -bottom-2 -right-2 bg-primary text-white border-2 border-white px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                  Verified
                </Badge>
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black tracking-tighter text-foreground uppercase">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </h2>
                <div className="flex items-center gap-4">
                  <Badge className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border-none shadow-sm",
                    selectedUser?.role === 'admin' ? "bg-blue-100 text-blue-700 shadow-blue-100" : "bg-muted text-muted-foreground"
                  )}>
                    {selectedUser?.role === 'admin' ? 'Administrator Clearance' : 'Standard Participant'}
                  </Badge>
                  <span className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-widest">SID: {selectedUser?.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
               <Button onClick={() => { setResetId(selectedUser!.id); setResetPassword(''); }} title="Direct Reset" className="h-14 w-14 rounded-2xl border bg-card hover:bg-orange-50 text-orange-600 shadow-sm border-orange-100 transition-all p-0">
                  <KeyRound className="h-6 w-6" />
               </Button>
               <Button variant="outline" onClick={() => openEdit(selectedUser!)} className="h-14 px-8 gap-3 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 transition-all hover:bg-muted">
                  <Edit className="h-5 w-5" /> Modify Account
               </Button>
               <Button onClick={() => { setEditId(selectedUser!.id); setForm({...form, email: selectedUser!.email, firstName: selectedUser!.firstName||'', lastName: selectedUser!.lastName||'', role: selectedUser!.role||'user'}); setView('form'); }} className="h-14 px-10 gap-3 font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/20">
                  <ShieldCheck className="h-5 w-5" /> Protocols & Security
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="bg-card rounded-[3rem] border p-12 shadow-sm space-y-12 border-muted/50">
                <div className="space-y-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                    <UserCircle2 className="h-5 w-5" /> Biological Identity Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-2 border-l-2 border-primary/10 pl-6">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Legal Combined Identity</p>
                      <p className="text-2xl font-black text-foreground uppercase tracking-tight">{selectedUser?.firstName} {selectedUser?.lastName}</p>
                    </div>
                    <div className="space-y-2 border-l-2 border-primary/10 pl-6">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Primary Digital Hub</p>
                      <p className="text-xl font-bold text-foreground lowercase">{selectedUser?.email}</p>
                    </div>
                    <div className="space-y-2 border-l-2 border-primary/10 pl-6">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Mobile Signal Origin</p>
                      <p className="text-2xl font-black text-foreground">{selectedUser?.phone || 'UNCONNECTED'}</p>
                    </div>
                    <div className="space-y-2 border-l-2 border-primary/10 pl-6">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Registry Timestamp</p>
                      <p className="text-2xl font-black text-foreground">JAN 2026</p>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-dashed">
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 mb-10">
                    <History className="h-5 w-5" /> Platform Interaction Log
                  </h3>
                  <div className="p-20 text-center border-4 border-dotted rounded-[2.5rem] bg-muted/10">
                    <Clock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-xs uppercase font-black tracking-[0.3em] text-muted-foreground/30">Zero recent interactions detected.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="bg-card rounded-[3rem] border p-12 shadow-sm space-y-10 border-muted/50">
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5" /> Operation Metrics
                </h3>
                <div className="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-xs font-black uppercase tracking-widest">Active Clearance</span>
                  </div>
                  <p className="text-[11px] text-emerald-600/80 font-bold leading-relaxed">
                    Account infrastructure is fully operational. All assigned system modules are accessible via authorized protocols.
                  </p>
                </div>
                
                <div className="space-y-6 pt-4">
                   <div className="flex items-center justify-between py-4 border-b border-muted/50 text-sm">
                      <span className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Real-time Status</span>
                      <Badge className="bg-emerald-500 text-white border-none font-black uppercase text-[9px] tracking-widest px-4 py-1 shadow-sm">Online</Badge>
                   </div>
                   <div className="flex items-center justify-between py-4 border-b border-muted/50 text-sm">
                      <span className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Verification Level</span>
                      <span className="text-foreground font-black uppercase tracking-tighter">Gold Tier</span>
                   </div>
                   <div className="flex items-center justify-between py-4 text-sm">
                      <span className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Identity Auth</span>
                      <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px]">
                        <Check className="h-4 w-4" /> Finalized
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-[2.5rem] border border-red-100 p-12 shadow-lg shadow-red-500/[0.03] space-y-6">
                <div className="flex items-center gap-3 text-red-600">
                  <ShieldAlert className="h-6 w-6" />
                  <h4 className="text-red-900 font-black text-sm uppercase tracking-[0.2em]">System Expulsion</h4>
                </div>
                <p className="text-[11px] text-red-700/80 font-bold leading-relaxed">
                  Permanently terminate this participant's access across all infrastructure clusters. This operation is irreversible.
                </p>
                <Button variant="destructive" onClick={() => setDeleteId(selectedUser!.id)} className="w-full h-14 font-black shadow-lg shadow-red-500/20 uppercase tracking-widest text-[10px] rounded-2xl">
                  Revoke Credentials
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-red-600 flex items-center gap-3">
              <ShieldAlert className="h-10 w-10" /> Confirm Expulsion
            </DialogTitle>
            <DialogDescription className="text-base font-bold text-muted-foreground leading-relaxed">
              You are about to permanently purge this participant from the system. All session clusters and secure metadata will be destroyed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end mt-10">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="h-14 px-8 font-black rounded-2xl uppercase tracking-widest text-xs">Retain Account</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending} className="h-14 px-12 font-black rounded-2xl shadow-xl shadow-red-500/20 uppercase tracking-widest text-xs">
              {deleteMut.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Trash2 className="mr-3 h-5 w-5" />}
              Finalize Purge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-orange-600 flex items-center gap-3">
              <KeyRound className="h-10 w-10" /> Security Reset
            </DialogTitle>
            <DialogDescription className="text-base font-bold text-muted-foreground leading-relaxed">
              Define a new manual access key for this participant. Current credentials will be immediately invalidated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800 ml-1">New Manual Key</label>
            <Input 
              type="password" 
              value={resetPassword} 
              onChange={e => setResetPassword(e.target.value)} 
              placeholder="CREATE STRONG KEY" 
              className="h-14 font-black bg-muted/20 border-none px-6 rounded-2xl focus-visible:ring-orange-500" 
            />
          </div>
          <div className="flex gap-4 justify-end mt-10">
            <Button variant="ghost" onClick={() => setResetId(null)} className="h-14 px-8 font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleResetPassword} disabled={updateMut.isPending} className="h-14 px-12 font-black rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 uppercase tracking-widest text-xs flex-1 sm:flex-none">
              {updateMut.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ShieldAlert className="mr-3 h-5 w-5" />}
              Finalize Security Override
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
