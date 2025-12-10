import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings2, Bell, MoonStar, Shield, Database, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminSection } from '@/components/admin/AdminSection';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { DEFAULT_SYSTEM_CONFIG } from '@/types/config';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ConfiguracionesMobile } from '@/pages/mobile/ConfiguracionesMobile';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { supabase } from '@/integrations/supabase/client';

export default function Configuraciones() {
  const { config, loading, saving, updateConfig } = useSystemConfig();
  const [draft, setDraft] = useState(config);
  const draftRef = useRef(draft);
  const timeoutRef = useRef<number>();
  const { permission, supported, requestPermission } = useNotifications();
  const { toast } = useToast();
  const { isMobile } = useDeviceDetection();
  const { data: contextData } = useSupabaseDataContext();
  const [exportingDb, setExportingDb] = useState(false);
  const { isAdmin } = useUserRoles();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    setDraft(config);
    draftRef.current = config;
  }, [config]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const scheduleUpdate = (partial: Partial<typeof draft>) => {
    const next = { ...draftRef.current, ...partial };
    draftRef.current = next;
    setDraft(next);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      updateConfig(next);
    }, 400);
  };

  const umbrales = useMemo(() => ({
    critica: draft.alertaCritica,
    preventiva: draft.alertaPreventiva,
  }), [draft.alertaCritica, draft.alertaPreventiva]);

  const handleReset = () => {
    updateConfig(DEFAULT_SYSTEM_CONFIG);
  };

  // Exportar Base de Datos a JSON
  const handleExportDatabase = async () => {
    setExportingDb(true);
    try {
      const [
        { data: equipos },
        { data: mantenimientosProgramados },
        { data: historialEventos },
        { data: planesMantenimiento },
        { data: planIntervalos },
        { data: kitsMantenimiento },
        { data: kitPiezas },
        { data: planIntervaloKits },
        { data: overridesPlanes },
        { data: inventarios },
        { data: userRoles },
      ] = await Promise.all([
        supabase.from('equipos').select('*'),
        supabase.from('mantenimientos_programados').select('*'),
        supabase.from('historial_eventos').select('*'),
        supabase.from('planes_mantenimiento').select('*'),
        supabase.from('plan_intervalos').select('*'),
        supabase.from('kits_mantenimiento').select('*'),
        supabase.from('kit_piezas').select('*'),
        supabase.from('plan_intervalo_kits').select('*'),
        supabase.from('overrides_planes').select('*'),
        supabase.from('inventarios').select('*'),
        supabase.from('user_roles').select('*'),
      ]);

      const exportData = {
        metadata: { exportedAt: new Date().toISOString(), exportedBy: 'import-dash', version: '1.0.0' },
        data: { equipos: equipos || [], mantenimientosProgramados: mantenimientosProgramados || [], historialEventos: historialEventos || [], planesMantenimiento: planesMantenimiento || [], planIntervalos: planIntervalos || [], kitsMantenimiento: kitsMantenimiento || [], kitPiezas: kitPiezas || [], planIntervaloKits: planIntervaloKits || [], overridesPlanes: overridesPlanes || [], inventarios: inventarios || [], userRoles: userRoles || [] },
        summary: { equipos: equipos?.length || 0, mantenimientosProgramados: mantenimientosProgramados?.length || 0, historialEventos: historialEventos?.length || 0, planesMantenimiento: planesMantenimiento?.length || 0, planIntervalos: planIntervalos?.length || 0, kitsMantenimiento: kitsMantenimiento?.length || 0, kitPiezas: kitPiezas?.length || 0, planIntervaloKits: planIntervaloKits?.length || 0, overridesPlanes: overridesPlanes?.length || 0, inventarios: inventarios?.length || 0, userRoles: userRoles?.length || 0 },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `import-dash-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Exportación completada', description: `Se exportaron ${Object.values(exportData.summary).reduce((a, b) => a + b, 0)} registros.` });
    } catch (error) {
      console.error('Error exportando BD:', error);
      toast({ title: 'Error al exportar', description: 'No se pudo exportar. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setExportingDb(false);
    }
  };

  const deviceStatusMessage = useMemo(() => {
    if (!supported) {
      return 'Tu navegador no soporta notificaciones push.';
    }

    if (permission === 'granted') {
      return 'Permiso concedido. Recibirás alertas directamente en este dispositivo.';
    }

    if (permission === 'denied') {
      return 'El navegador está bloqueando las notificaciones. Actívalas en la configuración del sitio para recibir alertas.';
    }

    return 'Solicitaremos permiso del navegador cuando actives esta opción.';
  }, [permission, supported]);

  const handleDeviceToggle = async (value: boolean) => {
    if (!value) {
      scheduleUpdate({ notificarDispositivo: false });
      return;
    }

    if (!supported) {
      toast({
        title: 'No disponible',
        description: 'Este navegador no soporta notificaciones push.',
        variant: 'destructive',
      });
      scheduleUpdate({ notificarDispositivo: false });
      return;
    }

    if (permission === 'denied') {
      toast({
        title: 'Permiso bloqueado',
        description: 'Habilita las notificaciones del navegador para recibir alertas en este equipo.',
        variant: 'destructive',
      });
      scheduleUpdate({ notificarDispositivo: false });
      return;
    }

    if (permission === 'default') {
      const granted = await requestPermission();
      if (!granted) {
        scheduleUpdate({ notificarDispositivo: false });
        return;
      }
    }

    scheduleUpdate({ notificarDispositivo: true });
  };

  if (loading) {
    if (isMobile) {
      return (
        <div className="flex h-screen flex-col bg-background">
          <div className="flex items-center justify-center flex-1">
            <div className="text-sm text-muted-foreground">Cargando preferencias...</div>
          </div>
        </div>
      );
    }
    return (
      <Layout title="Preferencias y automatizaciones">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando preferencias...</div>
        </div>
      </Layout>
    );
  }

  // Renderizar versión móvil
  if (isMobile) {
    return <ConfiguracionesMobile />;
  }

  return (
    <Layout title="Preferencias y automatizaciones">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              <span>Administración</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Reglas de alertas
            </CardTitle>
            <CardDescription>Ajusta los umbrales para resaltar mantenimientos prioritarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Alerta crítica (horas/km restantes)</Label>
              <Slider
                className="mt-4"
                value={[draft.alertaCritica]}
                min={5}
                max={100}
                step={5}
                onValueChange={([value]) => scheduleUpdate({ alertaCritica: value })}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Se resaltarán en rojo los equipos con {draft.alertaCritica} o menos horas/km restantes.
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Alerta preventiva (horas/km restantes)</Label>
              <Slider
                className="mt-4"
                value={[draft.alertaPreventiva]}
                min={10}
                max={200}
                step={10}
                onValueChange={([value]) => scheduleUpdate({ alertaPreventiva: value })}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Los mantenimientos se marcarán en amarillo cuando resten {draft.alertaPreventiva} horas/km.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Badge variant="secondary">Resumen</Badge>
              <div className="text-sm text-muted-foreground">
                <p>Crítica: &lt;= {umbrales.critica} horas/km</p>
                <p>Preventiva: &lt;= {umbrales.preventiva} horas/km</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notificaciones automáticas
            </CardTitle>
            <CardDescription>Define a quién avisar cuando se alcance un umbral.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Enviar correo electrónico</Label>
                <p className="text-sm text-muted-foreground">Notifica al responsable asignado del equipo.</p>
              </div>
              <Switch
                checked={draft.notificarEmail}
                onCheckedChange={(value) => scheduleUpdate({ notificarEmail: value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Enviar alerta por WhatsApp</Label>
                <p className="text-sm text-muted-foreground">Ideal para avisos rápidos al supervisor.</p>
              </div>
              <Switch
                checked={draft.notificarWhatsapp}
                onCheckedChange={(value) => scheduleUpdate({ notificarWhatsapp: value })}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Notificaciones en este dispositivo</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas incluso cuando la app está en segundo plano (requiere permiso).
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <p
                    className={`text-xs ${!supported || permission === 'denied' ? 'text-destructive' : 'text-green-600'
                      }`}
                  >
                    {deviceStatusMessage}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    * Al activar, aceptas recibir notificaciones según nuestra política de privacidad.
                  </p>
                </div>
              </div>
              <Switch checked={draft.notificarDispositivo} onCheckedChange={(value) => void handleDeviceToggle(value)} />
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-semibold">Correo de soporte</Label>
              <Input
                placeholder="soporte@empresa.com"
                value={draft.correoSoporte}
                onChange={(event) => scheduleUpdate({ correoSoporte: event.target.value })}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Se usará como remitente en las notificaciones automáticas.
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Correo para notificaciones</Label>
              <Input
                placeholder="alertas@empresa.com"
                value={draft.correoNotificaciones}
                onChange={(event) => scheduleUpdate({ correoNotificaciones: event.target.value })}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Si está presente y el canal está habilitado, se enviarán correos con alertas importantes.
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Teléfono WhatsApp</Label>
              <Input
                placeholder="+1 809 000 0000"
                value={draft.telefonoWhatsapp}
                onChange={(event) => scheduleUpdate({ telefonoWhatsapp: event.target.value })}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Incluye el código de país para recibir avisos en tu móvil.
              </p>
            </div>
            {saving && (
              <p className="text-xs text-muted-foreground">Guardando cambios...</p>
            )}
          </CardContent>
        </Card>
      </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MoonStar className="h-5 w-5 text-primary" /> Preferencias de apariencia
              </CardTitle>
              <CardDescription>Elige cómo debe comportarse el modo oscuro del panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Activar modo oscuro automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Si está activo, el sistema respetará las preferencias del dispositivo del usuario.
                  </p>
                </div>
                <Switch
                  checked={draft.modoOscuroAutomatico}
                  onCheckedChange={(value) => scheduleUpdate({ modoOscuroAutomatico: value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Permitir importaciones manuales</Label>
                  <p className="text-sm text-muted-foreground">
                    Controla si los usuarios pueden subir archivos JSON desde cualquier módulo.
                  </p>
                </div>
                <Switch
                  checked={draft.permitirImportaciones}
                  onCheckedChange={(value) => scheduleUpdate({ permitirImportaciones: value })}
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Restaurar valores por defecto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exportar Base de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Exportar Base de Datos
              </CardTitle>
              <CardDescription>
                Descarga una copia completa de todos los datos del sistema en formato JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Recomendación de respaldo</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Se recomienda exportar la base de datos <strong>al menos una vez por semana</strong> o antes de cambios importantes.</p>
                  <p className="text-xs text-muted-foreground">El archivo incluye: equipos, mantenimientos, planes, kits, piezas, usuarios y configuraciones.</p>
                </AlertDescription>
              </Alert>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">Datos actuales en el sistema</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{contextData?.equipos?.length ?? 0} equipos</Badge>
                    <Badge variant="outline">{contextData?.mantenimientosProgramados?.length ?? 0} mant.</Badge>
                    <Badge variant="outline">{contextData?.mantenimientosRealizados?.length ?? 0} registros</Badge>
                  </div>
                </div>
                <Button onClick={handleExportDatabase} disabled={exportingDb} className="gap-2">
                  {exportingDb ? (<><Loader2 className="h-4 w-4 animate-spin" /> Exportando...</>) : (<><Download className="h-4 w-4" /> Exportar JSON</>)}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">El archivo se descargará como <code className="rounded bg-muted px-1">import-dash-backup-YYYY-MM-DD.json</code></p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <AdminSection />
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
}
