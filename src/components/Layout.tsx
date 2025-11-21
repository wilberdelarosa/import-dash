import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, FileUp, Trash2, ListChecks } from 'lucide-react';
import DataActionsToggle from '@/components/DataActionsToggle';
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
import BottomNav from '@/components/BottomNav';
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
      {/* Header: Compacto en móvil, completo en desktop */}
      <header className="border-b border-border/60 bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:border-border/40 dark:bg-card/70">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          {/* Desktop layout */}
          <div className="hidden sm:flex flex-col gap-4">
            {/* Fila 1: Logo, Título y Versión */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <BrandLogo />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Panel activo</p>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Administra importaciones, sincronizaciones y respaldos del sistema.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CommandPalette />
                <NotificationButton />
                <ThemeToggle />
                <Badge variant="outline" className="text-xs uppercase tracking-wider px-3 py-1.5">
                  V3.0.0
                </Badge>
              </div>
            </div>
            
            {/* Fila 2: Acciones de datos */}
            <div className="flex items-center gap-2">
              <DataActionsToggle
                onImport={handleImport}
                onExport={handleExport}
                onMigrate={handleMigrate}
                onSmartImport={handleSmartImport}
                onClear={handleClear}
                importDisabled={importDisabled}
              />
            </div>
          </div>
          
          {/* Mobile layout - más simple */}
          <div className="flex sm:hidden items-center justify-between">
            <h1 className="text-lg font-bold truncate">{title}</h1>
            <div className="flex items-center gap-2">
              <CommandPalette />
              <NotificationButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
        <Navigation hideBrand />
      </header>
      
      {/* Main content */}
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:py-8 sm:px-6 lg:px-8 pb-20 sm:pb-8">
        {children}
      </main>
      
      {/* Bottom navigation: solo móvil */}
      <BottomNav />

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
