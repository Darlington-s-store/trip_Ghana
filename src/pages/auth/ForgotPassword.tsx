import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); } catch {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8"><div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center"><MapPin className="h-5 w-5 text-primary-foreground" /></div><span className="font-heading font-bold text-xl text-foreground">GhanaTravel</span></Link>
        {sent ? (
          <div className="text-center"><h1 className="font-heading font-bold text-3xl text-foreground mb-2">Check your email</h1><p className="text-muted-foreground mb-8">We've sent a reset link to {email}</p><Link to="/login"><Button variant="outline">Back to Sign In</Button></Link></div>
        ) : (
          <>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kwame@example.com" required /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-11 font-semibold">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </Button>
            </form>
            <Link to="/login" className="flex items-center gap-2 text-sm text-primary hover:underline mt-6 justify-center"><ArrowLeft className="h-4 w-4" /> Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
