import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, FileUp, Trash2 } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { migrateFromLocalStorage, data: supabaseData, clearDatabase } = useSupabaseData();
  const { importData } = useLocalStorage();
  const { toast } = useToast();

  const handleMigrate = async () => {
    await migrateFromLocalStorage();
  };

  const handleClear = async () => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar todos los datos de la base de datos? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    await clearDatabase();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(supabaseData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Éxito",
      description: "Datos exportados correctamente desde la base de datos.",
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importData(file);
          toast({
            title: "Éxito",
            description: "Datos importados a localStorage correctamente. Usa 'Migrar a DB' para pasarlos a la base de datos.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error desconocido",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Sistema de Gestión de Equipos</h1>
              <p className="text-muted-foreground">{title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImport} size="sm">
                <FileUp className="w-4 h-4 mr-2" />
                Importar JSON
              </Button>
              <Button variant="outline" onClick={handleMigrate} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Migrar a DB
              </Button>
              <Button variant="destructive" onClick={handleClear} size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar Datos
              </Button>
              <Button variant="outline" onClick={handleExport} size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
