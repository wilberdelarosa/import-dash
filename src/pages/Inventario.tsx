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

      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="flex flex-col gap-2 text-lg sm:flex-row sm:items-center">
                <span className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Inventario de Repuestos
                </span>
              </CardTitle>
              <CardDescription>
                Gestión de repuestos y suministros para equipos
              </CardDescription>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar repuestos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-6 sm:px-6">
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <div className="min-w-full rounded-md border">
                <Table className="w-full min-w-[900px]">
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
                              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                            )}
                            {item.cantidad <= 5 && item.cantidad > 0 && (
                              <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                            )}
                            <span
                              className={
                                item.cantidad === 0
                                  ? 'font-medium text-destructive'
                                  : item.cantidad <= 5
                                  ? 'font-medium text-warning'
                                  : undefined
                              }
                            >
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
                              item.cantidad === 0
                                ? 'destructive'
                                : item.cantidad <= 5
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {item.cantidad === 0
                              ? 'Sin Stock'
                              : item.cantidad <= 5
                              ? 'Stock Bajo'
                              : 'Disponible'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {inventariosFiltrados.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No se encontraron items que coincidan con los filtros seleccionados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
