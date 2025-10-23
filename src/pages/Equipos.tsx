import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { EquiposTable } from '@/components/equipos/EquiposTable';
import { EquipoDialog } from '@/components/equipos/EquipoDialog';
import { EquipoDetalleUnificado } from '@/components/EquipoDetalleUnificado';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { Equipo } from '@/types/equipment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Equipos() {
  const { data, loading, createEquipo, updateEquipo, deleteEquipo } = useSupabaseDataContext();
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

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
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      await deleteEquipo(id);
    }
  };

  if (loading) {
    return (
      <Layout title="Gestión de Equipos">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const equiposActivos = data.equipos.filter(e => e.activo).length;
  const equiposInactivos = data.equipos.filter(e => !e.activo).length;

  return (
    <Layout title="Gestión de Equipos">
      <Navigation />

      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Total de Equipos</CardDescription>
              <CardTitle className="text-3xl">{data.equipos.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="sm:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Equipos Activos</CardDescription>
              <CardTitle className="text-3xl text-success">{equiposActivos}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="sm:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Equipos Inactivos</CardDescription>
              <CardTitle className="text-3xl text-destructive">{equiposInactivos}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Equipos</CardTitle>
                <CardDescription>
                  Administra tu inventario de equipos y maquinaria
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
    </Layout>
  );
}
