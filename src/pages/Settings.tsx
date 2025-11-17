import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Mail, Globe, Bell, Shield, Database, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Settings() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'EEU Complaint Management System',
    timezone: 'Africa/Addis_Ababa',
    language: 'en',
    dateFormat: 'dd/MM/yyyy',
    
    // Email Settings
    emailEnabled: true,
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    emailUsername: 'notifications@eeu.gov.et',
    emailFrom: 'EEU CMS <notifications@eeu.gov.et>',
    
    // Notification Settings
    notifyOnNewComplaint: true,
    notifyOnAssignment: true,
    notifyOnStatusChange: true,
    notifyOnResolution: true,
    
    // Auto-Assignment
    autoAssignment: true,
    assignByRegion: true,
    assignByWorkload: true,
    
    // Security
    sessionTimeout: '30',
    passwordExpiry: '90',
    maxLoginAttempts: '5',
    twoFactorEnabled: false,
    
    // Data Retention
    archiveAfterDays: '365',
    deleteAfterDays: '730',
    backupEnabled: true,
    backupFrequency: 'daily'
  });

  const canManageSettings = userRole === 'admin';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/system-settings?key=app_settings');
      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading settings:', data.error);
        return;
      }

      if (data.success && data.data?.value) {
        let settingsData = data.data.value;

        // Parse JSON string if needed
        if (typeof settingsData === 'string') {
          try {
            settingsData = JSON.parse(settingsData);
          } catch (parseError) {
            console.warn('Warning: settings data is not valid JSON, using defaults:', parseError.message);
            // If parsing fails, use default settings (already set in state)
            console.log('Using default settings due to parsing error');
            return;
          }
        }

        if (typeof settingsData === 'object' && !Array.isArray(settingsData)) {
          setSettings(prev => ({ ...prev, ...(settingsData as Record<string, any>) }));
        }
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async (section: string) => {
    if (!canManageSettings) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can modify system settings',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'app_settings',
          value: settings,
          updated_by: 'admin'
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to save settings');
      if (!data.success) throw new Error('Failed to save settings');

      toast({
        title: 'Settings saved',
        description: `${section} settings have been updated successfully`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>
      </div>

      {!canManageSettings && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You are viewing settings in read-only mode. Only administrators can modify system settings.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={settings.systemName}
                  onChange={(e) => updateSetting('systemName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Addis_Ababa">Africa/Addis Ababa (GMT+3)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Default Language</Label>
                <Select value={settings.language} onValueChange={(v) => updateSetting('language', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="am">Amharic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(v) => updateSetting('dateFormat', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <Button onClick={() => handleSave('General')} disabled={loading || !canManageSettings}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable email notifications</p>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(v) => updateSetting('emailEnabled', v)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="emailHost">SMTP Host</Label>
                <Input
                  id="emailHost"
                  value={settings.emailHost}
                  onChange={(e) => updateSetting('emailHost', e.target.value)}
                  disabled={!settings.emailEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPort">SMTP Port</Label>
                <Input
                  id="emailPort"
                  value={settings.emailPort}
                  onChange={(e) => updateSetting('emailPort', e.target.value)}
                  disabled={!settings.emailEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailUsername">Username</Label>
                <Input
                  id="emailUsername"
                  value={settings.emailUsername}
                  onChange={(e) => updateSetting('emailUsername', e.target.value)}
                  disabled={!settings.emailEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFrom">From Address</Label>
                <Input
                  id="emailFrom"
                  value={settings.emailFrom}
                  onChange={(e) => updateSetting('emailFrom', e.target.value)}
                  disabled={!settings.emailEnabled}
                />
              </div>

              <Separator />
              <Button onClick={() => handleSave('Email')} disabled={loading || !canManageSettings}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure when to send notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Complaint Created</Label>
                  <p className="text-sm text-muted-foreground">Notify when a new complaint is created</p>
                </div>
                <Switch
                  checked={settings.notifyOnNewComplaint}
                  onCheckedChange={(v) => updateSetting('notifyOnNewComplaint', v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Complaint Assignment</Label>
                  <p className="text-sm text-muted-foreground">Notify when a complaint is assigned</p>
                </div>
                <Switch
                  checked={settings.notifyOnAssignment}
                  onCheckedChange={(v) => updateSetting('notifyOnAssignment', v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change</Label>
                  <p className="text-sm text-muted-foreground">Notify when complaint status changes</p>
                </div>
                <Switch
                  checked={settings.notifyOnStatusChange}
                  onCheckedChange={(v) => updateSetting('notifyOnStatusChange', v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Complaint Resolution</Label>
                  <p className="text-sm text-muted-foreground">Notify when a complaint is resolved</p>
                </div>
                <Switch
                  checked={settings.notifyOnResolution}
                  onCheckedChange={(v) => updateSetting('notifyOnResolution', v)}
                />
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Auto-Assignment Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Auto-Assignment</Label>
                      <p className="text-sm text-muted-foreground">Automatically assign complaints to staff</p>
                    </div>
                    <Switch
                      checked={settings.autoAssignment}
                      onCheckedChange={(v) => updateSetting('autoAssignment', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assign by Region</Label>
                      <p className="text-sm text-muted-foreground">Match staff to complaint region</p>
                    </div>
                    <Switch
                      checked={settings.assignByRegion}
                      onCheckedChange={(v) => updateSetting('assignByRegion', v)}
                      disabled={!settings.autoAssignment}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assign by Workload</Label>
                      <p className="text-sm text-muted-foreground">Balance workload across staff</p>
                    </div>
                    <Switch
                      checked={settings.assignByWorkload}
                      onCheckedChange={(v) => updateSetting('assignByWorkload', v)}
                      disabled={!settings.autoAssignment}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              <Button onClick={() => handleSave('Notifications')} disabled={loading || !canManageSettings}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) => updateSetting('passwordExpiry', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting('maxLoginAttempts', e.target.value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(v) => updateSetting('twoFactorEnabled', v)}
                />
              </div>

              <Separator />
              <Button onClick={() => handleSave('Security')} disabled={loading || !canManageSettings}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Configure data retention and backup policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="archiveAfterDays">Archive complaints after (days)</Label>
                <Input
                  id="archiveAfterDays"
                  type="number"
                  value={settings.archiveAfterDays}
                  onChange={(e) => updateSetting('archiveAfterDays', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Resolved complaints will be archived after this period
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteAfterDays">Delete archived data after (days)</Label>
                <Input
                  id="deleteAfterDays"
                  type="number"
                  value={settings.deleteAfterDays}
                  onChange={(e) => updateSetting('deleteAfterDays', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Archived data will be permanently deleted after this period
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automated Backups</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(v) => updateSetting('backupEnabled', v)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(v) => updateSetting('backupFrequency', v)}
                  disabled={!settings.backupEnabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <Button onClick={() => handleSave('Data Management')} disabled={loading || !canManageSettings}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
