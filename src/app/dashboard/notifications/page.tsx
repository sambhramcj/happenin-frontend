"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface NotificationPreferences {
  in_app_enabled: boolean;
  in_app_history: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  fest_mode_enabled: boolean;
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Notification preferences saved");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="text-center">
          <Icons.AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
          <p className="text-text-muted">Failed to load preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
          >
            <Icons.ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notification Preferences</h1>
            <p className="text-text-secondary text-sm">
              Manage how you receive notifications
            </p>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icons.Clock className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-text-primary">In-App Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Enable In-App Notifications</p>
                <p className="text-sm text-text-secondary">Show reference notifications in app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={(e) => updatePreference("in_app_enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Keep Notification History</p>
                <p className="text-sm text-text-secondary">Store past notifications for 90 days</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.in_app_history}
                onChange={(e) => updatePreference("in_app_history", e.target.checked)}
                disabled={!preferences.in_app_enabled}
                className="w-5 h-5 text-primary rounded disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icons.Moon className="h-6 w-6 text-purple-500" />
            <h2 className="text-lg font-semibold text-text-primary">Quiet Hours</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Enable Quiet Hours</p>
                <p className="text-sm text-text-secondary">Mute non-urgent notifications during sleep</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) => updatePreference("quiet_hours_enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start || "22:00"}
                    onChange={(e) => updatePreference("quiet_hours_start", e.target.value)}
                    className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end || "08:00"}
                    onChange={(e) => updatePreference("quiet_hours_end", e.target.value)}
                    className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-text-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fest Mode */}
        <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icons.Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold text-text-primary">Fest Mode</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Enable Fest Mode Batching</p>
              <p className="text-sm text-text-secondary">
                Group non-urgent notifications during fest week
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.fest_mode_enabled}
                onChange={(e) => updatePreference("fest_mode_enabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primaryHover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Icons.Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icons.Check className="h-5 w-5" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
