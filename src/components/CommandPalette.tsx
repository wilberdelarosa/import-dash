import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { 
  Search, 
  Wrench, 
  Package, 
  Calendar, 
  Truck,
  AlertTriangle,
  FileText,
  Settings,
  LayoutDashboard,
  History,
  ClipboardList,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data } = useSupabaseDataContext();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Filtrar equipos por búsqueda
  const equiposFiltrados = useMemo(() => {
    if (!search) return data.equipos.slice(0, 5);
    const searchLower = search.toLowerCase();
    return data.equipos
      .filter(e => 
        e.nombre.toLowerCase().includes(searchLower) ||
        e.ficha.toLowerCase().includes(searchLower) ||
        e.marca.toLowerCase().includes(searchLower) ||
        e.modelo.toLowerCase().includes(searchLower)
      )
      .slice(0, 5);
  }, [data.equipos, search]);

  // Mantenimientos próximos
  const mantenimientosProximos = useMemo(() => {
    return data.mantenimientosProgramados
      .filter(m => m.activo && m.horasKmRestante > 0 && m.horasKmRestante <= 100)
      .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
      .slice(0, 5);
  }, [data.mantenimientosProgramados]);

  // Inventario con stock bajo
  const inventarioBajoStock = useMemo(() => {
    return data.inventarios
      .filter(inv => inv.activo && inv.cantidad <= inv.stockMinimo)
      .sort((a, b) => a.cantidad - b.cantidad)
      .slice(0, 5);
  }, [data.inventarios]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <>
      {/* Botón para abrir en mobile */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar equipos, mantenimientos, inventario..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          {/* Navegación rápida */}
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => handleSelect(() => navigate('/'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/equipos'))}>
              <Truck className="mr-2 h-4 w-4" />
              <span>Equipos</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/control-mantenimiento'))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Control Mantenimiento</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/inventario'))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Inventario</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/mantenimiento'))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Mantenimiento</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/historial'))}>
              <History className="mr-2 h-4 w-4" />
              <span>Historial</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/reportes'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Reportes</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => navigate('/configuraciones'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuraciones</span>
            </CommandItem>
          </CommandGroup>

          {equiposFiltrados.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Equipos">
                {equiposFiltrados.map((equipo) => (
                  <CommandItem
                    key={equipo.id}
                    value={`equipo-${equipo.ficha}-${equipo.nombre}`}
                    onSelect={() => handleSelect(() => navigate('/equipos', { state: { searchFicha: equipo.ficha } }))}
                  >
                    <Truck className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium">{equipo.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {equipo.ficha} • {equipo.marca} {equipo.modelo}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {mantenimientosProximos.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Mantenimientos Próximos">
                {mantenimientosProximos.map((mant) => (
                  <CommandItem
                    key={mant.id}
                    value={`mant-${mant.ficha}-${mant.tipoMantenimiento}`}
                    onSelect={() => handleSelect(() => navigate('/control-mantenimiento', { state: { searchFicha: mant.ficha } }))}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-amber-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">{mant.nombreEquipo}</span>
                      <span className="text-xs text-muted-foreground">
                        {mant.tipoMantenimiento} • Faltan {Math.round(mant.horasKmRestante)} hrs
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {inventarioBajoStock.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Inventario - Stock Bajo">
                {inventarioBajoStock.map((inv) => (
                  <CommandItem
                    key={inv.id}
                    value={`inv-${inv.codigoIdentificacion}-${inv.nombre}`}
                    onSelect={() => handleSelect(() => navigate('/inventario'))}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                    <div className="flex flex-col">
                      <span className="font-medium">{inv.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {inv.codigoIdentificacion} • Stock: {inv.cantidad} / Min: {inv.stockMinimo}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
