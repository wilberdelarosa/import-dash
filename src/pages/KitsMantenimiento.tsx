import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useKits } from '@/hooks/useKits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Package, Wrench, ChevronRight, Factory, Layers, Search, BarChart3, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { KitMantenimiento, KitPieza } from '@/types/maintenance-plans';

const TIPOS_PIEZA = ['Filtro', 'Aceite', 'Lubricante', 'Repuesto', 'Consumible', 'Otro'];

export default function KitsMantenimiento() {
  const { kits, loading, createKit, updateKit, deleteKit, createPieza, updatePieza, deletePieza } = useKits();
  const [openKitDialog, setOpenKitDialog] = useState(false);
  const [openPiezaDialog, setOpenPiezaDialog] = useState(false);
  const [editingKit, setEditingKit] = useState<KitMantenimiento | null>(null);
  const [editingPieza, setEditingPieza] = useState<KitPieza | null>(null);
  const [selectedKitId, setSelectedKitId] = useState<number | null>(null);
  
  // Estados para control de vista
  const [view, setView] = useState<'index' | 'details'>('index');
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  
  // 🎯 NUEVOS ESTADOS PARA MEJORAS
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroMarca, setFiltroMarca] = useState<string>('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Agrupar kits por marca
  const kitsPorMarca = useMemo(() => {
    const grupos: Record<string, typeof kits> = {};
    kits.forEach(kit => {
      const marca = kit.marca || 'Sin marca';
      if (!grupos[marca]) {
        grupos[marca] = [];
      }
      grupos[marca].push(kit);
    });
    return grupos;
  }, [kits]);

  // 🎯 NUEVO: Agrupar kits por categoría
  const kitsPorCategoria = useMemo(() => {
    const grupos: Record<string, typeof kits> = {};
    kits.forEach(kit => {
      const categoria = kit.categoria || 'Sin categoría';
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      grupos[categoria].push(kit);
    });
    return grupos;
  }, [kits]);

  // 🎯 NUEVO: Kits filtrados por búsqueda y filtros
  const kitsFiltrados = useMemo(() => {
    let resultado = kits;

    // Filtrar por término de búsqueda (nombre, código, piezas)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(kit => {
        const nombreMatch = kit.nombre.toLowerCase().includes(term);
        const codigoMatch = kit.codigo.toLowerCase().includes(term);
        const piezasMatch = kit.piezas?.some(pieza => 
          pieza.numero_parte.toLowerCase().includes(term) ||
          pieza.descripcion.toLowerCase().includes(term)
        );
        return nombreMatch || codigoMatch || piezasMatch;
      });
    }

    // Filtrar por categoría
    if (filtroCategoria !== 'todos') {
      resultado = resultado.filter(kit => (kit.categoria || 'Sin categoría') === filtroCategoria);
    }

    // Filtrar por marca
    if (filtroMarca !== 'todos') {
      resultado = resultado.filter(kit => (kit.marca || 'Sin marca') === filtroMarca);
    }

    // Filtrar por estado activo
    if (!mostrarInactivos) {
      resultado = resultado.filter(kit => kit.activo);
    }

    return resultado;
  }, [kits, searchTerm, filtroCategoria, filtroMarca, mostrarInactivos]);

  // 🎯 NUEVO: Agrupar kits filtrados por marca
  const kitsPorMarcaFiltrados = useMemo(() => {
    const grupos: Record<string, typeof kits> = {};
    kitsFiltrados.forEach(kit => {
      const marca = kit.marca || 'Sin marca';
      if (!grupos[marca]) {
        grupos[marca] = [];
      }
      grupos[marca].push(kit);
    });
    return grupos;
  }, [kitsFiltrados]);

  // 🎯 NUEVO: Categorías únicas
  const categoriasUnicas = useMemo(() => {
    const categorias = new Set(kits.map(k => k.categoria || 'Sin categoría'));
    return Array.from(categorias).sort();
  }, [kits]);

  // 🎯 NUEVO: Marcas únicas
  const marcasUnicas = useMemo(() => {
    const marcas = new Set(kits.map(k => k.marca || 'Sin marca'));
    return Array.from(marcas).sort();
  }, [kits]);

  // 🎯 NUEVO: Estadísticas
  const estadisticas = useMemo(() => {
    return {
      total: kits.length,
      activos: kits.filter(k => k.activo).length,
      inactivos: kits.filter(k => !k.activo).length,
      totalPiezas: kits.reduce((acc, kit) => acc + (kit.piezas?.length || 0), 0),
      porCategoria: Object.entries(kitsPorCategoria).map(([cat, ks]) => ({
        categoria: cat,
        cantidad: ks.length
      })).sort((a, b) => b.cantidad - a.cantidad),
    };
  }, [kits, kitsPorCategoria]);

  const [kitForm, setKitForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    marca: '',
    modelo_aplicable: '',
    categoria: '',
    activo: true,
  });

  const [piezaForm, setPiezaForm] = useState({
    numero_parte: '',
    descripcion: '',
    tipo: '',
    cantidad: '1',
    unidad: 'unidad',
    notas: '',
  });

  const handleCreateKit = async () => {
    if (!kitForm.nombre || !kitForm.codigo) return;
    
    try {
      if (editingKit) {
        await updateKit(editingKit.id, kitForm);
      } else {
        await createKit(kitForm);
      }
      setOpenKitDialog(false);
      resetKitForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePieza = async () => {
    if (!piezaForm.numero_parte || !piezaForm.descripcion || !piezaForm.tipo || !selectedKitId) return;
    
    try {
      const piezaData = {
        kit_id: selectedKitId,
        numero_parte: piezaForm.numero_parte,
        descripcion: piezaForm.descripcion,
        tipo: piezaForm.tipo,
        cantidad: parseInt(piezaForm.cantidad) || 1,
        unidad: piezaForm.unidad || 'unidad',
        notas: piezaForm.notas || null,
      };

      if (editingPieza) {
        await updatePieza(editingPieza.id, piezaData);
      } else {
        await createPieza(piezaData);
      }
      setOpenPiezaDialog(false);
      resetPiezaForm();
    } catch (error) {
      console.error(error);
    }
  };

  const resetKitForm = () => {
    setKitForm({
      nombre: '',
      codigo: '',
      descripcion: '',
      marca: '',
      modelo_aplicable: '',
      categoria: '',
      activo: true,
    });
    setEditingKit(null);
  };

  const resetPiezaForm = () => {
    setPiezaForm({
      numero_parte: '',
      descripcion: '',
      tipo: '',
      cantidad: '1',
      unidad: 'unidad',
      notas: '',
    });
    setEditingPieza(null);
    setSelectedKitId(null);
  };

  const handleEditKit = (kit: KitMantenimiento) => {
    setEditingKit(kit);
    setKitForm({
      nombre: kit.nombre,
      codigo: kit.codigo,
      descripcion: kit.descripcion || '',
      marca: kit.marca || '',
      modelo_aplicable: kit.modelo_aplicable || '',
      categoria: kit.categoria || '',
      activo: kit.activo,
    });
    setOpenKitDialog(true);
  };

  const handleEditPieza = (pieza: KitPieza) => {
    setEditingPieza(pieza);
    setSelectedKitId(pieza.kit_id);
    setPiezaForm({
      numero_parte: pieza.numero_parte,
      descripcion: pieza.descripcion,
      tipo: pieza.tipo,
      cantidad: pieza.cantidad.toString(),
      unidad: pieza.unidad,
      notas: pieza.notas || '',
    });
    setOpenPiezaDialog(true);
  };

  const handleDeleteKit = async (id: number) => {
    if (confirm('¿Eliminar este kit? Se eliminarán todas sus piezas.')) {
      await deleteKit(id);
    }
  };

  const handleDeletePieza = async (id: number) => {
    if (confirm('¿Eliminar esta pieza?')) {
      await deletePieza(id);
    }
  };

  const openNewPiezaDialog = (kitId: number) => {
    resetPiezaForm();
    setSelectedKitId(kitId);
    setOpenPiezaDialog(true);
  };

  if (loading) {
    return (
      <Layout title="Kits de Mantenimiento">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kits de Mantenimiento">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8" />
              Kits de Mantenimiento
            </h1>
            <p className="text-muted-foreground mt-1">
              {view === 'index' 
                ? 'Resumen de kits organizados por marca' 
                : selectedMarca 
                  ? `Kits de ${selectedMarca}` 
                  : 'Gestiona kits con números de parte y repuestos'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {view === 'details' && (
              <Button variant="outline" onClick={() => {
                setView('index');
                setSelectedMarca(null);
              }}>
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Volver al índice
              </Button>
            )}
            <Dialog open={openKitDialog} onOpenChange={(open) => {
              setOpenKitDialog(open);
              if (!open) resetKitForm();
            }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Kit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingKit ? 'Editar Kit' : 'Crear Kit de Mantenimiento'}</DialogTitle>
                <DialogDescription>Define un kit con sus piezas y números de parte</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Kit *</Label>
                    <Input
                      id="nombre"
                      value={kitForm.nombre}
                      onChange={(e) => setKitForm({ ...kitForm, nombre: e.target.value })}
                      placeholder="Kit PM2 CAT 320"
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={kitForm.codigo}
                      onChange={(e) => setKitForm({ ...kitForm, codigo: e.target.value })}
                      placeholder="KIT-PM2-320"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={kitForm.marca}
                      onChange={(e) => setKitForm({ ...kitForm, marca: e.target.value })}
                      placeholder="Caterpillar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelo_aplicable">Modelo</Label>
                    <Input
                      id="modelo_aplicable"
                      value={kitForm.modelo_aplicable}
                      onChange={(e) => setKitForm({ ...kitForm, modelo_aplicable: e.target.value })}
                      placeholder="320 GC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      value={kitForm.categoria}
                      onChange={(e) => setKitForm({ ...kitForm, categoria: e.target.value })}
                      placeholder="Excavadora"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={kitForm.descripcion}
                    onChange={(e) => setKitForm({ ...kitForm, descripcion: e.target.value })}
                    placeholder="Descripción del kit..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={kitForm.activo}
                    onCheckedChange={(checked) => setKitForm({ ...kitForm, activo: checked })}
                  />
                  <Label>Kit activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenKitDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateKit}>
                  {editingKit ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {kits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">No hay kits de mantenimiento</p>
              <Button onClick={() => setOpenKitDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Kit
              </Button>
            </CardContent>
          </Card>
        ) : view === 'index' ? (
          // Vista de Índice/Resumen
          <div className="grid gap-6">
            {/* 🎯 PANEL DE FILTROS Y BÚSQUEDA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Búsqueda y Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Búsqueda */}
                  <div className="lg:col-span-2">
                    <Label htmlFor="search-kits">Buscar kits</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-kits"
                        type="search"
                        placeholder="Buscar por nombre, código, piezas..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtro por Categoría */}
                  <div>
                    <Label htmlFor="filtro-categoria-kit">Categoría</Label>
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger id="filtro-categoria-kit">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las categorías</SelectItem>
                        {categoriasUnicas.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Marca */}
                  <div>
                    <Label htmlFor="filtro-marca-kit">Marca</Label>
                    <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                      <SelectTrigger id="filtro-marca-kit">
                        <SelectValue placeholder="Todas las marcas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las marcas</SelectItem>
                        {marcasUnicas.map(marca => (
                          <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Toggle mostrar inactivos */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Switch
                    id="mostrar-inactivos-kits"
                    checked={mostrarInactivos}
                    onCheckedChange={setMostrarInactivos}
                  />
                  <Label htmlFor="mostrar-inactivos-kits" className="cursor-pointer">
                    Mostrar kits inactivos
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 🎯 ESTADÍSTICAS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Total Kits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kitsFiltrados.length !== estadisticas.total && `${kitsFiltrados.length} filtrados`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-500" />
                    Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((estadisticas.activos / estadisticas.total) * 100).toFixed(1)}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <X className="w-4 h-4 text-gray-500" />
                    Inactivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{estadisticas.inactivos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((estadisticas.inactivos / estadisticas.total) * 100).toFixed(1)}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    Total Piezas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.totalPiezas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En {estadisticas.total} kits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    Categorías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categoriasUnicas.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {marcasUnicas.length} marcas
                  </p>
                </CardContent>
              </Card>
            </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-6 h-6" />
                Resumen de Kits por Marca
              </CardTitle>
              <CardDescription>
                Haz clic en una marca para ver sus kits detallados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(kitsPorMarcaFiltrados).map(([marca, kitsGrupo]) => {
                  const kitsActivos = kitsGrupo.filter(k => k.activo).length;
                  const totalPiezas = kitsGrupo.reduce((sum, k) => sum + (k.piezas?.length || 0), 0);
                  
                  return (
                    <Card 
                      key={marca}
                      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50"
                      onClick={() => {
                        setSelectedMarca(marca);
                        setView('details');
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Factory className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                            {marca}
                          </CardTitle>
                          <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Total kits:</span>
                            <Badge variant="secondary" className="group-hover:bg-primary/20">{kitsGrupo.length}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Activos:</span>
                            <Badge variant="default" className="group-hover:bg-primary">{kitsActivos}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Total piezas:</span>
                            <Badge variant="outline" className="group-hover:border-primary">{totalPiezas}</Badge>
                          </div>
                          <div className="pt-2 border-t mt-3">
                            <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors line-clamp-2">
                              {kitsGrupo.slice(0, 3).map(k => k.codigo).join(', ')}
                              {kitsGrupo.length > 3 && '...'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </div>
        ) : (
          // Vista de Detalles (kits filtrados por marca)
          <div className="grid gap-6">
            {kitsFiltrados
              .filter(kit => !selectedMarca || (kit.marca || 'Sin marca') === selectedMarca)
              .map((kit) => (
              <Card key={kit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {kit.nombre}
                        <Badge variant="secondary">{kit.codigo}</Badge>
                        {!kit.activo && <Badge variant="outline">Inactivo</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {kit.marca && `${kit.marca}`}
                        {kit.modelo_aplicable && ` • ${kit.modelo_aplicable}`}
                        {kit.categoria && ` • ${kit.categoria}`}
                      </CardDescription>
                      {kit.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">{kit.descripcion}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditKit(kit)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteKit(kit.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Piezas del Kit
                    </h3>
                    <Button size="sm" onClick={() => openNewPiezaDialog(kit.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Pieza
                    </Button>
                  </div>
                  {kit.piezas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay piezas en este kit</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Parte</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kit.piezas.map((pieza) => (
                          <TableRow key={pieza.id}>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">{pieza.numero_parte}</code>
                            </TableCell>
                            <TableCell>{pieza.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{pieza.tipo}</Badge>
                            </TableCell>
                            <TableCell>{pieza.cantidad} {pieza.unidad}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => handleEditPieza(pieza)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePieza(pieza.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={openPiezaDialog} onOpenChange={(open) => {
          setOpenPiezaDialog(open);
          if (!open) resetPiezaForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPieza ? 'Editar Pieza' : 'Nueva Pieza'}</DialogTitle>
              <DialogDescription>Agrega un repuesto o pieza al kit</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_parte">Número de Parte *</Label>
                  <Input
                    id="numero_parte"
                    value={piezaForm.numero_parte}
                    onChange={(e) => setPiezaForm({ ...piezaForm, numero_parte: e.target.value })}
                    placeholder="322-3155"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <select
                    id="tipo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={piezaForm.tipo}
                    onChange={(e) => setPiezaForm({ ...piezaForm, tipo: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {TIPOS_PIEZA.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion_pieza">Descripción *</Label>
                <Input
                  id="descripcion_pieza"
                  value={piezaForm.descripcion}
                  onChange={(e) => setPiezaForm({ ...piezaForm, descripcion: e.target.value })}
                  placeholder="Filtro de aceite de motor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cantidad">Cantidad *</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={piezaForm.cantidad}
                    onChange={(e) => setPiezaForm({ ...piezaForm, cantidad: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="unidad">Unidad</Label>
                  <Input
                    id="unidad"
                    value={piezaForm.unidad}
                    onChange={(e) => setPiezaForm({ ...piezaForm, unidad: e.target.value })}
                    placeholder="unidad"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notas_pieza">Notas</Label>
                <Textarea
                  id="notas_pieza"
                  value={piezaForm.notas}
                  onChange={(e) => setPiezaForm({ ...piezaForm, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenPiezaDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreatePieza}>
                {editingPieza ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
