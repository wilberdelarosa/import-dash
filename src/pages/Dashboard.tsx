import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ResponsiveWrapper } from '@/components/mobile/ResponsiveWrapper';
import { DashboardMobile } from '@/components/mobile/DashboardMobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CalendarClock, Clock, Users, ExternalLink, Sparkles, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import { EquipoLink } from '@/components/EquipoLink';
import { useNavigate } from 'react-router-dom';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { Link } from 'react-router-dom';
import { 
  UMBRAL_MANTENIMIENTO_PROXIMO_HRS, 
  LIMITE_MANTENIMIENTOS_RECIENTES,
  LIMITE_MANTENIMIENTOS_DASHBOARD 
} from '@/lib/constants';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString();
};

const formatEquipoReferencia = (nombre?: string | null, ficha?: string | null) => {
  if (nombre && ficha) return `${nombre} (Ficha ${ficha})`;
  if (ficha) return `Ficha ${ficha}`;
  return nombre ?? 'Equipo sin ficha';
};

export default function Dashboard() {
  const { data, loading } = useSupabaseDataContext();
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novedadesExpanded, setNovedadesExpanded] = useState(false);

  // Memoizar estadísticas para evitar recálculos en cada render
  const estadisticas = useMemo(() => {
    const equiposActivos = data.equipos.filter((equipo) => equipo.activo).length;
    const equiposInactivos = data.equipos.length - equiposActivos;
    
    // Crear set de fichas de equipos activos
    const fichasActivos = new Set(data.equipos.filter(e => e.activo).map(e => e.ficha));
    
    const mantenimientosPendientes = data.mantenimientosProgramados.filter(
      (m) => m.horasKmRestante <= 50 && fichasActivos.has(m.ficha)
    ).length;
    const mantenimientosVencidos = data.mantenimientosProgramados.filter(
      (m) => m.horasKmRestante < 0 && fichasActivos.has(m.ficha)
    ).length;
    const proximoMantenimiento = [...data.mantenimientosProgramados]
      .filter((m) => m.activo && fichasActivos.has(m.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante)[0];

    return {
      equiposActivos,
      equiposInactivos,
      mantenimientosPendientes,
      mantenimientosVencidos,
      proximoMantenimiento,
    };
  }, [data.equipos, data.mantenimientosProgramados]);

  // Memoizar listas de mantenimientos para evitar ordenamiento repetido
  const mantenimientosVencidosList = useMemo(() => {
    const fichasActivos = new Set(data.equipos.filter(e => e.activo).map(e => e.ficha));
    return data.mantenimientosProgramados
      .filter((mantenimiento) => mantenimiento.horasKmRestante <= 0 && fichasActivos.has(mantenimiento.ficha))
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante);
      // NO aplicar límite aquí - mostrar TODOS los vencidos
  }, [data.mantenimientosProgramados, data.equipos]);

  const mantenimientosProximosList = useMemo(() => {
    const fichasActivos = new Set(data.equipos.filter(e => e.activo).map(e => e.ficha));
    return data.mantenimientosProgramados
      .filter(
        (mantenimiento) =>
          mantenimiento.horasKmRestante > 0 && 
          mantenimiento.horasKmRestante <= UMBRAL_MANTENIMIENTO_PROXIMO_HRS &&
          fichasActivos.has(mantenimiento.ficha)
      )
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
      .slice(0, LIMITE_MANTENIMIENTOS_DASHBOARD);
  }, [data.mantenimientosProgramados, data.equipos]);

  const ultimasActualizaciones = useMemo(() => {
    return [...data.actualizacionesHorasKm]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, LIMITE_MANTENIMIENTOS_RECIENTES);
  }, [data.actualizacionesHorasKm]);

  const mantenimientosRecientes = useMemo(() => {
    return [...data.mantenimientosRealizados]
      .sort((a, b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime())
      .slice(0, LIMITE_MANTENIMIENTOS_RECIENTES);
  }, [data.mantenimientosRealizados]);

  const handleVerEquipo = (ficha: string) => {
    setFichaSeleccionada(ficha);
    setDialogOpen(true);
  };

  if (loading) {
    // Mostrar skeleton apropiado según dispositivo
    if (isMobile) {
      return (
        <div className="flex h-screen flex-col bg-background p-4">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Layout title="Resumen ejecutivo">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  // Renderizar versión móvil o desktop según dispositivo
  if (isMobile) {
    return (
      <DashboardMobile
        equiposActivos={estadisticas.equiposActivos}
        mantenimientosVencidos={estadisticas.mantenimientosVencidos}
        mantenimientosProgramados={estadisticas.mantenimientosProgramados}
        inventarioBajo={estadisticas.inventarioBajo}
      />
    );
  }

  // Versión desktop (código original)
  return (
    <Layout title="Resumen ejecutivo">

      <div className="space-y-6 lg:space-y-8">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg"
            onClick={() => setNovedadesExpanded(!novedadesExpanded)}
          >
            <CardTitle className="flex items-center justify-between gap-2 text-primary text-lg sm:text-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" /> 
                Novedades del módulo de mantenimiento inteligente
              </div>
              {novedadesExpanded ? (
                <ChevronUp className="h-5 w-5 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0" />
              )}
            </CardTitle>
            {!novedadesExpanded && (
              <CardDescription className="text-sm">
                Clic para ver las nuevas funcionalidades disponibles
              </CardDescription>
            )}
          </CardHeader>
          {novedadesExpanded && (
            <>
              <CardContent className="space-y-3 text-sm pt-0">
                <CardDescription className="text-sm">
                  Accede rápidamente a los kits Caterpillar sugeridos, crea listas personalizadas y abre la ficha del equipo desde el tablero.
                </CardDescription>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      Consulta los kits recomendados y tareas clave desde la ficha del equipo en <strong>Equipos &gt; Ver detalle</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      Utiliza el nuevo <strong>constructor de listas personalizadas</strong> para elegir columnas, filtros y exportar reportes en PDF/Excel.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      Desde este dashboard, haz clic en los indicadores para abrir listas filtradas y revisar los equipos con alerta.
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
                  <Button variant="default" size="sm" asChild className="w-full sm:w-auto">
                    <Link to="/equipos">Abrir gestión de equipos</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link to="/listas-personalizadas">Listas personalizadas</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/asistente')} className="text-primary w-full sm:w-auto">
                    Asistente IA
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

      {estadisticas.mantenimientosVencidos > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <AlertTitle>Mantenimientos vencidos</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm">
              {estadisticas.mantenimientosVencidos} equipo{estadisticas.mantenimientosVencidos > 1 ? 's tienen' : ' tiene'} mantenimientos vencidos que requieren atención inmediata.
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/mantenimiento')} className="w-full sm:w-auto sm:ml-4 shrink-0">
              Ver detalles <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {estadisticas.proximoMantenimiento && estadisticas.proximoMantenimiento.horasKmRestante > 0 && estadisticas.proximoMantenimiento.horasKmRestante <= 25 && (
        <Alert variant="warning" className="border-warning/50">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <AlertTitle>Próximo mantenimiento crítico</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm">
              {formatEquipoReferencia(estadisticas.proximoMantenimiento.nombreEquipo, estadisticas.proximoMantenimiento.ficha)} requiere intervención en {estadisticas.proximoMantenimiento.horasKmRestante} horas/km restantes.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleVerEquipo(estadisticas.proximoMantenimiento.ficha)}
              className="w-full sm:w-auto sm:ml-4 shrink-0"
            >
              Ver equipo <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <Card 
          className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-success/50"
          onClick={() => navigate('/equipos')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Equipos activos</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-bold flex items-center gap-2 sm:gap-3">
              <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-success transition-transform group-hover:scale-110" />
              {estadisticas.equiposActivos}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              Operativos actualmente
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </CardContent>
        </Card>
        <Card 
          className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-warning/50"
          onClick={() => navigate('/equipos')}
        >
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Equipos fuera de servicio</CardDescription>
            <CardTitle className="text-4xl font-bold flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 text-warning transition-transform group-hover:scale-110" />
              {estadisticas.equiposInactivos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              Requieren revisión o baja temporal
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </CardContent>
        </Card>
        <Card 
          className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50"
          onClick={() => navigate('/mantenimiento')}
        >
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Mantenimientos próximos</CardDescription>
            <CardTitle className="text-4xl font-bold flex items-center gap-3">
              <CalendarClock className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              {estadisticas.mantenimientosPendientes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              {estadisticas.mantenimientosVencidos > 0 ? (
                <span>Vencidos: <span className="font-semibold text-destructive">{estadisticas.mantenimientosVencidos}</span> ({Math.abs(data.mantenimientosProgramados.filter(m => m.horasKmRestante < 0).reduce((min, m) => Math.min(min, m.horasKmRestante), 0))}h)</span>
              ) : (
                <span>Con menos de 50 horas/km restantes</span>
              )}
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </CardContent>
        </Card>
        <Card className="group transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-info/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Técnicos registrados</CardDescription>
            <CardTitle className="text-4xl font-bold flex items-center gap-3">
              <Users className="h-7 w-7 text-info transition-transform group-hover:scale-110" />
              {data.empleados?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Personal disponible en la base</p>
          </CardContent>
        </Card>
      </section>

      {/* Sección de tablas - Solo visible en desktop */}
      <section className="hidden sm:grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Mantenimientos vencidos
            </CardTitle>
            <CardDescription>Equipos con horas/km excedidas. Haz clic para abrir la ficha y tomar acción inmediata.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {mantenimientosVencidosList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay mantenimientos vencidos en este momento.</p>
            ) : (
              <Table className="w-full min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo / Ficha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Horas/km vencidas</TableHead>
                    <TableHead>Última actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mantenimientosVencidosList.map((mantenimiento) => (
                    <TableRow
                      key={`${mantenimiento.id}-vencido`}
                      className="cursor-pointer transition-colors hover:bg-destructive/10 group"
                      onClick={() => handleVerEquipo(mantenimiento.ficha)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{mantenimiento.nombreEquipo ?? 'Equipo sin nombre'}</span>
                          <span className="text-xs text-muted-foreground">
                            {mantenimiento.ficha ? `Ficha ${mantenimiento.ficha}` : 'Sin ficha registrada'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{mantenimiento.tipoMantenimiento}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {formatRemainingLabel(
                            mantenimiento.horasKmRestante,
                            mantenimiento.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-5 w-5" /> Mantenimientos próximos
            </CardTitle>
            <CardDescription>Próximas intervenciones con la misma estructura para comparar con los vencidos.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {mantenimientosProximosList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay mantenimientos próximos registrados.</p>
            ) : (
              <Table className="w-full min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo / Ficha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Horas/km restantes</TableHead>
                    <TableHead>Última actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mantenimientosProximosList.map((mantenimiento) => (
                    <TableRow
                      key={`${mantenimiento.id}-proximo`}
                      className="cursor-pointer transition-colors hover:bg-primary/10 group"
                      onClick={() => handleVerEquipo(mantenimiento.ficha)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{mantenimiento.nombreEquipo ?? 'Equipo sin nombre'}</span>
                          <span className="text-xs text-muted-foreground">
                            {mantenimiento.ficha ? `Ficha ${mantenimiento.ficha}` : 'Sin ficha registrada'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{mantenimiento.tipoMantenimiento}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getRemainingVariant(mantenimiento.horasKmRestante)}>
                          {formatRemainingLabel(
                            mantenimiento.horasKmRestante,
                            mantenimiento.tipoMantenimiento === 'Kilómetros' ? 'km' : 'horas'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimas lecturas y mantenimientos registrados</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Actualizaciones de horas/km
                </h3>
                <div className="space-y-3">
                  {ultimasActualizaciones.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay lecturas registradas.</p>
                  )}
                  {ultimasActualizaciones.map((actualizacion) => (
                    <div key={actualizacion.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{actualizacion.nombreEquipo ?? 'Equipo sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">
                            {actualizacion.ficha ? `Ficha ${actualizacion.ficha}` : 'Sin ficha registrada'}
                          </p>
                        </div>
                        <Badge variant="outline">{formatDate(actualizacion.fecha)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Nueva lectura: {actualizacion.horasKm} ({actualizacion.incremento >= 0 ? '+' : ''}
                        {actualizacion.incremento})
                      </p>
                      <p className="text-xs text-muted-foreground">Responsable: {actualizacion.usuarioResponsable}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Mantenimientos realizados</h3>
                <div className="space-y-3">
                  {mantenimientosRecientes.length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no hay mantenimientos registrados.</p>
                  )}
                  {mantenimientosRecientes.map((mantenimiento) => (
                    <div key={mantenimiento.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{mantenimiento.nombreEquipo ?? 'Equipo sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">
                            {mantenimiento.ficha ? `Ficha ${mantenimiento.ficha}` : 'Sin ficha registrada'}
                          </p>
                        </div>
                        <Badge variant="outline">{formatDate(mantenimiento.fechaMantenimiento)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Horas/km al momento: {mantenimiento.horasKmAlMomento}
                      </p>
                      <p className="text-xs text-muted-foreground">Responsable: {mantenimiento.usuarioResponsable}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      </div>

      <EquipoDetalleUnificado
        ficha={fichaSeleccionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Layout>
  );
}
