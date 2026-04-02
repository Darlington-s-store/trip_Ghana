import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      const { user, token } = res.data.data;
      login(user, token);
      toast({ title: 'Welcome back!' });
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center"><MapPin className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-heading font-bold text-xl text-foreground">GhanaTravel</span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to your account to continue.</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kwame@example.com" required /></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-border" /><span className="text-muted-foreground">Remember me</span></label>
              <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-11 font-semibold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link></p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground">
          <h2 className="font-heading font-bold text-4xl mb-4">Discover Ghana</h2>
          <p className="text-lg text-primary-foreground/70 max-w-md mx-auto">Book hotels, plan trips, and explore the best of West Africa — all in one place.</p>
        </div>
      </div>
    </div>
  );
}
