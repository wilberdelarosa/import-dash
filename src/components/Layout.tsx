import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, FileUp, Trash2, ListChecks } from 'lucide-react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationButton } from '@/components/NotificationButton';
import { Badge } from '@/components/ui/badge';
import { useSystemConfig } from '@/context/SystemConfigContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { migrateFromLocalStorage, importJsonData, syncJsonData, data: supabaseData, clearDatabase } = useSupabaseDataContext();
  const { importData } = useLocalStorage();
  const { toast } = useToast();
  const { config } = useSystemConfig();

  const importDisabled = !config.permitirImportaciones;

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
    if (importDisabled) {
      toast({
        title: 'Importaciones deshabilitadas',
        description: 'Activa las importaciones manuales desde Configuraciones.',
        variant: 'destructive',
      });
      return;
    }

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

  const handleSmartImport = () => {
    if (importDisabled) {
      toast({
        title: 'Importaciones deshabilitadas',
        description: 'Activa las importaciones manuales desde Configuraciones.',
        variant: 'destructive',
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const imported = await importData(file);
          const summary = await syncJsonData(imported);

          const messages: string[] = [];

          if (summary.equipos.inserted.length) {
            messages.push(`Equipos nuevos: ${summary.equipos.inserted.join(', ')}`);
          }
          if (summary.equipos.updated.length) {
            messages.push(
              `Equipos actualizados: ${summary.equipos.updated
                .map((item) => `${item.ficha} (${item.cambios.join('; ')})`)
                .join(' | ')}`,
            );
          }
          if (summary.inventarios.inserted.length) {
            messages.push(`Inventarios nuevos: ${summary.inventarios.inserted.join(', ')}`);
          }
          if (summary.inventarios.updated.length) {
            messages.push(
              `Inventarios actualizados: ${summary.inventarios.updated
                .map((item) => `${item.codigo} (${item.cambios.join('; ')})`)
                .join(' | ')}`,
            );
          }
          if (summary.mantenimientosProgramados.inserted.length) {
            messages.push(
              `Mantenimientos nuevos: ${summary.mantenimientosProgramados.inserted.join(', ')}`,
            );
          }
          if (summary.mantenimientosProgramados.updated.length) {
            messages.push(
              `Mantenimientos actualizados: ${summary.mantenimientosProgramados.updated
                .map((item) => `${item.ficha} (${item.tipo}) [${item.cambios.join('; ')}]`)
                .join(' | ')}`,
            );
          }

          if (summary.warnings.length) {
            console.warn('Advertencias de importación:', summary.warnings);
          }

          const description = messages.length
            ? messages.join('\n')
            : 'Cambios registrados en la base de datos.';

          toast({
            title:
              summary.totalChanges > 0
                ? 'Sincronización completada'
                : 'Sincronización sin cambios',
            description:
              summary.totalChanges > 0
                ? description
                : 'No se detectaron cambios nuevos en el archivo importado.',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Error desconocido',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">ALITO GROUP SRL</h1>
                <p className="text-muted-foreground">{title}</p>
              </div>
              <Badge variant="outline" className="text-xs">v1.0.0</Badge>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <div className="flex items-center gap-2 justify-end">
                <NotificationButton />
                <ThemeToggle />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:flex-wrap md:justify-end md:gap-3">
              <Button
                variant="outline"
                onClick={handleImport}
                size="sm"
                className="w-full sm:w-auto justify-center"
                disabled={importDisabled}
                title={importDisabled ? 'Importaciones manuales deshabilitadas' : undefined}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Importar JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleSmartImport}
                size="sm"
                className="w-full sm:w-auto justify-center"
                disabled={importDisabled}
                title={importDisabled ? 'Importaciones manuales deshabilitadas' : undefined}
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Sincronizar cambios
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
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
