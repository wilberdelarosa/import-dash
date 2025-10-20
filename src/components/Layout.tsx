import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, FileUp, Trash2 } from 'lucide-react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationButton } from '@/components/NotificationButton';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { migrateFromLocalStorage, importJsonData, data: supabaseData, clearDatabase } = useSupabaseDataContext();
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
          const imported = await importData(file);
          await importJsonData(imported);
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70">

        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">ALITO GROUP SRL</h1>
                <p className="text-muted-foreground">{title}</p>
              </div>
              <Badge variant="outline" className="text-xs">v1.0.0</Badge>
            </div>
            <div className="flex items-center gap-2">
              <NotificationButton />
              <ThemeToggle />
              <div className="h-6 w-px bg-border mx-2" />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 lg:justify-end">
              <Button
                variant="outline"
                onClick={handleImport}
                size="sm"
                className="w-full sm:w-auto justify-center"
              >
                <FileUp className="w-4 h-4 mr-2" />
                Importar JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleMigrate}
                size="sm"
                className="w-full sm:w-auto justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Migrar a DB
              </Button>
              <Button
                variant="destructive"
                onClick={handleClear}
                size="sm"
                className="w-full sm:w-auto justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar Datos
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                size="sm"
                className="w-full sm:w-auto justify-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
              </div>
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
