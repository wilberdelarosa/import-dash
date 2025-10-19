import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Inventario() {
  const { data, loading } = useSupabaseDataContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');

  if (loading) {
    return (
      <Layout title="Inventario de Repuestos">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const tipos = [...new Set(data.inventarios.map(i => i.tipo))];

  const inventariosFiltrados = data.inventarios.filter(item => {
    const matchesSearch = Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'all' || item.tipo === filterTipo;

    return matchesSearch && matchesTipo && item.activo;
  });

  const totalItems = inventariosFiltrados.length;
  const stockBajo = inventariosFiltrados.filter(i => i.cantidad <= 5).length;
  const sinStock = inventariosFiltrados.filter(i => i.cantidad === 0).length;

  return (
    <Layout title="Inventario de Repuestos">
      <Navigation />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{totalItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stock Bajo (≤5)</CardDescription>
            <CardTitle className="text-3xl text-warning">{stockBajo}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sin Stock</CardDescription>
            <CardTitle className="text-3xl text-destructive">{sinStock}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total</CardDescription>
            <CardTitle className="text-3xl">N/A</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Inventario de Repuestos
              </CardTitle>
              <CardDescription>
                Gestión de repuestos y suministros para equipos
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar repuestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tipos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría Equipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Marcas Compatible</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventariosFiltrados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.codigoIdentificacion}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.categoriaEquipo}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {item.cantidad === 0 && (
                          <AlertTriangle className="w-4 h-4 text-destructive mr-2" />
                        )}
                        {item.cantidad <= 5 && item.cantidad > 0 && (
                          <AlertTriangle className="w-4 h-4 text-warning mr-2" />
                        )}
                        <span className={
                          item.cantidad === 0 ? 'text-destructive font-medium' :
                          item.cantidad <= 5 ? 'text-warning font-medium' : ''
                        }>
                          {item.cantidad}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.marcasCompatibles.slice(0, 2).map((marca, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {marca}
                          </Badge>
                        ))}
                        {item.marcasCompatibles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.marcasCompatibles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          item.cantidad === 0 ? "destructive" :
                          item.cantidad <= 5 ? "secondary" : "default"
                        }
                      >
                        {item.cantidad === 0 ? 'Sin Stock' :
                         item.cantidad <= 5 ? 'Stock Bajo' : 'Disponible'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {inventariosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron items que coincidan con los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
