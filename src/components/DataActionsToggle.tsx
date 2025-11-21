import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { FileUp, FileDown, RefreshCw, ListChecks, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onImport: () => void;
  onExport: () => void;
  onMigrate: () => void;
  onSmartImport: () => void;
  onClear: () => void;
  importDisabled?: boolean;
}

export default function DataActionsToggle({
  onImport,
  onExport,
  onMigrate,
  onSmartImport,
  onClear,
  importDisabled = false,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <PopoverTrigger asChild>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                // clicking icon toggles popover
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              title="Acciones"
            >
              <ListChecks className="h-4 w-4" />
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-2" side="bottom" align="end">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onImport();
                setOpen(false);
              }}
              disabled={importDisabled}
              className={cn('gap-2')}
            >
              <FileUp className="h-4 w-4" />
              <span>Importar JSON</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onMigrate();
                setOpen(false);
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Migrar a DB</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onExport();
                setOpen(false);
              }}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              <span>Exportar JSON</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSmartImport();
                setOpen(false);
              }}
              disabled={importDisabled}
              className="gap-2"
            >
              <ListChecks className="h-4 w-4" />
              <span>Sincronizar</span>
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              title="Vaciar datos"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}
