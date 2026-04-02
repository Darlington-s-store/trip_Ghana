import { useState } from 'react';
import { Bell, Lock, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyToggle } from '@/components/features/CurrencyToggle';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function DashboardSettings() {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    if (passwordForm.newPassword.length < 8) { toast({ title: 'Password must be at least 8 characters', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast({ title: 'Password updated!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to change password', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div><h2 className="font-heading font-bold text-2xl text-foreground">Settings</h2><p className="text-muted-foreground">Customize your account preferences.</p></div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4"><Globe className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold text-card-foreground">Currency Preference</h3></div>
        <p className="text-sm text-muted-foreground mb-4">Choose your preferred currency for displaying prices.</p>
        <CurrencyToggle />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4"><Bell className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold text-card-foreground">Notification Preferences</h3></div>
        <div className="space-y-4">
          {['Booking confirmations', 'Trip reminders', 'Promotional offers', 'Price alerts'].map((item) => (
            <label key={item} className="flex items-center justify-between">
              <span className="text-sm text-card-foreground">{item}</span>
              <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4"><Lock className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold text-card-foreground">Change Password</h3></div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Current Password</label><Input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
          <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">New Password</label><Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required /></div>
          <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Confirm New Password</label><Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
          <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
