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
  const {
    data,
    loading,
    createEquipo,
    updateEquipo,
    deleteEquipo,
  } = useSupabaseDataContext();
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const handleVerDetalle = (ficha: string) => {
    setFichaSeleccionada(ficha);
    setDetalleAbierto(true);
  };

  const handleAddEquipo = async (equipo: Omit<Equipo, 'id'>) => {
    try {
      await createEquipo(equipo);
    } catch (error) {
      console.error('Error adding equipo:', error);
    }
  };

  const handleEditEquipo = async (equipo: Equipo) => {
    try {
      await updateEquipo(equipo);
    } catch (error) {
      console.error('Error updating equipo:', error);
    }
  };

  const handleDeleteEquipo = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      try {
        await deleteEquipo(id);
      } catch (error) {
        console.error('Error deleting equipo:', error);
      }
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Equipos</CardDescription>
            <CardTitle className="text-3xl">{data.equipos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equipos Activos</CardDescription>
            <CardTitle className="text-3xl text-success">{equiposActivos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equipos Inactivos</CardDescription>
            <CardTitle className="text-3xl text-destructive">{equiposInactivos}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
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
        <CardContent>
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
    </Layout>
  );
}
