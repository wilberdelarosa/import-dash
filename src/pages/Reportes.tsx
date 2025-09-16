import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, FileDown } from 'lucide-react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Reportes() {
  const { data, loading } = useLocalStorage();
  const [filtros, setFiltros] = useState({
    categoria: 'all',
    marca: 'all',
    estado: 'all',
    fechaDesde: '',
    fechaHasta: ''
  });

  if (loading) {
    return (
      <Layout title="Reportes y Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const categorias = [...new Set(data.equipos.map(e => e.categoria))];
  const marcas = [...new Set(data.equipos.map(e => e.marca))];

  const equiposFiltrados = data.equipos.filter(equipo => {
    return (
      (filtros.categoria === 'all' || equipo.categoria === filtros.categoria) &&
      (filtros.marca === 'all' || equipo.marca === filtros.marca) &&
      (filtros.estado === 'all' || 
       (filtros.estado === 'activo' && equipo.activo) ||
       (filtros.estado === 'inactivo' && !equipo.activo))
    );
  });

  const resumenPorCategoria = categorias.map(categoria => {
    const equiposCategoria = equiposFiltrados.filter(e => e.categoria === categoria);
    return {
      categoria,
      total: equiposCategoria.length,
      activos: equiposCategoria.filter(e => e.activo).length,
      inactivos: equiposCategoria.filter(e => !e.activo).length
    };
  });

  const resumenPorMarca = marcas.map(marca => {
    const equiposMarca = equiposFiltrados.filter(e => e.marca === marca);
    return {
      marca,
      total: equiposMarca.length,
      activos: equiposMarca.filter(e => e.activo).length,
      inactivos: equiposMarca.filter(e => !e.activo).length
    };
  });

  const mantenimientosVencidos = data.mantenimientosProgramados.filter(m => 
    m.activo && m.horasKmRestante <= 0
  );

  const mantenimientosPorVencer = data.mantenimientosProgramados.filter(m => 
    m.activo && m.horasKmRestante > 0 && m.horasKmRestante <= 100
  );

  const exportarReporte = () => {
    const reporte = {
      fecha: new Date().toISOString(),
      filtros,
      resumen: {
        totalEquipos: equiposFiltrados.length,
        equiposActivos: equiposFiltrados.filter(e => e.activo).length,
        equiposInactivos: equiposFiltrados.filter(e => !e.activo).length,
        mantenimientosVencidos: mantenimientosVencidos.length,
        mantenimientosPorVencer: mantenimientosPorVencer.length
      },
      equipos: equiposFiltrados,
      resumenPorCategoria,
      resumenPorMarca,
      mantenimientos: {
        vencidos: mantenimientosVencidos,
        porVencer: mantenimientosPorVencer
      }
    };

    const dataStr = JSON.stringify(reporte, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-equipos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Reportes y Analytics">
      <Navigation />
      
      {/* Barra de filtros similar a la imagen de referencia */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros de Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={filtros.categoria} onValueChange={(value) => setFiltros({...filtros, categoria: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.marca} onValueChange={(value) => setFiltros({...filtros, marca: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {marcas.map(marca => (
                  <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
              placeholder="Fecha desde"
            />

            <Button onClick={exportarReporte} className="w-full">
              <FileDown className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equipos</CardDescription>
            <CardTitle className="text-2xl">{equiposFiltrados.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-2xl text-success">
              {equiposFiltrados.filter(e => e.activo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mantenimientos Vencidos</CardDescription>
            <CardTitle className="text-2xl text-destructive">{mantenimientosVencidos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Por Vencer</CardDescription>
            <CardTitle className="text-2xl text-warning">{mantenimientosPorVencer.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead>Inactivos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenPorCategoria.map((item) => (
                  <TableRow key={item.categoria}>
                    <TableCell className="font-medium">{item.categoria}</TableCell>
                    <TableCell>{item.total}</TableCell>
                    <TableCell className="text-success">{item.activos}</TableCell>
                    <TableCell className="text-destructive">{item.inactivos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mantenimientos críticos */}
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos Críticos</CardTitle>
            <CardDescription>Equipos que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mantenimientosVencidos.slice(0, 5).map((mant) => (
                <div key={mant.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{mant.nombreEquipo}</p>
                    <p className="text-sm text-muted-foreground">{mant.ficha}</p>
                  </div>
                  <Badge variant="destructive">
                    Vencido: {Math.abs(mant.horasKmRestante).toFixed(0)} {mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km'}
                  </Badge>
                </div>
              ))}
              {mantenimientosPorVencer.slice(0, 3).map((mant) => (
                <div key={mant.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{mant.nombreEquipo}</p>
                    <p className="text-sm text-muted-foreground">{mant.ficha}</p>
                  </div>
                  <Badge variant="secondary">
                    Resta: {mant.horasKmRestante.toFixed(0)} {mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}