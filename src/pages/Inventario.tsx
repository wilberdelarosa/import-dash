import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertTriangle, Package, TrendingDown, XCircle } from 'lucide-react';
import { useInventario } from '@/hooks/useInventario';

const Inventario = () => {
  const { inventario, loading } = useInventario();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterSistema, setFilterSistema] = useState<string>('todos');

  if (loading) {
    return (
      <Layout title="Inventario de Repuestos">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const filteredInventario = inventario.filter(item => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo_identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numero_parte?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || item.tipo === filterTipo;
    const matchesSistema = filterSistema === 'todos' || item.sistema === filterSistema;
    
    return matchesSearch && matchesTipo && matchesSistema && item.activo;
  });

  const totalItems = inventario.filter(item => item.activo).length;
  const stockBajo = inventario.filter(item => item.activo && item.cantidad > 0 && item.cantidad <= item.stock_minimo).length;
  const sinStock = inventario.filter(item => item.activo && item.cantidad === 0).length;

  const sistemasUnicos = ['todos', ...Array.from(new Set(inventario.map(item => item.sistema).filter(Boolean)))];
  const tiposUnicos = ['todos', ...Array.from(new Set(inventario.map(item => item.tipo)))];

  return (
    <Layout title="Inventario de Repuestos">
      <Navigation />

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Inventario de Repuestos</h1>
          <p className="text-muted-foreground">
            Gestión completa de partes, filtros y repuestos por sistema
          </p>
        </div>

        {/* Cards de resumen */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Items activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stockBajo}</div>
              <p className="text-xs text-muted-foreground">Requieren reorden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{sinStock}</div>
              <p className="text-xs text-muted-foreground">Sin existencias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistemas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sistemasUnicos.length - 1}</div>
              <p className="text-xs text-muted-foreground">Categorizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar y Filtrar</CardTitle>
            <CardDescription>
              Encuentra partes específicas por número de parte, sistema o tipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, código o número de parte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSistema} onValueChange={setFilterSistema}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemasUnicos.map(sistema => (
                    <SelectItem key={sistema} value={sistema || 'todos'}>
                      {sistema === 'todos' ? 'Todos los sistemas' : sistema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposUnicos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo === 'todos' ? 'Todos los tipos' : tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Items en Inventario</CardTitle>
            <CardDescription>
              {filteredInventario.length} items encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número Parte</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Stock / Mínimo</TableHead>
                    <TableHead>Ubicación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventario.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron items que coincidan con los filtros
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventario.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm font-medium">{item.numero_parte}</TableCell>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.sistema || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.cantidad}</span>
                            <span className="text-muted-foreground">/ {item.stock_minimo}</span>
                            {item.cantidad === 0 && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            {item.cantidad > 0 && item.cantidad <= item.stock_minimo && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.ubicacion || 'Sin ubicación'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventario;
