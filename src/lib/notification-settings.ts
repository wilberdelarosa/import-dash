import { supabase } from '@/integrations/supabase/client';

export interface NotificationSettings {
  alertaCritica: number;
  alertaPreventiva: number;
  permitirImportaciones: boolean;
  notificarEmail: boolean;
  notificarWhatsapp: boolean;
  modoOscuroAutomatico: boolean;
  correoSoporte: string;
}

export const defaultNotificationSettings: NotificationSettings = {
  alertaCritica: 15,
  alertaPreventiva: 50,
  permitirImportaciones: true,
  notificarEmail: true,
  notificarWhatsapp: false,
  modoOscuroAutomatico: true,
  correoSoporte: '',
};

const NOTIFICATION_SETTINGS_KEY = 'notificaciones';

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from('configuraciones')
    .select('valor')
    .eq('clave', NOTIFICATION_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const remote = (data?.valor as Partial<NotificationSettings>) ?? {};
  return { ...defaultNotificationSettings, ...remote };
}

export async function persistNotificationSettings(settings: NotificationSettings) {
  const payload = {
    clave: NOTIFICATION_SETTINGS_KEY,
    valor: settings,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('configuraciones')
    .upsert(payload, { onConflict: 'clave' });

  if (error) {
    throw error;
  }

  return settings;
}
