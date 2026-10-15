import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { equipmentFields, type EquipmentSearchField, type EquipmentSortDirection, type EquipmentSortField } from '@/lib/equipment-list';

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  searchField: EquipmentSearchField;
  onSearchFieldChange: (value: EquipmentSearchField) => void;
  sortField: EquipmentSortField;
  onSortFieldChange: (value: EquipmentSortField) => void;
  direction: EquipmentSortDirection;
  onDirectionChange: (value: EquipmentSortDirection) => void;
}

export function EquipmentFieldControls(props: Props) {
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2">
    <div className="space-y-1.5 min-w-0">
      <span className="text-xs font-medium text-muted-foreground">Buscar en</span>
      <Select value={props.searchField} onValueChange={value => props.onSearchFieldChange(value as EquipmentSearchField)}>
        <SelectTrigger aria-label="Campo de búsqueda" className="h-11 w-full min-w-0"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos los campos</SelectItem>{equipmentFields.map(field => <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5 min-w-0">
      <span className="text-xs font-medium text-muted-foreground">Buscar</span>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar equipos" placeholder="Buscar equipos…" value={props.query} onChange={event => props.onQueryChange(event.target.value)} className="h-11 pl-10" /></div>
    </div>
    <div className="space-y-1.5 min-w-0 sm:col-span-2">
      <span className="text-xs font-medium text-muted-foreground">Ordenar por</span>
      <div className="flex min-w-0 gap-2">
        <Select value={props.sortField} onValueChange={value => props.onSortFieldChange(value as EquipmentSortField)}>
          <SelectTrigger aria-label="Ordenar por" className="h-11 min-w-0 flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>{equipmentFields.map(field => <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label={props.direction === 'asc' ? 'Cambiar a descendente' : 'Cambiar a ascendente'} title={props.direction === 'asc' ? 'Ascendente' : 'Descendente'} onClick={() => props.onDirectionChange(props.direction === 'asc' ? 'desc' : 'asc')}>
          {props.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  </div>;
}