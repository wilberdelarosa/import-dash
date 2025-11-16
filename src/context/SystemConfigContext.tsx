/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SYSTEM_CONFIG, SystemConfig } from '@/types/config';
import { toast } from '@/hooks/use-toast';

interface SystemConfigContextValue {
  config: SystemConfig;
  loading: boolean;
  saving: boolean;
  refresh: () => Promise<void>;
  updateConfig: (changes: Partial<SystemConfig>) => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextValue | undefined>(undefined);

const mapRowToConfig = (row: any): SystemConfig => ({
  id: Number(row.id ?? DEFAULT_SYSTEM_CONFIG.id),
  alertaCritica: Number(row.alerta_critica ?? DEFAULT_SYSTEM_CONFIG.alertaCritica),
  alertaPreventiva: Number(row.alerta_preventiva ?? DEFAULT_SYSTEM_CONFIG.alertaPreventiva),
  permitirImportaciones: Boolean(
    row.permitir_importaciones ?? DEFAULT_SYSTEM_CONFIG.permitirImportaciones,
  ),
  notificarEmail: Boolean(row.notificar_email ?? DEFAULT_SYSTEM_CONFIG.notificarEmail),
  notificarWhatsapp: Boolean(row.notificar_whatsapp ?? DEFAULT_SYSTEM_CONFIG.notificarWhatsapp),
  notificarDispositivo: Boolean(
    row.notificar_dispositivo ?? DEFAULT_SYSTEM_CONFIG.notificarDispositivo,
  ),
  correoSoporte: row.correo_soporte ?? DEFAULT_SYSTEM_CONFIG.correoSoporte,
  correoNotificaciones: row.correo_notificaciones ?? DEFAULT_SYSTEM_CONFIG.correoNotificaciones,
  telefonoWhatsapp: row.telefono_whatsapp ?? DEFAULT_SYSTEM_CONFIG.telefonoWhatsapp,
  modoOscuroAutomatico: Boolean(
    row.modo_oscuro_automatico ?? DEFAULT_SYSTEM_CONFIG.modoOscuroAutomatico,
  ),
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const mapConfigToRow = (config: SystemConfig) => ({
  id: config.id,
  alerta_critica: config.alertaCritica,
  alerta_preventiva: config.alertaPreventiva,
  permitir_importaciones: config.permitirImportaciones,
  notificar_email: config.notificarEmail,
  notificar_whatsapp: config.notificarWhatsapp,
  notificar_dispositivo: config.notificarDispositivo,
  correo_soporte: config.correoSoporte || null,
  correo_notificaciones: config.correoNotificaciones || null,
  telefono_whatsapp: config.telefonoWhatsapp || null,
  modo_oscuro_automatico: config.modoOscuroAutomatico,
});

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initializedRef = useRef(false);
  const configRef = useRef<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const configErrorNoticeShownRef = useRef(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuraciones_sistema')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const mapped = mapRowToConfig(data);
        configRef.current = mapped;
        setConfig(mapped);
      } else {
        configRef.current = DEFAULT_SYSTEM_CONFIG;
        setConfig(DEFAULT_SYSTEM_CONFIG);
      }
    } catch (error) {
      console.error('Error loading system configuration', error);
      if (!configErrorNoticeShownRef.current) {
        toast({
          title: 'No se pudo cargar la configuración del sistema',
          description:
            'Verifica las variables. Se aplicarán los valores predeterminados hasta restablecer la conexión.',
          variant: 'destructive',
        });
        configErrorNoticeShownRef.current = true;
      }
      configRef.current = DEFAULT_SYSTEM_CONFIG;
      setConfig(DEFAULT_SYSTEM_CONFIG);
    } finally {
      setLoading(false);
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(
    async (changes: Partial<SystemConfig>) => {
      if (!initializedRef.current) return;

      const nextConfig = { ...configRef.current, ...changes };
      configRef.current = nextConfig;
      setConfig(nextConfig);

      setSaving(true);
      try {
        const payload = mapConfigToRow(nextConfig);
        const { data, error } = await supabase
          .from('configuraciones_sistema')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          const mapped = mapRowToConfig(data);
          configRef.current = mapped;
          setConfig(mapped);
        }
      } catch (error) {
        console.error('Error updating system configuration', error);
        toast({
          title: 'Error al guardar cambios',
          description: 'No se pudieron guardar las preferencias. Intenta nuevamente.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const value = useMemo<SystemConfigContextValue>(
    () => ({
      config,
      loading,
      saving,
      refresh: fetchConfig,
      updateConfig,
    }),
    [config, fetchConfig, loading, saving, updateConfig],
  );

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}
