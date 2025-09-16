import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { exportData, importData, loadSampleData } = useLocalStorage();
  const { toast } = useToast();

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
            title: "Importación exitosa",
            description: "Los datos han sido importados correctamente.",
          });
          window.location.reload();
        } catch (error) {
          toast({
            title: "Error de importación",
            description: "No se pudieron importar los datos. Verifica el formato del archivo.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const handleLoadSample = async () => {
    try {
      await loadSampleData();
      toast({
        title: "Datos de muestra cargados",
        description: "Los datos de muestra han sido cargados correctamente.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de muestra.",
        variant: "destructive",
      });
    }
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
              <Button variant="outline" onClick={handleLoadSample} size="sm">
                <Database className="w-4 h-4 mr-2" />
                Cargar Datos de Muestra
              </Button>
              <Button variant="outline" onClick={handleImport} size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar JSON
              </Button>
              <Button onClick={exportData} size="sm">
                <Download className="w-4 h-4 mr-2" />
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