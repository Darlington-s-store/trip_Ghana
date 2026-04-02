import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Globe, 
  Bell, 
  Save, 
  Database, 
  Loader2, 
  Lock,
  Mail,
  Smartphone,
  Server,
  Cloud,
  CheckCircle2,
  Trash2,
  Key,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSettings, useUpdateSettings } from '@/hooks/useApi';

interface SettingItem {
  key: string;
  value: string;
  category: string;
  description: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: settingsRes, isLoading, isError } = useSettings();
  const updateSettings = useUpdateSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const settings = useMemo(() => settingsRes?.data || [], [settingsRes]);

  useEffect(() => {
    if (settings) {
      const initialData: Record<string, string> = {};
      settings.forEach((item: SettingItem) => {
        initialData[item.key] = item.value;
      });
      setFormData(initialData);
    }
  }, [settings]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: String(value) }));
  };

  const handleSave = async () => {
    const settingsToUpdate = Object.entries(formData).map(([key, value]) => ({
      key,
      value
    }));

    try {
      await updateSettings.mutateAsync(settingsToUpdate);
      toast({
        title: "Settings Saved",
        description: "Your platform configuration has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-xl font-bold">Failed to load settings</h2>
          <p className="text-muted-foreground">There was an error connecting to the server.</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-background min-h-full max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your platform identity, security, and infrastructure preferences.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateSettings.isPending}
          className="gap-2 font-semibold px-6 shadow-sm"
        >
          {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Platform Identity</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Website Name</Label>
                <Input 
                  value={formData.platform_name || ''} 
                  onChange={(e) => handleInputChange('platform_name', e.target.value)}
                  placeholder="Enter site name" 
                  className="shadow-none focus-visible:ring-1" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Support Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.support_email || ''} 
                    onChange={(e) => handleInputChange('support_email', e.target.value)}
                    className="pl-10 shadow-none focus-visible:ring-1" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-semibold">Support Phone Number</Label>
                <div className="relative group">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={formData.contact_number || ''} 
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    className="pl-10 shadow-none focus-visible:ring-1" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Platform Fee (%)</Label>
                <Input 
                  type="number"
                  value={formData.platform_fee || '0'} 
                  onChange={(e) => handleInputChange('platform_fee', e.target.value)}
                  className="shadow-none focus-visible:ring-1" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Currency Code</Label>
                <Input 
                  value={formData.currency_code || 'GHS'} 
                  onChange={(e) => handleInputChange('currency_code', e.target.value)}
                  className="shadow-none focus-visible:ring-1" 
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-lg px-1 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Infrastructure Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4 transition-all hover:border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Database</p>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/10 px-2 py-0">Online</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Managed Postgres</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Storage cluster active in West Africa region with auto-failover enabled.</p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> All services operational
                </div>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4 transition-all hover:border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Edge Network</p>
                  <Badge className="bg-blue-500/10 text-blue-600 border-none hover:bg-blue-500/10 px-2 py-0">Global</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Content Delivery</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Static assets and API endpoints distributed via global edge network.</p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-xs font-medium text-blue-600">
                  <Cloud className="h-4 w-4" /> Average Latency: 12ms
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Access Control</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">User Registration</p>
                  <p className="text-xs text-muted-foreground leading-snug">Allow new users to create accounts.</p>
                </div>
                <Switch 
                  checked={formData.allow_user_registration === 'true'} 
                  onCheckedChange={(val) => handleToggleChange('allow_user_registration', val)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Admin Approval</p>
                  <p className="text-xs text-muted-foreground leading-snug">Require admin approval for new listings.</p>
                </div>
                <Switch 
                  checked={formData.admin_approval_required === 'true'} 
                  onCheckedChange={(val) => handleToggleChange('admin_approval_required', val)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Notifications</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Email Alerts</p>
                  <p className="text-xs text-muted-foreground leading-snug">Receive platform emails.</p>
                </div>
                <Switch 
                  checked={formData.email_notifications_enabled === 'true'} 
                  onCheckedChange={(val) => handleToggleChange('email_notifications_enabled', val)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground leading-snug">Receive SMS notifications.</p>
                </div>
                <Switch 
                  checked={formData.sms_notifications_enabled === 'true'} 
                  onCheckedChange={(val) => handleToggleChange('sms_notifications_enabled', val)}
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
            </div>
          </section>

          <section className="p-6 bg-red-50/50 border border-red-100 rounded-xl space-y-4">
            <h3 className="text-red-900 font-bold flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Danger Zone
            </h3>
            <p className="text-xs text-red-700">These actions are irreversible and affect global data.</p>
            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 font-semibold shadow-none">
              Flush System Cache
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
