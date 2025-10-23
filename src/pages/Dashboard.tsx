import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, AlertTriangle, CalendarClock, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString();
};

export default function Dashboard() {
  const { data, loading } = useSupabaseDataContext();

  if (loading) {
    return (
      <Layout title="Resumen ejecutivo">
        <Navigation />
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

  const equiposActivos = data.equipos.filter((equipo) => equipo.activo).length;
  const equiposInactivos = data.equipos.length - equiposActivos;
  const mantenimientosPendientes = data.mantenimientosProgramados.filter((m) => m.horasKmRestante <= 50).length;
  const proximoMantenimiento = [...data.mantenimientosProgramados]
    .filter((m) => m.activo)
    .sort((a, b) => a.horasKmRestante - b.horasKmRestante)[0];
  const ultimasActualizaciones = [...data.actualizacionesHorasKm]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);
  const mantenimientosRecientes = [...data.mantenimientosRealizados]
    .sort((a, b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime())
    .slice(0, 5);

  return (
    <Layout title="Resumen ejecutivo">
      <Navigation />

      <div className="space-y-6 lg:space-y-8">
      {proximoMantenimiento && proximoMantenimiento.horasKmRestante <= 25 && (
        <Alert variant="warning" className="border-warning/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Próximo mantenimiento crítico</AlertTitle>
          <AlertDescription>
            {proximoMantenimiento.nombreEquipo} requiere intervención en {proximoMantenimiento.horasKmRestante}{' '}
            horas/km restantes.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equipos activos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-success" />
              {equiposActivos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Operativos actualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equipos fuera de servicio</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              {equiposInactivos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Requieren revisión o baja temporal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mantenimientos próximos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              {mantenimientosPendientes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Con menos de 50 horas/km restantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Técnicos registrados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-info" />
              {data.empleados?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Personal disponible en la base</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Próximas actualizaciones</CardTitle>
            <CardDescription>Planifica las inspecciones prioritarias</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <div className="min-w-full rounded-md border">
              <Table className="w-full min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Horas/km restantes</TableHead>
                    <TableHead>Última actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mantenimientosProgramados
                    .slice()
                    .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
                    .slice(0, 6)
                    .map((mantenimiento) => (
                      <TableRow key={mantenimiento.id}>
                        <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                        <TableCell>{mantenimiento.tipoMantenimiento}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={mantenimiento.horasKmRestante <= 15 ? 'destructive' : 'secondary'}>
                            {mantenimiento.horasKmRestante}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        <span className="font-medium">{actualizacion.nombreEquipo ?? actualizacion.ficha}</span>
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
                        <span className="font-medium">{mantenimiento.nombreEquipo ?? mantenimiento.ficha}</span>
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
    </Layout>
  );
}
