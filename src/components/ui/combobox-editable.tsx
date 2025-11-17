import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ComboboxEditableProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
  className?: string;
}

export function ComboboxEditable({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  allowCustom = true,
  className,
}: ComboboxEditableProps) {
  const [open, setOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? '' : selectedValue);
    setOpen(false);
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onValueChange(customValue.trim());
      setCustomValue('');
      setCustomDialogOpen(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className={cn('flex flex-col gap-2', className)}>
        {label && <Label>{label}</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {value || placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={`Buscar ${label?.toLowerCase() || 'opción'}...`} />
              <CommandList>
                <CommandEmpty>
                  No se encontraron resultados.
                  {allowCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setCustomDialogOpen(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar nuevo
                    </Button>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                  {allowCustom && options.length > 0 && (
                    <CommandItem
                      onSelect={() => {
                        setCustomDialogOpen(true);
                        setOpen(false);
                      }}
                      className="border-t"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar nuevo
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {allowCustom && (
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar {label || 'nuevo valor'}</DialogTitle>
              <DialogDescription>
                Ingresa un nuevo valor que no está en la lista.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-value">{label || 'Valor'}</Label>
                <Input
                  id="custom-value"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={`Nuevo ${label?.toLowerCase() || 'valor'}...`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomDialogOpen(false);
                  setCustomValue('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddCustom} disabled={!customValue.trim()}>
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
