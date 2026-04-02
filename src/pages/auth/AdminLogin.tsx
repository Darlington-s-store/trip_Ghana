import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.adminLogin(email, password);
      const { user, token } = res.data.data;
      login(user, token);
      toast({ title: 'Welcome, Admin!' });
      navigate('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid admin credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Shield className="h-7 w-7 text-primary" /></div>
            <h1 className="font-heading font-bold text-2xl text-card-foreground">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-1">GhanaTravel Administration</p>
          </div>
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ghanatravel.com" required /></div>
            <div><label className="text-sm font-medium text-card-foreground mb-1.5 block">Password</label>
              <div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-11 font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In as Admin'}
            </Button>
          </form>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary mt-6">Back to main site</Link>
        </div>
      </div>
    </div>
  );
}
