/**
 * Lista de Equipos Pendientes - Mobile
 * Muestra equipos con mantenimiento pendiente/vencido
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import {
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MechanicPendingList() {
  const navigate = useNavigate();
  const { data } = useSupabaseDataContext();
  const mantenimientos = data.mantenimientosProgramados;
  const [search, setSearch] = useState('');

  // Equipos con mantenimiento pendiente/vencido, ordenados por urgencia
  const equiposPendientes = useMemo(() => {
    const pendientes = mantenimientos
      .filter(m => m.activo)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);

    if (!search) return pendientes;

    const searchLower = search.toLowerCase();
    return pendientes.filter(m =>
      m.ficha.toLowerCase().includes(searchLower) ||
      m.nombreEquipo.toLowerCase().includes(searchLower)
    );
  }, [mantenimientos, search]);

  const getUrgencyBadge = (horasRestantes: number) => {
    if (horasRestantes < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO hace {Math.abs(horasRestantes)}h
        </Badge>
      );
    }
    if (horasRestantes <= 50) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
          <Clock className="h-3 w-3 mr-1" />
          Próximo en {horasRestantes}h
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
        Al día ({horasRestantes}h)
      </Badge>
    );
  };

  return (
    <MobileLayout 
      title="Equipos Pendientes" 
      showBottomNav={true}
    >
      <div className="space-y-3 pb-20">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ficha o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Stats rápidos */}
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            {equiposPendientes.filter(e => e.horasKmRestante < 0).length} vencidos
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            {equiposPendientes.filter(e => e.horasKmRestante >= 0 && e.horasKmRestante <= 50).length} próximos
          </Badge>
        </div>

        {/* Lista de equipos */}
        {equiposPendientes.length === 0 ? (
          <MobileCard className="p-6 text-center">
            <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No se encontraron equipos' : 'No hay equipos pendientes'}
            </p>
          </MobileCard>
        ) : (
          <div className="space-y-2">
            {equiposPendientes.map((mant, index) => (
              <MobileCard
                key={mant.id}
                className={cn(
                  "p-3 transition-all animate-in slide-in-from-bottom-2",
                  mant.horasKmRestante < 0 && "border-l-2 border-l-destructive",
                  mant.horasKmRestante >= 0 && mant.horasKmRestante <= 50 && "border-l-2 border-l-amber-500"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="text-sm font-semibold truncate">
                        {mant.nombreEquipo}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Ficha: {mant.ficha}
                    </p>
                  </div>
                  {getUrgencyBadge(mant.horasKmRestante)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3 ml-6">
                  <div>
                    <span className="text-foreground font-medium">{mant.horasKmActuales.toLocaleString()}</span>
                    <span className="text-[10px]"> hrs actuales</span>
                  </div>
                  <div>
                    <span className="text-foreground font-medium">{mant.proximoMantenimiento.toLocaleString()}</span>
                    <span className="text-[10px]"> hrs límite</span>
                  </div>
                </div>

                <div className="flex items-center justify-between ml-6">
                  <Badge variant="outline" className="text-[10px]">
                    {mant.tipoMantenimiento}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/mechanic/reportar/${mant.ficha}`)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Reportar Trabajo
                  </Button>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default MechanicPendingList;
