"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/system-settings');
      setSettings(response.data.data.settingsMap || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));
      
      await axios.patch('/api/system-settings', { settings: settingsArray });
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const settingGroups = [
    {
      title: 'General Settings',
      settings: [
        { key: 'system_name', label: 'System Name', type: 'text' },
        { key: 'default_currency', label: 'Default Currency', type: 'text' },
      ],
    },
    {
      title: 'Tender Settings',
      settings: [
        { key: 'tender_default_duration_days', label: 'Default Tender Duration (Days)', type: 'number' },
        { key: 'bid_submission_deadline_hours', label: 'Bid Submission Deadline (Hours)', type: 'number' },
      ],
    },
    {
      title: 'File Upload Settings',
      settings: [
        { key: 'max_file_size_mb', label: 'Max File Size (MB)', type: 'number' },
      ],
    },
    {
      title: 'Notification Settings',
      settings: [
        { key: 'email_notifications_enabled', label: 'Email Notifications Enabled', type: 'boolean' },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={20} className="mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-6">
            {settingGroups.map((group) => (
              <div key={group.title} className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
                <div className="space-y-4">
                  {group.settings.map((setting) => (
                    <div key={setting.key}>
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      {setting.type === 'boolean' ? (
                        <Switch
                          id={setting.key}
                          checked={settings[setting.key] === 'true'}
                          onCheckedChange={(checked: boolean) => handleSettingChange(setting.key, checked.toString())}
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          type={setting.type}
                          value={settings[setting.key] || ''}
                          onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
