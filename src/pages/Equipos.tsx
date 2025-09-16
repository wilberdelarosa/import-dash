import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { EquiposTable } from '@/components/equipos/EquiposTable';
import { EquipoDialog } from '@/components/equipos/EquipoDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { Equipo } from '@/types/equipment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Equipos() {
  const { data, saveData, loading } = useLocalStorage();
  const { toast } = useToast();

  const handleAddEquipo = (equipoData: Omit<Equipo, 'id'>) => {
    const newId = Math.max(0, ...data.equipos.map(e => e.id)) + 1;
    const newEquipo = { ...equipoData, id: newId };
    const updatedData = {
      ...data,
      equipos: [...data.equipos, newEquipo]
    };
    saveData(updatedData);
    toast({
      title: "Equipo agregado",
      description: "El equipo ha sido agregado exitosamente.",
    });
  };

  const handleEditEquipo = (equipoData: Equipo) => {
    const updatedData = {
      ...data,
      equipos: data.equipos.map(e => e.id === equipoData.id ? equipoData : e)
    };
    saveData(updatedData);
    toast({
      title: "Equipo actualizado",
      description: "El equipo ha sido actualizado exitosamente.",
    });
  };

  const handleDeleteEquipo = (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar este equipo?')) {
      const updatedData = {
        ...data,
        equipos: data.equipos.filter(e => e.id !== id)
      };
      saveData(updatedData);
      toast({
        title: "Equipo eliminado",
        description: "El equipo ha sido eliminado exitosamente.",
      });
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