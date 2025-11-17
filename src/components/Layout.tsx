import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, FileUp, Trash2, ListChecks } from 'lucide-react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationButton } from '@/components/NotificationButton';
import { Badge } from '@/components/ui/badge';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Navigation } from '@/components/Navigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CommandPalette } from '@/components/CommandPalette';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const {
    migrateFromLocalStorage,
    importJsonData,
    syncJsonData,
    data: supabaseData,
    clearDatabase,
  } = useSupabaseDataContext();
  const { importData } = useLocalStorage();
  const { toast } = useToast();
  const { config } = useSystemConfig();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const importDisabled = !config.permitirImportaciones;

  const handleMigrate = async () => {
    await migrateFromLocalStorage();
  };

  const handleClear = async () => {
    setConfirmClearOpen(true);
  };

  const confirmClear = async () => {
    await clearDatabase();
    setConfirmClearOpen(false);
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
      title: 'Éxito',
      description: 'Datos exportados correctamente desde la base de datos.',
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
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const imported = await importData(file);
          await importJsonData(imported);
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
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
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
            messages.push(`Mantenimientos nuevos: ${summary.mantenimientosProgramados.inserted.join(', ')}`);
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

          const description = messages.length ? messages.join('\n') : 'Cambios registrados en la base de datos.';

          toast({
            title: summary.totalChanges > 0 ? 'Sincronización completada' : 'Sincronización sin cambios',
            description:
              summary.totalChanges > 0 ? description : 'No se detectaron cambios nuevos en el archivo importado.',
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <BrandLogo />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Panel activo</p>
                    <div className="h-px w-8 bg-gradient-to-r from-primary via-transparent to-transparent" />
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">{title}</p>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    En este panel puedes ver el estado global del sistema y administrar importaciones, sincronizaciones
                    y respaldos desde una sola línea de comandos.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs uppercase tracking-[0.35em] px-3 py-1">
                v1.0.0
              </Badge>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleImport}
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:shadow-md"
                  disabled={importDisabled}
                  title={importDisabled ? 'Importaciones manuales deshabilitadas' : undefined}
                >
                  <FileUp className="h-4 w-4" />
                  Importar JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMigrate}
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:shadow-md"
                >
                  <RefreshCw className="h-4 w-4" />
                  Migrar a DB
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/50 hover:shadow-md"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSmartImport}
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 hover:shadow-md"
                  disabled={importDisabled}
                  title={importDisabled ? 'Importaciones manuales deshabilitadas' : undefined}
                >
                  <ListChecks className="h-4 w-4" />
                  Sincronizar cambios
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClear}
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Vaciar datos
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <CommandPalette />
                <NotificationButton />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
        <Navigation hideBrand />
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-muted/20">{children}</main>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        onConfirm={confirmClear}
        title="Vaciar base de datos"
        description="¿Está seguro de que desea eliminar todos los datos de la base de datos? Esta acción es irreversible y se perderá toda la información."
        confirmText="Eliminar todo"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
