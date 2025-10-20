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

const CONFIG_KEY = 'equipos-dashboard-settings';

const defaultConfig = {
  alertaCritica: 15,
  alertaPreventiva: 50,
  permitirImportaciones: true,
  notificarEmail: true,
  notificarWhatsapp: false,
  modoOscuroAutomatico: true,
  correoSoporte: '',
};

type Config = typeof defaultConfig;

export default function Configuraciones() {
  const { toast } = useToast();
  const [config, setConfig] = useState<Config>(() => {
    if (typeof window === 'undefined') {
      return defaultConfig;
    }
    try {
      const stored = window.localStorage.getItem(CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed } as Config;
      }
    } catch (error) {
      console.error('Error parsing configuration', error);
    }
    return defaultConfig;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
  }, [config]);

  const umbrales = useMemo(() => ({
    critica: config.alertaCritica,
    preventiva: config.alertaPreventiva,
  }), [config.alertaCritica, config.alertaPreventiva]);

  const handleReset = () => {
    setConfig(defaultConfig);
    toast({
      title: 'Configuraciones restauradas',
      description: 'Se aplicaron los valores predeterminados del sistema.',
    });
  };

  return (
    <Layout title="Preferencias y automatizaciones">
      <Navigation />

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
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, alertaCritica: value }))}
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
                onValueChange={([value]) => setConfig((prev) => ({ ...prev, alertaPreventiva: value }))}
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
                onCheckedChange={(value) => setConfig((prev) => ({ ...prev, notificarEmail: value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Enviar alerta por WhatsApp</Label>
                <p className="text-sm text-muted-foreground">Ideal para avisos rápidos al supervisor.</p>
              </div>
              <Switch
                checked={config.notificarWhatsapp}
                onCheckedChange={(value) => setConfig((prev) => ({ ...prev, notificarWhatsapp: value }))}
              />
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-semibold">Correo de soporte</Label>
              <Input
                placeholder="soporte@empresa.com"
                value={config.correoSoporte}
                onChange={(event) => setConfig((prev) => ({ ...prev, correoSoporte: event.target.value }))}
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
              onCheckedChange={(value) => setConfig((prev) => ({ ...prev, modoOscuroAutomatico: value }))}
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
              onCheckedChange={(value) => setConfig((prev) => ({ ...prev, permitirImportaciones: value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset}>
              Restaurar valores por defecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
