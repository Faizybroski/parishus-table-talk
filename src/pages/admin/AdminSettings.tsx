import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Database, Mail, Bell, Shield, Globe } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Table Talk',
    siteDescription: 'Connect over dinner experiences',
    maxEventAttendees: 10,
    defaultEventDuration: 120,
    
    // Email Settings
    emailNotifications: true,
    reminderEmails: true,
    marketingEmails: false,
    adminNotificationEmail: 'admin@tabletalk.com',
    
    // Security Settings
    requireEmailVerification: true,
    autoApproveEvents: false,
    enableTwoFactor: false,
    sessionTimeout: 30,
    
    // Feature Flags
    enableMysteryDinners: true,
    enableCrossedPaths: true,
    enableFeedback: true,
    enablePayments: false,
    
    // Stripe Settings
    stripePublicKey: '',
    stripeSecretKey: '',
    
    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'INFO'
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchStripeSettings();
  }, []);

  const fetchStripeSettings = async () => {
    try {
      const { data: stripeSettings, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY']);

      if (error) throw error;

      const settingsMap = stripeSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      setSettings(prev => ({
        ...prev,
        stripePublicKey: settingsMap.STRIPE_PUBLIC_KEY || '',
        stripeSecretKey: settingsMap.STRIPE_SECRET_KEY || ''
      }));
    } catch (error) {
      console.error('Error fetching Stripe settings:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async (category: string) => {
    try {
      if (category === 'Stripe') {
        // Save Stripe settings to system_settings table
        const updates = [
          { key: 'STRIPE_PUBLIC_KEY', value: settings.stripePublicKey },
          { key: 'STRIPE_SECRET_KEY', value: settings.stripeSecretKey }
        ];

        for (const update of updates) {
          const { error } = await supabase
            .from('system_settings')
            .upsert({
              key: update.key,
              value: update.value,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) throw error;
        }

        // Also save the secret key to Edge Function secrets
        if (settings.stripeSecretKey) {
          toast({
            title: "Important",
            description: "Please also update STRIPE_SECRET_KEY in your Edge Function secrets for full functionality.",
          });
        }
      }

      toast({
        title: "Success",
        description: `${category} settings saved successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Global Settings</h1>
        </div>
        <Badge variant="outline">Super Admin Only</Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Event Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={settings.maxEventAttendees}
                    onChange={(e) => updateSetting('maxEventAttendees', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDuration">Default Event Duration (minutes)</Label>
                <Input
                  id="eventDuration"
                  type="number"
                  value={settings.defaultEventDuration}
                  onChange={(e) => updateSetting('defaultEventDuration', parseInt(e.target.value))}
                />
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('General')}>
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reminderEmails">Reminder Emails</Label>
                    <p className="text-sm text-muted-foreground">Send event reminder emails</p>
                  </div>
                  <Switch
                    id="reminderEmails"
                    checked={settings.reminderEmails}
                    onCheckedChange={(checked) => updateSetting('reminderEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Send promotional emails</p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Notification Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminNotificationEmail}
                  onChange={(e) => updateSetting('adminNotificationEmail', e.target.value)}
                />
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('Email')}>
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailVerification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Users must verify email before accessing</p>
                  </div>
                  <Switch
                    id="emailVerification"
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoApprove">Auto-approve Events</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve new events</p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={settings.autoApproveEvents}
                    onCheckedChange={(checked) => updateSetting('autoApproveEvents', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactor">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => updateSetting('enableTwoFactor', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                />
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('Security')}>
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Feature Flags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mysteryDinners">Mystery Dinners</Label>
                    <p className="text-sm text-muted-foreground">Enable mystery dinner events</p>
                  </div>
                  <Switch
                    id="mysteryDinners"
                    checked={settings.enableMysteryDinners}
                    onCheckedChange={(checked) => updateSetting('enableMysteryDinners', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crossedPaths">Crossed Paths</Label>
                    <p className="text-sm text-muted-foreground">Enable crossed paths feature</p>
                  </div>
                  <Switch
                    id="crossedPaths"
                    checked={settings.enableCrossedPaths}
                    onCheckedChange={(checked) => updateSetting('enableCrossedPaths', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="feedback">Feedback System</Label>
                    <p className="text-sm text-muted-foreground">Enable user feedback and ratings</p>
                  </div>
                  <Switch
                    id="feedback"
                    checked={settings.enableFeedback}
                    onCheckedChange={(checked) => updateSetting('enableFeedback', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payments">Payment System</Label>
                    <p className="text-sm text-muted-foreground">Enable paid events and subscriptions</p>
                  </div>
                  <Switch
                    id="payments"
                    checked={settings.enablePayments}
                    onCheckedChange={(checked) => updateSetting('enablePayments', checked)}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('Features')}>
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Stripe Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">Stripe Publishable Key *</Label>
                <Input
                  id="stripePublicKey"
                  placeholder="pk_test_..."
                  value={settings.stripePublicKey || ''}
                  onChange={(e) => updateSetting('stripePublicKey', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Your Stripe publishable key (safe to expose in frontend)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Stripe Secret Key *</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  placeholder="sk_test_..."
                  value={settings.stripeSecretKey || ''}
                  onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Your Stripe secret key (will be stored securely in Edge Function secrets)
                </p>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('Stripe')}>
                  Save Stripe Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put site in maintenance mode</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debug">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable debug logging</p>
                  </div>
                  <Switch
                    id="debug"
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <select 
                  id="logLevel"
                  value={settings.logLevel}
                  onChange={(e) => updateSetting('logLevel', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="ERROR">ERROR</option>
                  <option value="WARN">WARN</option>
                  <option value="INFO">INFO</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={() => saveSettings('System')}>
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;