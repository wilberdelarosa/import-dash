import { useCallback, useEffect, useState } from 'react';
import {
  NotificationSettings,
  defaultNotificationSettings,
  fetchNotificationSettings,
  persistNotificationSettings,
} from '@/lib/notification-settings';

export function useNotificationSettingsState() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const remote = await fetchNotificationSettings();
      setSettings(remote);
      setError(null);
    } catch (err) {
      console.error('Error fetching notification settings', err);
      setError(err instanceof Error ? err : new Error('Error al cargar configuraciones'));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (next: NotificationSettings) => {
    await persistNotificationSettings(next);
    setSettings(next);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    setSettings,
    loading,
    error,
    loadSettings,
    saveSettings,
  };
}
