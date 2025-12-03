/**
 * Configuraciones Móvil - Vista Robusta y Completa
 * 
 * Características:
 * - Diseño touch-friendly con controles grandes
 * - Glassmorphism y diseño premium
 * - Selección de tipos de notificación
 * - Test de notificaciones push
 * - Indicadores de estado de canales
 * - Validación de campos
 */

import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings2, Bell, MoonStar, Mail, MessageSquare, Smartphone, 
  RotateCcw, ChevronDown, ChevronUp, CheckCircle2, XCircle, 
  AlertTriangle, Send, Loader2, Shield, Wrench, Package, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { DEFAULT_SYSTEM_CONFIG } from '@/types/config';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

// Tipos de notificación disponibles
const NOTIFICATION_TYPES = [
  { id: 'mantenimiento', label: 'Mantenimientos', icon: Wrench, description: 'Alertas de servicios próximos y vencidos' },
  { id: 'stock', label: 'Stock bajo', icon: Package, description: 'Alertas cuando el inventario está bajo' },
  { id: 'sistema', label: 'Sistema', icon: Info, description: 'Actualizaciones y avisos del sistema' },
];

export function ConfiguracionesMobile() {
  const { config, loading, saving, updateConfig } = useSystemConfig();
  const [draft, setDraft] = useState(config);
  const { permission, supported, requestPermission, addNotification } = useNotifications();
  const { toast } = useToast();

  const [alertasExpanded, setAlertasExpanded] = useState(true);
  const [notificacionesExpanded, setNotificacionesExpanded] = useState(true);
  const [tiposNotificacionExpanded, setTiposNotificacionExpanded] = useState(false);
  const [aparienciaExpanded, setAparienciaExpanded] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Tipos de notificación habilitados
  const [enabledTypes, setEnabledTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('notification-types-enabled');
    return saved ? JSON.parse(saved) : ['mantenimiento', 'stock', 'sistema'];
  });

  useEffect(() => {
    setDraft(config);
  }, [config]);

  useEffect(() => {
    localStorage.setItem('notification-types-enabled', JSON.stringify(enabledTypes));
  }, [enabledTypes]);

  const scheduleUpdate = (partial: Partial<typeof draft>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    updateConfig(next);
  };

  const toggleNotificationType = (typeId: string) => {
    setEnabledTypes(prev => 
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleDeviceToggle = async (value: boolean) => {
    if (!value) {
      scheduleUpdate({ notificarDispositivo: false });
      return;
    }
    if (!supported) {
      toast({ title: 'No disponible', description: 'Este navegador no soporta notificaciones push.', variant: 'destructive' });
      scheduleUpdate({ notificarDispositivo: false });
      return;
    }
    if (permission === 'denied') {
      toast({ title: 'Permiso bloqueado', description: 'Habilita las notificaciones en la configuración del navegador.', variant: 'destructive' });
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

  const handleTestPush = async () => {
    if (!supported || permission !== 'granted') {
      toast({ title: 'Activa las notificaciones primero', variant: 'destructive' });
      return;
    }
    setTestingPush(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    addNotification({ title: '🔔 Notificación de prueba', body: 'Las notificaciones push están funcionando.', type: 'success' });
    setTestingPush(false);
    toast({ title: '✅ Notificación enviada' });
  };

  const handleReset = () => {
    updateConfig(DEFAULT_SYSTEM_CONFIG);
    setDraft(DEFAULT_SYSTEM_CONFIG);
    setEnabledTypes(['mantenimiento', 'stock', 'sistema']);
    toast({ title: 'Configuración restaurada' });
  };

  const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => !phone || /^\+?[\d\s-]{10,}$/.test(phone);

  const getChannelStatus = (channel: 'email' | 'whatsapp' | 'push') => {
    if (channel === 'email') {
      if (!draft.notificarEmail) return { status: 'disabled', label: 'Desactivado', color: 'text-muted-foreground' };
      if (!draft.correoNotificaciones || !isValidEmail(draft.correoNotificaciones)) return { status: 'warning', label: 'Sin configurar', color: 'text-amber-500' };
      return { status: 'active', label: 'Activo', color: 'text-emerald-500' };
    }
    if (channel === 'whatsapp') {
      if (!draft.notificarWhatsapp) return { status: 'disabled', label: 'Desactivado', color: 'text-muted-foreground' };
      if (!draft.telefonoWhatsapp || !isValidPhone(draft.telefonoWhatsapp)) return { status: 'warning', label: 'Sin configurar', color: 'text-amber-500' };
      return { status: 'active', label: 'Activo', color: 'text-emerald-500' };
    }
    if (!supported) return { status: 'error', label: 'No soportado', color: 'text-destructive' };
    if (permission === 'denied') return { status: 'error', label: 'Bloqueado', color: 'text-destructive' };
    if (!draft.notificarDispositivo) return { status: 'disabled', label: 'Desactivado', color: 'text-muted-foreground' };
    if (permission !== 'granted') return { status: 'warning', label: 'Sin permiso', color: 'text-amber-500' };
    return { status: 'active', label: 'Activo', color: 'text-emerald-500' };
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'active') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    if (status === 'error') return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <div className="h-3.5 w-3.5 rounded-full bg-muted-foreground/30" />;
  };

  if (loading) {
    return (
      <MobileLayout title="Configuraciones">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Configuraciones">
      <div className="space-y-4 pb-24">
        {/* Estado de Canales */}
        <div className="glass-panel rounded-2xl p-4 border border-border/40 shadow-premium">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div><h3 className="font-semibold text-sm">Estado de Canales</h3><p className="text-xs text-muted-foreground">Resumen de notificaciones</p></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['email', 'whatsapp', 'push'] as const).map(channel => {
              const { status, label, color } = getChannelStatus(channel);
              return (
                <div key={channel} className="flex flex-col items-center p-2 rounded-lg bg-accent/30">
                  <StatusIcon status={status} />
                  <span className="text-[10px] font-medium mt-1 capitalize">{channel === 'push' ? 'Push' : channel}</span>
                  <span className={cn("text-[9px]", color)}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reglas de Alertas */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
          <div className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50" onClick={() => setAlertasExpanded(!alertasExpanded)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-sm">Reglas de alertas</h3><p className="text-xs text-muted-foreground">Umbrales de mantenimiento</p></div>
            </div>
            {alertasExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
          {alertasExpanded && (
            <div className="px-4 pb-4 space-y-6 animate-fade-in">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Alerta crítica</Label>
                <div className="flex items-center gap-3 mb-3">
                  <Slider className="flex-1" value={[draft.alertaCritica]} min={5} max={100} step={5} onValueChange={([v]) => scheduleUpdate({ alertaCritica: v })} />
                  <Badge variant="destructive" className="text-base font-bold min-w-[60px] text-center">{draft.alertaCritica}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Equipos con {draft.alertaCritica} o menos horas/km se marcarán en rojo</p>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Alerta preventiva</Label>
                <div className="flex items-center gap-3 mb-3">
                  <Slider className="flex-1" value={[draft.alertaPreventiva]} min={10} max={200} step={10} onValueChange={([v]) => scheduleUpdate({ alertaPreventiva: v })} />
                  <Badge className="bg-amber-500 text-base font-bold min-w-[60px] text-center">{draft.alertaPreventiva}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Se marcarán en amarillo cuando resten {draft.alertaPreventiva} horas/km</p>
              </div>
            </div>
          )}
        </div>

        {/* Canales */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
          <div className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50" onClick={() => setNotificacionesExpanded(!notificacionesExpanded)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Bell className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-sm">Canales de notificación</h3><p className="text-xs text-muted-foreground">Email, WhatsApp, Push</p></div>
            </div>
            {notificacionesExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
          {notificacionesExpanded && (
            <div className="px-4 pb-4 space-y-4 animate-fade-in">
              {/* Email */}
              <div className="space-y-3 p-3 rounded-xl bg-accent/20 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10"><Mail className="h-4 w-4 text-blue-600" /></div>
                    <div><Label className="text-sm font-semibold block">Email</Label><div className="flex items-center gap-1"><StatusIcon status={getChannelStatus('email').status} /><span className={cn("text-xs", getChannelStatus('email').color)}>{getChannelStatus('email').label}</span></div></div>
                  </div>
                  <Switch checked={draft.notificarEmail} onCheckedChange={(v) => scheduleUpdate({ notificarEmail: v })} className="scale-110" />
                </div>
                {draft.notificarEmail && (
                  <div className="space-y-2 animate-fade-in">
                    <Input placeholder="alertas@empresa.com" value={draft.correoNotificaciones} onChange={(e) => scheduleUpdate({ correoNotificaciones: e.target.value })} className={cn("h-10", !isValidEmail(draft.correoNotificaciones) && draft.correoNotificaciones && "border-destructive")} />
                    {!isValidEmail(draft.correoNotificaciones) && draft.correoNotificaciones && <p className="text-xs text-destructive">Email inválido</p>}
                  </div>
                )}
              </div>
              {/* WhatsApp */}
              <div className="space-y-3 p-3 rounded-xl bg-accent/20 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10"><MessageSquare className="h-4 w-4 text-green-600" /></div>
                    <div><Label className="text-sm font-semibold block">WhatsApp</Label><div className="flex items-center gap-1"><StatusIcon status={getChannelStatus('whatsapp').status} /><span className={cn("text-xs", getChannelStatus('whatsapp').color)}>{getChannelStatus('whatsapp').label}</span></div></div>
                  </div>
                  <Switch checked={draft.notificarWhatsapp} onCheckedChange={(v) => scheduleUpdate({ notificarWhatsapp: v })} className="scale-110" />
                </div>
                {draft.notificarWhatsapp && (
                  <div className="space-y-2 animate-fade-in">
                    <Input placeholder="+1 809 000 0000" value={draft.telefonoWhatsapp} onChange={(e) => scheduleUpdate({ telefonoWhatsapp: e.target.value })} className={cn("h-10", !isValidPhone(draft.telefonoWhatsapp) && draft.telefonoWhatsapp && "border-destructive")} />
                    {!isValidPhone(draft.telefonoWhatsapp) && draft.telefonoWhatsapp && <p className="text-xs text-destructive">Teléfono inválido</p>}
                  </div>
                )}
              </div>
              {/* Push */}
              <div className="space-y-3 p-3 rounded-xl bg-accent/20 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10"><Smartphone className="h-4 w-4 text-purple-600" /></div>
                    <div><Label className="text-sm font-semibold block">Push (Dispositivo)</Label><div className="flex items-center gap-1"><StatusIcon status={getChannelStatus('push').status} /><span className={cn("text-xs", getChannelStatus('push').color)}>{getChannelStatus('push').label}</span></div></div>
                  </div>
                  <Switch checked={draft.notificarDispositivo} onCheckedChange={handleDeviceToggle} className="scale-110" disabled={!supported} />
                </div>
                {draft.notificarDispositivo && permission === 'granted' && (
                  <Button variant="outline" size="sm" className="w-full h-9 gap-2" onClick={handleTestPush} disabled={testingPush}>
                    {testingPush ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar prueba
                  </Button>
                )}
              </div>
              <div className="pt-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Correo de soporte</Label>
                <Input placeholder="soporte@empresa.com" value={draft.correoSoporte} onChange={(e) => scheduleUpdate({ correoSoporte: e.target.value })} className="h-10" />
              </div>
              {saving && <div className="flex items-center justify-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /><p className="text-xs text-primary">Guardando...</p></div>}
            </div>
          )}
        </div>

        {/* Tipos de Notificación */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
          <div className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50" onClick={() => setTiposNotificacionExpanded(!tiposNotificacionExpanded)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><AlertTriangle className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-sm">Tipos de alertas</h3><p className="text-xs text-muted-foreground">Qué notificaciones recibir</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{enabledTypes.length}/{NOTIFICATION_TYPES.length}</Badge>
              {tiposNotificacionExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
          {tiposNotificacionExpanded && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              {NOTIFICATION_TYPES.map((type) => {
                const Icon = type.icon;
                const isEnabled = enabledTypes.includes(type.id);
                return (
                  <div key={type.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", isEnabled ? "bg-primary/5 border-primary/20" : "bg-accent/20 border-border/30")} onClick={() => toggleNotificationType(type.id)}>
                    <Checkbox checked={isEnabled} onCheckedChange={() => toggleNotificationType(type.id)} className="h-5 w-5" />
                    <div className={cn("p-2 rounded-lg", isEnabled ? "bg-primary/10" : "bg-muted")}><Icon className={cn("h-4 w-4", isEnabled ? "text-primary" : "text-muted-foreground")} /></div>
                    <div className="flex-1"><p className="text-sm font-semibold">{type.label}</p><p className="text-xs text-muted-foreground">{type.description}</p></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Apariencia */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/40 shadow-premium">
          <div className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50" onClick={() => setAparienciaExpanded(!aparienciaExpanded)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><MoonStar className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-sm">Apariencia</h3><p className="text-xs text-muted-foreground">Tema y preferencias</p></div>
            </div>
            {aparienciaExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
          {aparienciaExpanded && (
            <div className="px-4 pb-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1"><Label className="text-sm font-semibold block">Modo oscuro automático</Label><p className="text-xs text-muted-foreground mt-1">Según preferencias del sistema</p></div>
                <Switch checked={draft.modoOscuroAutomatico} onCheckedChange={(v) => scheduleUpdate({ modoOscuroAutomatico: v })} className="scale-110" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex-1"><Label className="text-sm font-semibold block">Permitir importaciones</Label><p className="text-xs text-muted-foreground mt-1">Subir archivos JSON</p></div>
                <Switch checked={draft.permitirImportaciones} onCheckedChange={(v) => scheduleUpdate({ permitirImportaciones: v })} className="scale-110" />
              </div>
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full h-12 gap-2 text-base font-semibold border-2 active:scale-95 transition-all" onClick={handleReset}>
          <RotateCcw className="h-5 w-5" />Restaurar valores por defecto
        </Button>
        <p className="text-center text-xs text-muted-foreground py-4">ALITO Mantenimiento v1.0</p>
      </div>
    </MobileLayout>
  );
}