import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Settings2, Bell, MoonStar } from 'lucide-react';
import { useNotificationSettingsState } from '@/hooks/useNotificationSettings';
import { defaultNotificationSettings } from '@/lib/notification-settings';

export default function Configuraciones() {
  const { toast } = useToast();
  const { settings, loading: loadingSettings, saveSettings } = useNotificationSettingsState();
  const [config, setConfig] = useState(defaultNotificationSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(settings);
  }, [settings]);

  const umbrales = useMemo(() => ({
    critica: config.alertaCritica,
    preventiva: config.alertaPreventiva,
  }), [config.alertaCritica, config.alertaPreventiva]);

  const handleChange = <Key extends keyof typeof config>(key: Key, value: (typeof config)[Key]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (nextConfig = config) => {
    try {
      setSaving(true);
      await saveSettings(nextConfig);
      toast({
        title: 'Preferencias guardadas',
        description: 'Se actualizaron las automatizaciones y alertas.',
      });
    } catch (error) {
      console.error('Error saving settings', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setConfig(defaultNotificationSettings);
    await handleSave(defaultNotificationSettings);
  };

  if (loadingSettings) {
    return (
      <Layout title="Preferencias y automatizaciones">
        <Navigation />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Cargando configuraciones...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Preferencias y automatizaciones">
      <Navigation />

      <div className="flex justify-end mb-4">
        <Button onClick={() => handleSave()} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

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
                value={[config.alertaCritica]}
                min={5}
                max={100}
                step={5}
                onValueChange={([value]) => handleChange('alertaCritica', value)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Se resaltarán en rojo los equipos con {config.alertaCritica} o menos horas/km restantes.
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Alerta preventiva (horas/km restantes)</Label>
              <Slider
                className="mt-4"
                value={[config.alertaPreventiva]}
                min={10}
                max={200}
                step={10}
                onValueChange={([value]) => handleChange('alertaPreventiva', value)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Los mantenimientos se marcarán en amarillo cuando resten {config.alertaPreventiva} horas/km.
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
                checked={config.notificarEmail}
                onCheckedChange={(value) => handleChange('notificarEmail', Boolean(value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Enviar alerta por WhatsApp</Label>
                <p className="text-sm text-muted-foreground">Ideal para avisos rápidos al supervisor.</p>
              </div>
              <Switch
                checked={config.notificarWhatsapp}
                onCheckedChange={(value) => handleChange('notificarWhatsapp', Boolean(value))}
              />
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-semibold">Correo de soporte</Label>
              <Input
                placeholder="soporte@empresa.com"
                value={config.correoSoporte}
                onChange={(event) => handleChange('correoSoporte', event.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Se usará como remitente en las notificaciones automáticas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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
              checked={config.modoOscuroAutomatico}
              onCheckedChange={(value) => handleChange('modoOscuroAutomatico', Boolean(value))}
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
              checked={config.permitirImportaciones}
              onCheckedChange={(value) => handleChange('permitirImportaciones', Boolean(value))}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Restaurar valores por defecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
