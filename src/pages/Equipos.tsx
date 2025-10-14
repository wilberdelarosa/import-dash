import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { EquiposTable } from '@/components/equipos/EquiposTable';
import { EquipoDialog } from '@/components/equipos/EquipoDialog';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Equipo } from '@/types/equipment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Equipos() {
  const { data, loading, loadData } = useSupabaseData();
  const { toast } = useToast();

  const handleAddEquipo = async (equipo: Omit<Equipo, 'id'>) => {
    try {
      const { error } = await supabase.from('equipos').insert({
        ficha: equipo.ficha,
        nombre: equipo.nombre,
        marca: equipo.marca,
        modelo: equipo.modelo,
        numero_serie: equipo.numeroSerie,
        placa: equipo.placa,
        categoria: equipo.categoria,
        activo: equipo.activo,
        motivo_inactividad: equipo.motivoInactividad
      });

      if (error) throw error;

      await loadData();
      toast({
        title: "Éxito",
        description: "Equipo agregado correctamente",
      });
    } catch (error) {
      console.error('Error adding equipo:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el equipo",
        variant: "destructive"
      });
    }
  };

  const handleEditEquipo = async (equipo: Equipo) => {
    try {
      const { error } = await supabase
        .from('equipos')
        .update({
          ficha: equipo.ficha,
          nombre: equipo.nombre,
          marca: equipo.marca,
          modelo: equipo.modelo,
          numero_serie: equipo.numeroSerie,
          placa: equipo.placa,
          categoria: equipo.categoria,
          activo: equipo.activo,
          motivo_inactividad: equipo.motivoInactividad
        })
        .eq('id', equipo.id);

      if (error) throw error;

      await loadData();
      toast({
        title: "Éxito",
        description: "Equipo actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating equipo:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el equipo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEquipo = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      try {
        const { error } = await supabase
          .from('equipos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await loadData();
        toast({
          title: "Éxito",
          description: "Equipo eliminado correctamente",
        });
      } catch (error) {
        console.error('Error deleting equipo:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el equipo",
          variant: "destructive"
        });
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
          <div className="flex justify-between items-center">
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
          />
        </CardContent>
      </Card>
    </Layout>
  );
}
