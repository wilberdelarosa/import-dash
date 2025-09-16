import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function Mantenimiento() {
  const { data, loading } = useLocalStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');

  if (loading) {
    return (
      <Layout title="Mantenimiento Programado">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const tipos = [...new Set(data.mantenimientosProgramados.map(m => m.tipoMantenimiento))];

  const mantenimientosFiltrados = data.mantenimientosProgramados.filter(mant => {
    const matchesSearch = Object.values(mant)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'all' || mant.tipoMantenimiento === filterTipo;
    
    const matchesEstado = filterEstado === 'all' || 
      (filterEstado === 'vencido' && mant.horasKmRestante <= 0) ||
      (filterEstado === 'proximo' && mant.horasKmRestante > 0 && mant.horasKmRestante <= 100) ||
      (filterEstado === 'programado' && mant.horasKmRestante > 100);

    return matchesSearch && matchesTipo && matchesEstado && mant.activo;
  });

  const totalMantenimientos = mantenimientosFiltrados.length;
  const vencidos = mantenimientosFiltrados.filter(m => m.horasKmRestante <= 0).length;
  const proximos = mantenimientosFiltrados.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length;
  const programados = mantenimientosFiltrados.filter(m => m.horasKmRestante > 100).length;

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const obtenerEstadoMantenimiento = (horasRestante: number) => {
    if (horasRestante <= 0) return { label: 'Vencido', variant: 'destructive' as const };
    if (horasRestante <= 100) return { label: 'Próximo', variant: 'secondary' as const };
    return { label: 'Programado', variant: 'default' as const };
  };

  return (
    <Layout title="Mantenimiento Programado">
      <Navigation />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Programados</CardDescription>
            <CardTitle className="text-3xl">{totalMantenimientos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencidos</CardDescription>
            <CardTitle className="text-3xl text-destructive">{vencidos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos (≤100)</CardDescription>
            <CardTitle className="text-3xl text-warning">{proximos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Programados</CardDescription>
            <CardTitle className="text-3xl text-success">{programados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Mantenimientos Programados
              </CardTitle>
              <CardDescription>
                Control y seguimiento de mantenimientos preventivos
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar mantenimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
                <SelectItem value="proximo">Próximos</SelectItem>
                <SelectItem value="programado">Programados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Próximo</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Último Mant.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientosFiltrados.map((mant) => {
                  const estado = obtenerEstadoMantenimiento(mant.horasKmRestante);
                  const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
                  
                  return (
                    <TableRow key={mant.id}>
                      <TableCell className="font-medium">{mant.ficha}</TableCell>
                      <TableCell>{mant.nombreEquipo}</TableCell>
                      <TableCell>{mant.tipoMantenimiento}</TableCell>
                      <TableCell>{mant.horasKmActuales.toLocaleString()} {unidad}</TableCell>
                      <TableCell>{mant.frecuencia.toLocaleString()} {unidad}</TableCell>
                      <TableCell>{mant.proximoMantenimiento.toLocaleString()} {unidad}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {mant.horasKmRestante <= 0 && (
                            <AlertCircle className="w-4 h-4 text-destructive mr-2" />
                          )}
                          {mant.horasKmRestante > 0 && mant.horasKmRestante <= 100 && (
                            <Clock className="w-4 h-4 text-warning mr-2" />
                          )}
                          <span className={
                            mant.horasKmRestante <= 0 ? 'text-destructive font-medium' :
                            mant.horasKmRestante <= 100 ? 'text-warning font-medium' : ''
                          }>
                            {mant.horasKmRestante <= 0 ? 
                              `${Math.abs(mant.horasKmRestante).toFixed(0)} ${unidad} vencido` :
                              `${mant.horasKmRestante.toFixed(0)} ${unidad}`
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatearFecha(mant.fechaUltimoMantenimiento)}</TableCell>
                      <TableCell>
                        <Badge variant={estado.variant}>
                          {estado.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {mantenimientosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron mantenimientos que coincidan con los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}