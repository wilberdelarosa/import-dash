import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isEquipoDisponible, type Equipo, type MantenimientoProgramado } from '@/types/equipment';

interface Props {
  equipos: Equipo[];
  mantenimientos: MantenimientoProgramado[];
}

const GRUPOS: { titulo: string; icono: string; match: RegExp }[] = [
  { titulo: 'MINIRETROEXCAVADORAS', icono: '🟡', match: /mini\s*retro/i },
  { titulo: 'EXCAVADORAS', icono: '🟡', match: /excavadora/i },
  { titulo: 'MINICARGADORES', icono: '🟡', match: /minicargador|cargador/i },
  { titulo: 'COMPACTADORES Y RODILLOS', icono: '🟡', match: /compactador|rodillo/i },
  { titulo: 'CAMIONES Y VEHÍCULOS', icono: '🔵', match: /cami[oó]n|sinotru|volteo|cabezote|kia|jac|gr[uú]a|veh[ií]culo|camioneta/i },
];
const OTROS = { titulo: 'OTROS EQUIPOS', icono: '⚪' };

const fichaSort = (a: string, b: string) => a.localeCompare(b, 'es', { numeric: true });

export function buildMensajePendientes(equipos: Equipo[], mantenimientos: MantenimientoProgramado[], dias: number) {
  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() - (dias - 1));

  // Última lectura conocida por ficha (máxima fecha entre sus mantenimientos activos)
  const ultimaPorFicha = new Map<string, number>();
  for (const m of mantenimientos) {
    if (!m.activo) continue;
    const t = new Date(m.fechaUltimaActualizacion).getTime();
    if (!Number.isFinite(t)) continue;
    ultimaPorFicha.set(m.ficha, Math.max(ultimaPorFicha.get(m.ficha) ?? 0, t));
  }

  const pendientes = equipos.filter(
    (e) => isEquipoDisponible(e) && (ultimaPorFicha.get(e.ficha) ?? 0) < limite.getTime()
  );

  const grupos = new Map<string, Equipo[]>();
  for (const e of pendientes) {
    const texto = `${e.categoria} ${e.nombre}`;
    const g = GRUPOS.find((gr) => gr.match.test(texto));
    const key = g?.titulo ?? OTROS.titulo;
    grupos.set(key, [...(grupos.get(key) ?? []), e]);
  }

  const secciones = [...GRUPOS, OTROS]
    .filter((g) => grupos.get(g.titulo)?.length)
    .map((g) => {
      const lineas = grupos
        .get(g.titulo)!
        .sort((a, b) => fichaSort(a.ficha, b.ficha))
        .map((e) => `\`${e.ficha}\` ${e.nombre.trim().toUpperCase()}:`);
      return `${g.icono} *${g.titulo}*\n━━━━━━━━━━━━━━━━━━━━\n${lineas.join('\n')}`;
    });

  const mensaje = [
    '╭──────────────────────╮',
    '📋 *PENDIENTES DE REGISTRO*',
    '*HORÓMETROS Y KILOMETRAJES*',
    '╰──────────────────────╯',
    '',
    secciones.join('\n\n'),
    '',
    '──────────────────────',
    '✍️ *Favor responder con la lectura actual al lado de cada equipo.*',
  ].join('\n');

  return { mensaje, total: pendientes.length };
}

export function WhatsAppPendientesButton({ equipos, mantenimientos }: Props) {
  const { toast } = useToast();
  const [dias, setDias] = useState('1');
  const { mensaje, total } = useMemo(
    () => buildMensajePendientes(equipos, mantenimientos, Number(dias)),
    [equipos, mantenimientos, dias]
  );

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      toast({ title: 'Copiado', description: `${total} equipos pendientes listos para pegar en WhatsApp.` });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Tu navegador bloqueó el portapapeles.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold flex items-center gap-2">
        <MessageCircle className="h-3.5 w-3.5 text-primary" /> Pendientes para WhatsApp
      </h5>
      <p className="text-xs text-muted-foreground">Equipos activos sin lectura registrada en el período.</p>
      <Select value={dias} onValueChange={setDias}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Sin lectura hoy</SelectItem>
          <SelectItem value="2">Sin lectura en 2 días</SelectItem>
          <SelectItem value="7">Sin lectura en 7 días</SelectItem>
          <SelectItem value="30">Sin lectura en 30 días</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button type="button" className="flex-1 gap-2 h-10" onClick={copiar} disabled={total === 0}>
          <Copy className="h-4 w-4" /> Copiar ({total})
        </Button>
        <Button type="button" variant="outline" className="h-10" disabled={total === 0} asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
