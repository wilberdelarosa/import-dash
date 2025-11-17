import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { EquiposTable } from '@/components/equipos/EquiposTable';
import { EquipoDialog } from '@/components/equipos/EquipoDialog';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Equipo } from '@/types/equipment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Equipos() {
  const { data, loading, createEquipo, updateEquipo, deleteEquipo } = useSupabaseDataContext();
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState<number | null>(null);

  const handleVerDetalle = (ficha: string) => {
    setFichaSeleccionada(ficha);
    setDetalleAbierto(true);
  };

  const handleAddEquipo = async (equipo: Omit<Equipo, 'id'>) => {
    await createEquipo(equipo);
  };

  const handleEditEquipo = async (equipo: Equipo) => {
    const { id, ...payload } = equipo;
    await updateEquipo(id, payload);
  };

  const handleDeleteEquipo = async (id: number) => {
    setEquipoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (equipoToDelete !== null) {
      await deleteEquipo(equipoToDelete);
      setEquipoToDelete(null);
    }
    setConfirmOpen(false);
  };

  if (loading) {
    return (
      <Layout title="Gestión de Equipos">
        <div className="space-y-6 lg:space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-16" />
                </CardHeader>
              </Card>
            ))}
          </section>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const equiposActivos = data.equipos.filter(e => e.activo).length;
  const equiposInactivos = data.equipos.filter(e => !e.activo).length;

  return (
    <Layout title="Gestión de Equipos">

      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-primary sm:col-span-2 lg:col-span-1">
            <div className="absolute right-0 top-0 h-full w-24 bg-primary/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total de Equipos</CardDescription>
                <div className="rounded-full bg-primary/10 p-2 transition-transform group-hover:scale-110">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-primary">{data.equipos.length}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Maquinaria registrada</p>
            </CardHeader>
          </Card>
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-emerald-500 sm:col-span-1">
            <div className="absolute right-0 top-0 h-full w-24 bg-emerald-500/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Equipos Activos</CardDescription>
                <div className="rounded-full bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-emerald-600">{equiposActivos}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">En operación</p>
            </CardHeader>
          </Card>
          <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 border-l-amber-500 sm:col-span-1">
            <div className="absolute right-0 top-0 h-full w-24 bg-amber-500/5 transform skew-x-12 translate-x-8" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Equipos Inactivos</CardDescription>
                <div className="rounded-full bg-amber-500/10 p-2 transition-transform group-hover:scale-110">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-amber-600">{equiposInactivos}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Fuera de servicio</p>
            </CardHeader>
          </Card>
        </section>

        <Card className="overflow-hidden shadow-lg border-t-4 border-t-primary/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  Catálogo de Equipos y Maquinaria
                </CardTitle>
                <CardDescription className="text-sm">
                  Administra tu inventario completo de equipos, maquinaria y vehículos
                </CardDescription>
              </div>
              <EquipoDialog onSave={handleAddEquipo} />
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-6">
            <EquiposTable
              equipos={data.equipos}
              onEdit={handleEditEquipo}
              onDelete={handleDeleteEquipo}
              onVerDetalle={handleVerDetalle}
            />
          </CardContent>
        </Card>

        <EquipoDetalleUnificado
          ficha={fichaSeleccionada}
          open={detalleAbierto}
          onOpenChange={setDetalleAbierto}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmDelete}
        title="Eliminar equipo"
        description="¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Layout>
  );
}
