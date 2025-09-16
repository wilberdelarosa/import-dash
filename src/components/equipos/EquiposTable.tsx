import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Search, Filter } from 'lucide-react';
import { Equipo } from '@/types/equipment';
import { EquipoDialog } from './EquipoDialog';

interface EquiposTableProps {
  equipos: Equipo[];
  onEdit: (equipo: Equipo) => void;
  onDelete: (id: number) => void;
}

export function EquiposTable({ equipos, onEdit, onDelete }: EquiposTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterActivo, setFilterActivo] = useState('all');

  const categorias = [...new Set(equipos.map(eq => eq.categoria))];

  const filteredEquipos = equipos.filter(equipo => {
    const matchesSearch = Object.values(equipo)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesCategoria = filterCategoria === 'all' || equipo.categoria === filterCategoria;
    const matchesActivo = filterActivo === 'all' || 
      (filterActivo === 'activo' && equipo.activo) ||
      (filterActivo === 'inactivo' && !equipo.activo);

    return matchesSearch && matchesCategoria && matchesActivo;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActivo} onValueChange={setFilterActivo}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ficha</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipos.map((equipo) => (
              <TableRow key={equipo.id}>
                <TableCell className="font-medium">{equipo.ficha}</TableCell>
                <TableCell>{equipo.nombre}</TableCell>
                <TableCell>{equipo.marca}</TableCell>
                <TableCell>{equipo.modelo}</TableCell>
                <TableCell>{equipo.categoria}</TableCell>
                <TableCell>{equipo.placa}</TableCell>
                <TableCell>
                  <Badge variant={equipo.activo ? "default" : "secondary"}>
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <EquipoDialog
                      equipo={equipo}
                      onSave={onEdit}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(equipo.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredEquipos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron equipos que coincidan con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}