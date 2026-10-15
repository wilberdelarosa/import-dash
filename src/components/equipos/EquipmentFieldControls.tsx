import { FieldFilterControls } from '@/components/shared/FieldFilterControls';
import { equipmentFields, type EquipmentSearchField, type EquipmentSortDirection, type EquipmentSortField } from '@/lib/equipment-list';
import type { Equipo } from '@/types/equipment';

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
  return <FieldFilterControls<Equipo, EquipmentSortField>
    fields={equipmentFields}
    query={props.query}
    onQueryChange={props.onQueryChange}
    searchField={props.searchField}
    onSearchFieldChange={props.onSearchFieldChange}
    sortField={props.sortField}
    onSortFieldChange={props.onSortFieldChange}
    direction={props.direction}
    onDirectionChange={props.onDirectionChange}
    searchPlaceholder="Buscar equipos…"
    searchLabel="Buscar equipos"
  />;
}
