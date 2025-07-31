import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Save, Key } from 'lucide-react';

interface StripeSettings {
  stripe_public_key?: string;
  stripe_secret_key?: string;
}

const AdminStripeSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<StripeSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [formData, setFormData] = useState({
    stripe_public_key: '',
    stripe_secret_key: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          stripe_public_key: data.stripe_public_key || '',
          stripe_secret_key: data.stripe_secret_key || ''
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Stripe settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('stripe_settings')
        .upsert({
          stripe_public_key: formData.stripe_public_key || null,
          stripe_secret_key: formData.stripe_secret_key || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stripe settings saved successfully"
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Stripe settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stripe Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Configuration
          </CardTitle>
          <CardDescription>
            Configure your Stripe API keys for payment processing. These keys are securely stored and used for all payment operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="public_key">Stripe Publishable Key</Label>
            <Input
              id="public_key"
              placeholder="pk_test_... or pk_live_..."
              value={formData.stripe_public_key}
              onChange={(e) => handleInputChange('stripe_public_key', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This key is safe to use in client-side code and will be visible to users.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Stripe Secret Key</Label>
            <div className="relative">
              <Input
                id="secret_key"
                type={showSecretKey ? "text" : "password"}
                placeholder="sk_test_... or sk_live_..."
                value={formData.stripe_secret_key}
                onChange={(e) => handleInputChange('stripe_secret_key', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This key must be kept secret and is used for server-side operations only.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
            <p className="text-sm text-yellow-700">
              Always use test keys during development and only switch to live keys when you're ready for production. 
              Never share your secret key or commit it to version control.
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchSettings}
              disabled={saving}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Get Your Stripe Keys</h4>
            <p className="text-sm text-muted-foreground">
              Log in to your Stripe dashboard and navigate to Developers → API keys to find your publishable and secret keys.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Test vs Live Environment</h4>
            <p className="text-sm text-muted-foreground">
              Use test keys (pk_test_ and sk_test_) for development and testing. 
              Switch to live keys (pk_live_ and sk_live_) only when ready for production.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Webhook Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Set up webhooks in your Stripe dashboard pointing to your application's webhook endpoint to handle payment events automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStripeSettings;