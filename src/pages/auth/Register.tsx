import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName });
      const { user, token } = res.data.data;
      login(user, token);
      toast({ title: 'Account created!' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8"><div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center"><MapPin className="h-5 w-5 text-primary-foreground" /></div><span className="font-heading font-bold text-xl text-foreground">GhanaTravel</span></Link>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Create an account</h1>
          <p className="text-muted-foreground mb-8">Start your Ghanaian adventure today.</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">First Name</label><Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Kwame" required /></div>
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Last Name</label><Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Mensah" required /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="kwame@example.com" required /></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative"><Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {form.password && <div className="mt-2"><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all ${form.password.length >= 12 ? 'w-full bg-success' : form.password.length >= 8 ? 'w-3/4 bg-accent' : form.password.length >= 4 ? 'w-1/2 bg-warning' : 'w-1/4 bg-destructive'}`} /></div><p className="text-xs text-muted-foreground mt-1">{form.password.length >= 12 ? 'Very strong' : form.password.length >= 8 ? 'Strong' : form.password.length >= 4 ? 'Fair' : 'Weak'}</p></div>}
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label><Input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="••••••••" required /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-11 font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</> : 'Create Account'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground">
          <h2 className="font-heading font-bold text-4xl mb-4">Join 10,000+ Travellers</h2>
          <p className="text-lg text-primary-foreground/70 max-w-md mx-auto">Create your free account and unlock personalized trip planning, exclusive deals, and more.</p>
        </div>
      </div>
    </div>
  );
}
