/**
 * Configuraciones Móvil - Nueva Vista Optimizada
 * 
 * Características:
 * - Diseño touch-friendly con controles grandes
 * - Glassmorphism y diseño premium
 * - Sliders optimizados para dedos
 * - Switches grandes y fáciles de tocar
 * - Organización por secciones expandibles
 */

import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Bell, MoonStar, Mail, MessageSquare, Smartphone, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { DEFAULT_SYSTEM_CONFIG } from '@/types/config';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function ConfiguracionesMobile() {
    const { config, loading, saving, updateConfig } = useSystemConfig();
    const [draft, setDraft] = useState(config);
    const { permission, supported, requestPermission } = useNotifications();
    const { toast } = useToast();

    const [alertasExpanded, setAlertasExpanded] = useState(true);
    const [notificacionesExpanded, setNotificacionesExpanded] = useState(false);
    const [aparienciaExpanded, setAparienciaExpanded] = useState(false);

    const scheduleUpdate = (partial: Partial<typeof draft>) => {
        const next = { ...draft, ...partial };
        setDraft(next);
        updateConfig(next);
    };

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
                description: 'Habilita las notificaciones del navegador para recibir alertas.',
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

    const handleReset = () => {
        updateConfig(DEFAULT_SYSTEM_CONFIG);
        setDraft(DEFAULT_SYSTEM_CONFIG);
        toast({
            title: 'Configuración restaurada',
            description: 'Se han restaurado los valores por defecto.',
        });
    };

    if (loading) {
        return (
            <MobileLayout title="Configuraciones">
                <div className="flex items-center justify-center h-64">
                    <div className="text-sm text-muted-foreground">Cargando preferencias...</div>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="Configuraciones">
            <div className="space-y-4 pb-24">
                {/* Reglas de Alertas - Expandible */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50 transition-colors"
                        onClick={() => setAlertasExpanded(!alertasExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Settings2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Reglas de alertas</h3>
                                <p className="text-xs text-muted-foreground">Umbrales de mantenimiento</p>
                            </div>
                        </div>
                        {alertasExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>

                    {alertasExpanded && (
                        <div className="px-4 pb-4 space-y-6 animate-fade-in">
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Alerta crítica</Label>
                                <div className="flex items-center gap-3 mb-3">
                                    <Slider
                                        className="flex-1"
                                        value={[draft.alertaCritica]}
                                        min={5}
                                        max={100}
                                        step={5}
                                        onValueChange={([value]) => scheduleUpdate({ alertaCritica: value })}
                                    />
                                    <Badge variant="destructive" className="text-base font-bold min-w-[60px] text-center">
                                        {draft.alertaCritica}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Equipos con {draft.alertaCritica} o menos horas/km se marcarán en rojo
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Alerta preventiva</Label>
                                <div className="flex items-center gap-3 mb-3">
                                    <Slider
                                        className="flex-1"
                                        value={[draft.alertaPreventiva]}
                                        min={10}
                                        max={200}
                                        step={10}
                                        onValueChange={([value]) => scheduleUpdate({ alertaPreventiva: value })}
                                    />
                                    <Badge className="bg-amber-500 text-base font-bold min-w-[60px] text-center">
                                        {draft.alertaPreventiva}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Se marcarán en amarillo cuando resten {draft.alertaPreventiva} horas/km
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notificaciones - Expandible */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50 transition-colors"
                        onClick={() => setNotificacionesExpanded(!notificacionesExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Notificaciones</h3>
                                <p className="text-xs text-muted-foreground">Canales de alerta</p>
                            </div>
                        </div>
                        {notificacionesExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>

                    {notificacionesExpanded && (
                        <div className="px-4 pb-4 space-y-5 animate-fade-in">
                            {/* Email */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="text-sm font-semibold block">Email</Label>
                                        <p className="text-xs text-muted-foreground truncate">Notificar por correo</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={draft.notificarEmail}
                                    onCheckedChange={(value) => scheduleUpdate({ notificarEmail: value })}
                                    className="scale-110"
                                />
                            </div>

                            {/* WhatsApp */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <MessageSquare className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="text-sm font-semibold block">WhatsApp</Label>
                                        <p className="text-xs text-muted-foreground truncate">Alertas rápidas</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={draft.notificarWhatsapp}
                                    onCheckedChange={(value) => scheduleUpdate({ notificarWhatsapp: value })}
                                    className="scale-110"
                                />
                            </div>

                            {/* Dispositivo */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <Smartphone className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Label className="text-sm font-semibold block">Push</Label>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {permission === 'granted' ? 'Activo' : permission === 'denied' ? 'Bloqueado' : 'Inactivo'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={draft.notificarDispositivo}
                                    onCheckedChange={handleDeviceToggle}
                                    className="scale-110"
                                />
                            </div>

                            {/* Campos de configuración */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                        Correo de soporte
                                    </Label>
                                    <Input
                                        placeholder="soporte@empresa.com"
                                        value={draft.correoSoporte}
                                        onChange={(e) => scheduleUpdate({ correoSoporte: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                        Correo para alertas
                                    </Label>
                                    <Input
                                        placeholder="alertas@empresa.com"
                                        value={draft.correoNotificaciones}
                                        onChange={(e) => scheduleUpdate({ correoNotificaciones: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                        Teléfono WhatsApp
                                    </Label>
                                    <Input
                                        placeholder="+1 809 000 0000"
                                        value={draft.telefonoWhatsapp}
                                        onChange={(e) => scheduleUpdate({ telefonoWhatsapp: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            {saving && (
                                <p className="text-xs text-primary text-center animate-pulse">Guardando cambios...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Apariencia - Expandible */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50 transition-colors"
                        onClick={() => setAparienciaExpanded(!aparienciaExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <MoonStar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Apariencia</h3>
                                <p className="text-xs text-muted-foreground">Tema y preferencias</p>
                            </div>
                        </div>
                        {aparienciaExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>

                    {aparienciaExpanded && (
                        <div className="px-4 pb-4 space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between py-2">
                                <div className="flex-1">
                                    <Label className="text-sm font-semibold block">Modo oscuro automático</Label>
                                    <p className="text-xs text-muted-foreground mt-1">Según preferencias del sistema</p>
                                </div>
                                <Switch
                                    checked={draft.modoOscuroAutomatico}
                                    onCheckedChange={(value) => scheduleUpdate({ modoOscuroAutomatico: value })}
                                    className="scale-110"
                                />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex-1">
                                    <Label className="text-sm font-semibold block">Permitir importaciones</Label>
                                    <p className="text-xs text-muted-foreground mt-1">Subir archivos JSON</p>
                                </div>
                                <Switch
                                    checked={draft.permitirImportaciones}
                                    onCheckedChange={(value) => scheduleUpdate({ permitirImportaciones: value })}
                                    className="scale-110"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón de reset */}
                <Button
                    variant="outline"
                    className="w-full h-12 gap-2 text-base font-semibold border-2 active:scale-95 transition-all"
                    onClick={handleReset}
                >
                    <RotateCcw className="h-5 w-5" />
                    Restaurar valores por defecto
                </Button>
            </div>
        </MobileLayout>
    );
}
