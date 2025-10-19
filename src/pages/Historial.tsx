import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useHistorial } from '@/hooks/useHistorial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Calendar,
  AlertCircle,
  AlertTriangle,
  Info,
  Package,
  Truck,
  Wrench,
  Settings,
  FileText,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Historial() {
  const {
    eventos,
    loading,
    filtros,
    setFiltros,
    limpiarHistorial,
  } = useHistorial();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const getIconoModulo = (modulo: string) => {
    switch (modulo) {
      case 'equipos':
        return <Truck className="h-4 w-4" />;
      case 'inventarios':
        return <Package className="h-4 w-4" />;
      case 'mantenimientos':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getIconoNivel = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case 'crear':
        return 'default';
      case 'actualizar':
        return 'secondary';
      case 'eliminar':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipoEvento: [],
      modulo: [],
      nivelImportancia: [],
      fichaEquipo: null,
      fechaDesde: null,
      fechaHasta: null,
    });
  };

  const exportarPDF = () => {
    // TODO: Implementar exportación a PDF
    console.log('Exportar a PDF');
  };

  const tiposEvento = ['crear', 'actualizar', 'eliminar', 'mantenimiento_realizado', 'stock_movido', 'sistema'];
  const modulos = ['equipos', 'inventarios', 'mantenimientos', 'sistema'];
  const niveles = ['info', 'warning', 'critical'];

  return (
    <Layout title="Historial de Eventos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historial de Eventos</h1>
            <p className="text-muted-foreground">
              Registro completo de todas las operaciones del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportarPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todo el historial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos los eventos del historial.
                    Esta operación no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={limpiarHistorial}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {eventos.filter(e => e.nivelImportancia === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {eventos.filter(e => e.nivelImportancia === 'warning').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Información</CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {eventos.filter(e => e.nivelImportancia === 'info').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda y filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en descripción, ficha, equipo, usuario..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={mostrarFiltros ? "default" : "outline"}
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                {(filtros.tipoEvento.length > 0 || 
                  filtros.modulo.length > 0 || 
                  filtros.nivelImportancia.length > 0 ||
                  filtros.fichaEquipo ||
                  filtros.fechaDesde ||
                  filtros.fechaHasta) && (
                  <Button
                    variant="ghost"
                    onClick={limpiarFiltros}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>

              {mostrarFiltros && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                    <Select
                      value={filtros.tipoEvento[0] || ""}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, tipoEvento: value ? [value] : [] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {tiposEvento.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Módulo</label>
                    <Select
                      value={filtros.modulo[0] || ""}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, modulo: value ? [value] : [] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {modulos.map(mod => (
                          <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nivel</label>
                    <Select
                      value={filtros.nivelImportancia[0] || ""}
                      onValueChange={(value) => 
                        setFiltros({ ...filtros, nivelImportancia: value ? [value] : [] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {niveles.map(nivel => (
                          <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
                    <Input
                      type="date"
                      value={filtros.fechaDesde?.toISOString().split('T')[0] || ''}
                      onChange={(e) => 
                        setFiltros({ 
                          ...filtros, 
                          fechaDesde: e.target.value ? new Date(e.target.value) : null 
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
                    <Input
                      type="date"
                      value={filtros.fechaHasta?.toISOString().split('T')[0] || ''}
                      onChange={(e) => 
                        setFiltros({ 
                          ...filtros, 
                          fechaHasta: e.target.value ? new Date(e.target.value) : null 
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Ficha de Equipo</label>
                    <Input
                      placeholder="AC-001"
                      value={filtros.fichaEquipo || ''}
                      onChange={(e) => 
                        setFiltros({ ...filtros, fichaEquipo: e.target.value || null })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Línea de Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Cargando eventos...
                </div>
              ) : eventos.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay eventos que mostrar
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {eventos.map((evento, index) => (
                    <div
                      key={evento.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 rounded-full bg-primary/10">
                            {getIconoModulo(evento.modulo)}
                          </div>
                          {index < eventos.length - 1 && (
                            <Separator orientation="vertical" className="flex-1" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getBadgeVariant(evento.tipoEvento)}>
                                {evento.tipoEvento}
                              </Badge>
                              <Badge variant="outline">{evento.modulo}</Badge>
                              {evento.fichaEquipo && (
                                <Badge variant="secondary">{evento.fichaEquipo}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getIconoNivel(evento.nivelImportancia)}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(evento.createdAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <p className="font-medium mb-1">{evento.descripcion}</p>
                          
                          {evento.nombreEquipo && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Equipo: {evento.nombreEquipo}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Por: {evento.usuarioResponsable}
                          </p>

                          {(evento.datosAntes || evento.datosDespues) && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Ver detalles técnicos
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                {evento.datosAntes && (
                                  <div className="mb-2">
                                    <strong>Antes:</strong>
                                    <pre className="mt-1 overflow-x-auto">
                                      {JSON.stringify(evento.datosAntes, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {evento.datosDespues && (
                                  <div>
                                    <strong>Después:</strong>
                                    <pre className="mt-1 overflow-x-auto">
                                      {JSON.stringify(evento.datosDespues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
