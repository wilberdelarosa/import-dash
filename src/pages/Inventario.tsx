import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Filter, AlertTriangle, Plus, Pencil, Trash2, PackageX, Box } from 'lucide-react';
import type { Inventario as InventarioItem } from '@/types/equipment';

type InventoryFormState = {
  nombre: string;
  numeroParte: string;
  tipo: string;
  sistema: string;
  categoriaEquipo: string;
  cantidad: string;
  stockMinimo: string;
  codigoIdentificacion: string;
  empresaSuplidora: string;
  marcaFabricante: string;
  marcasCompatibles: string;
  modelosCompatibles: string;
  ubicacion: string;
  activo: boolean;
};

const createEmptyFormState = (): InventoryFormState => ({
  nombre: '',
  numeroParte: '',
  tipo: '',
  sistema: '',
  categoriaEquipo: '',
  cantidad: '',
  stockMinimo: '',
  codigoIdentificacion: '',
  empresaSuplidora: '',
  marcaFabricante: '',
  marcasCompatibles: '',
  modelosCompatibles: '',
  ubicacion: '',
  activo: true,
});

const parseList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatList = (values: string[]) => values.join(', ');

export default function Inventario() {
  const {
    data,
    loading,
    createInventario,
    updateInventario,
    deleteInventario,
  } = useSupabaseDataContext();
  
  const inventarios = useMemo(() => data.inventarios ?? [], [data.inventarios]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
  const [form, setForm] = useState<InventoryFormState>(createEmptyFormState());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventarioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tipos = useMemo(
    () => Array.from(new Set(inventarios.map((item) => item.tipo))).sort(),
    [inventarios],
  );

  const inventariosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return inventarios.filter((item) => {
      const matchesTipo = filterTipo === 'all' || item.tipo === filterTipo;
      if (!matchesTipo) return false;
      if (!term) return true;

      const searchable = [
        item.nombre,
        item.numeroParte,
        item.codigoIdentificacion,
        item.marcaFabricante ?? '',
        item.empresaSuplidora ?? '',
        item.marcasCompatibles.join(' '),
        item.modelosCompatibles.join(' '),
        item.categoriaEquipo,
        item.sistema ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [inventarios, searchTerm, filterTipo]);

  const totalItems = inventariosFiltrados.length;
  const stockBajo = inventariosFiltrados.filter(
    (item) => item.cantidad <= Math.max(item.stockMinimo, 0),
  ).length;
  const sinStock = inventariosFiltrados.filter((item) => item.cantidad === 0).length;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(createEmptyFormState());
    setOpenForm(true);
  };

  const handleOpenEdit = (item: InventarioItem) => {
    setEditingItem(item);
    setForm({
      nombre: item.nombre,
      numeroParte: item.numeroParte,
      tipo: item.tipo,
      sistema: item.sistema ?? '',
      categoriaEquipo: item.categoriaEquipo,
      cantidad: String(item.cantidad),
      stockMinimo: String(item.stockMinimo),
      codigoIdentificacion: item.codigoIdentificacion,
      empresaSuplidora: item.empresaSuplidora ?? '',
      marcaFabricante: item.marcaFabricante ?? '',
      marcasCompatibles: formatList(item.marcasCompatibles),
      modelosCompatibles: formatList(item.modelosCompatibles),
      ubicacion: item.ubicacion ?? '',
      activo: item.activo,
    });
    setOpenForm(true);
  };

  const resetFormState = () => {
    setForm(createEmptyFormState());
    setEditingItem(null);
  };

  const buildPayload = (): Omit<InventarioItem, 'id'> => {
    const marcas = parseList(form.marcasCompatibles);
    const modelos = parseList(form.modelosCompatibles);
    const cantidad = Number(form.cantidad) || 0;
    const stockMinimo = Number(form.stockMinimo) || 0;

    return {
      nombre: form.nombre.trim(),
      numeroParte: form.numeroParte.trim() || form.codigoIdentificacion.trim(),
      tipo: form.tipo.trim() || 'Consumible',
      sistema: form.sistema.trim() || null,
      categoriaEquipo: form.categoriaEquipo.trim() || 'General',
      cantidad,
      stockMinimo,
      movimientos: editingItem?.movimientos ?? [],
      activo: form.activo,
      codigoIdentificacion: form.codigoIdentificacion.trim(),
      ubicacion: form.ubicacion.trim() || null,
      empresaSuplidora: form.empresaSuplidora.trim(),
      marcaFabricante: form.marcaFabricante.trim() || null,
      marcasCompatibles: marcas,
      modelosCompatibles: modelos,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.codigoIdentificacion.trim()) return;

    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (editingItem) {
        await updateInventario(editingItem.id, payload);
      } else {
        await createInventario(payload);
      }
      setOpenForm(false);
      resetFormState();
    } catch {
      // feedback handled inside hook toasts
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteInventario(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // toast triggered in hook
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Inventario de Repuestos">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Cargando inventario...</div>
        </div>
      </Layout>
    );
  }

  const isFormValid = Boolean(form.nombre.trim()) && Boolean(form.codigoIdentificacion.trim());

  return (
    <Layout title="Inventario de Repuestos">

      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-primary">
            <div className="absolute right-0 top-0 h-full w-24 bg-primary/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total Items</CardDescription>
                <div className="rounded-full bg-primary/10 p-2 transition-transform group-hover:scale-110">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-primary">{totalItems}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Piezas en catálogo</p>
            </CardHeader>
          </Card>
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-amber-500">
            <div className="absolute right-0 top-0 h-full w-24 bg-amber-500/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Stock ≤ umbral</CardDescription>
                <div className="rounded-full bg-amber-500/10 p-2 transition-transform group-hover:scale-110">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-amber-600">{stockBajo}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardHeader>
          </Card>
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-destructive">
            <div className="absolute right-0 top-0 h-full w-24 bg-destructive/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Sin stock</CardDescription>
                <div className="rounded-full bg-destructive/10 p-2 transition-transform group-hover:scale-110">
                  <PackageX className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-destructive">{sinStock}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Necesitan reabastecimiento</p>
            </CardHeader>
          </Card>
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-emerald-500">
            <div className="absolute right-0 top-0 h-full w-24 bg-emerald-500/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Modelos cubiertos</CardDescription>
                <div className="rounded-full bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                  <Box className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-emerald-600">
                {new Set(inventarios.flatMap((item) => item.modelosCompatibles)).size}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Equipos compatibles</p>
            </CardHeader>
          </Card>
        </section>

        <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary/30">
          <CardHeader className="space-y-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  Inventario de repuestos y filtros
                </CardTitle>
                <CardDescription className="text-sm">
                  Gestiona números de parte, compatibilidades y existencias para cada equipo
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreate} className="shadow-md hover:shadow-lg transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo item
              </Button>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, codigo o modelo compatible..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full lg:w-[220px]">
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
                <Table className="w-full min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Nombre / Marca</TableHead>
                      <TableHead>Categoria / Sistema</TableHead>
                      <TableHead>Compatibilidad</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="min-w-[160px]">Ubicacion y estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventariosFiltrados.map((item) => {
                      const isCritical = item.cantidad === 0;
                      const isLow = !isCritical && item.cantidad <= item.stockMinimo;

                      return (
                        <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors duration-200">
                          <TableCell>
                            <div className="font-semibold">{item.codigoIdentificacion}</div>
                            <div className="text-xs text-muted-foreground">{item.numeroParte}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.marcaFabricante || 'Sin marca'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{item.categoriaEquipo}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.sistema || 'Sistema general'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.marcasCompatibles.slice(0, 2).map((marca) => (
                                <Badge key={marca} variant="outline" className="text-xs">
                                  {marca}
                                </Badge>
                              ))}
                              {item.marcasCompatibles.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.marcasCompatibles.length - 2}
                                </Badge>
                              )}
                            </div>
                            {item.modelosCompatibles.length > 0 ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.modelosCompatibles.slice(0, 3).join(', ')}
                                {item.modelosCompatibles.length > 3 &&
                                  ` +${item.modelosCompatibles.length - 3}`}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-muted-foreground">Sin modelos definidos</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCritical ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 border border-destructive/20">
                                <PackageX className="h-4 w-4 text-destructive" />
                                <span className="font-bold text-destructive">{item.cantidad}</span>
                                <span className="text-xs text-muted-foreground">/ {item.stockMinimo}</span>
                              </div>
                            ) : isLow ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 border border-amber-500/20">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="font-bold text-amber-600">{item.cantidad}</span>
                                <span className="text-xs text-muted-foreground">/ {item.stockMinimo}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
                                <Package className="h-4 w-4 text-emerald-600" />
                                <span className="font-bold text-emerald-600">{item.cantidad}</span>
                                <span className="text-xs text-muted-foreground">/ {item.stockMinimo}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={item.activo ? 'default' : 'secondary'}>
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                              {item.ubicacion && (
                                <span className="text-xs text-muted-foreground">Ubicacion: {item.ubicacion}</span>
                              )}
                              {item.empresaSuplidora && (
                                <span className="text-xs text-muted-foreground">
                                  Proveedor: {item.empresaSuplidora}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(item)}
                                aria-label={`Editar ${item.nombre}`}
                                title={`Editar ${item.nombre}`}
                                className="hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTarget(item)}
                                aria-label={`Eliminar ${item.nombre}`}
                                title={`Eliminar ${item.nombre}`}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {inventariosFiltrados.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No se encontraron items que coincidan con la busqueda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) {
            resetFormState();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar item' : 'Registrar repuesto'}</DialogTitle>
            <DialogDescription>
              Define los datos del inventario, compatibilidades y umbrales de abastecimiento.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="text-sm font-medium">
                  Nombre *
                </label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  placeholder="Filtro de aceite motor"
                />
              </div>
              <div>
                <label htmlFor="codigo" className="text-sm font-medium">
                  Codigo interno *
                </label>
                <Input
                  id="codigo"
                  value={form.codigoIdentificacion}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, codigoIdentificacion: event.target.value }))
                  }
                  placeholder="FLT-320-PM2"
                />
              </div>
              <div>
                <label htmlFor="numeroParte" className="text-sm font-medium">
                  Numero de parte fabricante
                </label>
                <Input
                  id="numeroParte"
                  value={form.numeroParte}
                  onChange={(event) => setForm((prev) => ({ ...prev, numeroParte: event.target.value }))}
                  placeholder="322-3155"
                />
              </div>
              <div>
                <label htmlFor="tipo" className="text-sm font-medium">
                  Tipo
                </label>
                <Input
                  id="tipo"
                  value={form.tipo}
                  onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
                  placeholder="Filtro / Aceite / Lubricante"
                />
              </div>
              <div>
                <label htmlFor="categoria" className="text-sm font-medium">
                  Categoria del equipo
                </label>
                <Input
                  id="categoria"
                  value={form.categoriaEquipo}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoriaEquipo: event.target.value }))}
                  placeholder="Excavadora, Cargador..."
                />
              </div>
              <div>
                <label htmlFor="sistema" className="text-sm font-medium">
                  Sistema
                </label>
                <Input
                  id="sistema"
                  value={form.sistema}
                  onChange={(event) => setForm((prev) => ({ ...prev, sistema: event.target.value }))}
                  placeholder="Motor, Hidraulico, Combustible..."
                />
              </div>
              <div>
                <label htmlFor="cantidad" className="text-sm font-medium">
                  Stock disponible
                </label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  value={form.cantidad}
                  onChange={(event) => setForm((prev) => ({ ...prev, cantidad: event.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="stockMinimo" className="text-sm font-medium">
                  Stock minimo
                </label>
                <Input
                  id="stockMinimo"
                  type="number"
                  min="0"
                  value={form.stockMinimo}
                  onChange={(event) => setForm((prev) => ({ ...prev, stockMinimo: event.target.value }))}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="marcas" className="text-sm font-medium">
                  Marcas compatibles
                </label>
                <Textarea
                  id="marcas"
                  value={form.marcasCompatibles}
                  onChange={(event) => setForm((prev) => ({ ...prev, marcasCompatibles: event.target.value }))}
                  placeholder="Caterpillar, Komatsu..."
                />
                <p className="mt-1 text-xs text-muted-foreground">Separar por coma o salto de linea.</p>
              </div>
              <div>
                <label htmlFor="modelos" className="text-sm font-medium">
                  Modelos / fichas compatibles
                </label>
                <Textarea
                  id="modelos"
                  value={form.modelosCompatibles}
                  onChange={(event) => setForm((prev) => ({ ...prev, modelosCompatibles: event.target.value }))}
                  placeholder="216B3, 320-07..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Usa el nombre comercial que usara el equipo de mantenimiento.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="ubicacion" className="text-sm font-medium">
                  Ubicacion en almacen
                </label>
                <Input
                  id="ubicacion"
                  value={form.ubicacion}
                  onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                  placeholder="Pasillo A / Rack 01"
                />
              </div>
              <div>
                <label htmlFor="proveedor" className="text-sm font-medium">
                  Proveedor
                </label>
                <Input
                  id="proveedor"
                  value={form.empresaSuplidora}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, empresaSuplidora: event.target.value }))
                  }
                  placeholder="Dealer Caterpillar"
                />
              </div>
              <div>
                <label htmlFor="marcaFabricante" className="text-sm font-medium">
                  Marca fabricante
                </label>
                <Input
                  id="marcaFabricante"
                  value={form.marcaFabricante}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, marcaFabricante: event.target.value }))
                  }
                  placeholder="Cat, Donaldson..."
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  checked={form.activo}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))}
                />
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">Disponible para usar</p>
                  <p className="text-xs text-muted-foreground">
                    Desactiva el item si se encuentra descontinuado o fuera de catalogo.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isFormValid || submitting}>
                {submitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item del inventario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer y se eliminara el registro de {deleteTarget?.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

