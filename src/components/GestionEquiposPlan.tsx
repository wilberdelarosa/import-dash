/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { usePlanes } from '@/hooks/usePlanes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, CheckCircle2, XCircle, Factory } from 'lucide-react';
import type { PlanConIntervalos } from '@/types/maintenance-plans';

interface Props {
  plan: PlanConIntervalos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GestionEquiposPlan({ plan, open, onOpenChange }: Props) {
  const { data } = useSupabaseDataContext();
  const { addEquipoManual, removeEquipoManual, toggleExcluirEquipo, getEquiposAsociados } = usePlanes();
  const [equiposAsociados, setEquiposAsociados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fichaAgregar, setFichaAgregar] = useState('');

  const loadEquiposAsociados = useCallback(async () => {
    setLoading(true);
    const data = await getEquiposAsociados(plan.id);
    setEquiposAsociados(data);
    setLoading(false);
  }, [plan.id, getEquiposAsociados]);

  useEffect(() => {
    if (open && plan) {
      loadEquiposAsociados();
    }
  }, [open, plan, loadEquiposAsociados]);

  // Equipos que califican automáticamente
  const equiposAutomaticos = useMemo(() => {
    return data.equipos.filter(equipo => {
      const marcas = [plan.marca, ...(plan.marcas_asociadas || [])];
      const marcaCoincide = marcas.some(m => m.toLowerCase() === equipo.marca.toLowerCase());
      const categoriaCoincide = !plan.categoria || equipo.categoria.toLowerCase() === plan.categoria.toLowerCase();
      const modeloCoincide = !plan.modelo || equipo.modelo?.toLowerCase() === plan.modelo.toLowerCase();
      
      return marcaCoincide && categoriaCoincide && modeloCoincide && equipo.activo;
    });
  }, [data.equipos, plan]);

  // Equipos agregados manualmente
  const equiposManuales = useMemo(() => {
    const fichas = equiposAsociados
      .filter(ea => ea.agregado_manualmente && !ea.excluido)
      .map(ea => ea.equipo_ficha);
    
    return data.equipos.filter(e => fichas.includes(e.ficha));
  }, [data.equipos, equiposAsociados]);

  // Equipos excluidos (automáticos pero marcados para excluir)
  const equiposExcluidos = useMemo(() => {
    return equiposAsociados.filter(ea => ea.excluido).map(ea => ea.equipo_ficha);
  }, [equiposAsociados]);

  // Equipos finales (automáticos + manuales - excluidos)
  const equiposFinales = useMemo(() => {
    const automaticos = equiposAutomaticos.filter(e => !equiposExcluidos.includes(e.ficha));
    const manuales = equiposManuales.filter(e => !equiposAutomaticos.find(a => a.ficha === e.ficha));
    return [...automaticos, ...manuales];
  }, [equiposAutomaticos, equiposManuales, equiposExcluidos]);

  // Equipos disponibles para agregar manualmente
  const equiposDisponibles = useMemo(() => {
    const fichasAsignadas = new Set(equiposFinales.map(e => e.ficha));
    return data.equipos.filter(e => e.activo && !fichasAsignadas.has(e.ficha));
  }, [data.equipos, equiposFinales]);

  const handleAgregarManual = async () => {
    if (!fichaAgregar) return;
    
    await addEquipoManual(plan.id, fichaAgregar);
    setFichaAgregar('');
    await loadEquiposAsociados();
  };

  const handleRemoverManual = async (ficha: string) => {
    await removeEquipoManual(plan.id, ficha);
    await loadEquiposAsociados();
  };

  const handleToggleExcluir = async (ficha: string, excluir: boolean) => {
    await toggleExcluirEquipo(plan.id, ficha, excluir);
    await loadEquiposAsociados();
  };

  const esManual = (ficha: string) => {
    return equiposAsociados.some(ea => ea.equipo_ficha === ficha && ea.agregado_manualmente);
  };

  const esExcluido = (ficha: string) => {
    return equiposExcluidos.includes(ficha);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Equipos - {plan.nombre}</DialogTitle>
          <DialogDescription>
            Administra qué equipos están asociados a este plan de mantenimiento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="finales" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="finales">
              Finales ({equiposFinales.length})
            </TabsTrigger>
            <TabsTrigger value="automaticos">
              Automáticos ({equiposAutomaticos.length})
            </TabsTrigger>
            <TabsTrigger value="manuales">
              Manuales ({equiposManuales.length})
            </TabsTrigger>
            <TabsTrigger value="agregar">
              Agregar
            </TabsTrigger>
          </TabsList>

          {/* Equipos Finales */}
          <TabsContent value="finales" className="space-y-4">
            <div className="rounded-lg border p-3 bg-primary/5">
              <p className="text-sm">
                <strong>{equiposFinales.length} equipos</strong> asignados a este plan 
                (automáticos + manuales - excluidos)
              </p>
            </div>

            {equiposFinales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay equipos asignados a este plan</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposFinales.map(equipo => (
                      <TableRow key={equipo.id}>
                        <TableCell className="font-medium">{equipo.ficha}</TableCell>
                        <TableCell>{equipo.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{equipo.marca}</Badge>
                        </TableCell>
                        <TableCell>{equipo.categoria}</TableCell>
                        <TableCell>
                          {esManual(equipo.ficha) ? (
                            <Badge variant="secondary">Manual</Badge>
                          ) : (
                            <Badge variant="default">Automático</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {esManual(equipo.ficha) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoverManual(equipo.ficha)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleExcluir(equipo.ficha, true)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Equipos Automáticos */}
          <TabsContent value="automaticos" className="space-y-4">
            <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950">
              <p className="text-sm">
                Equipos que califican automáticamente según: <br />
                <strong>Marcas:</strong> {[plan.marca, ...(plan.marcas_asociadas || [])].join(', ')} <br />
                {plan.categoria && <><strong>Categoría:</strong> {plan.categoria}</>}
                {plan.modelo && <><br /><strong>Modelo:</strong> {plan.modelo}</>}
              </p>
            </div>

            {equiposAutomaticos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay equipos que califiquen automáticamente</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposAutomaticos.map(equipo => {
                      const excluido = esExcluido(equipo.ficha);
                      return (
                        <TableRow key={equipo.id} className={excluido ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{equipo.ficha}</TableCell>
                          <TableCell>{equipo.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{equipo.marca}</Badge>
                          </TableCell>
                          <TableCell>{equipo.categoria}</TableCell>
                          <TableCell>
                            {excluido ? (
                              <Badge variant="destructive">Excluido</Badge>
                            ) : (
                              <Badge variant="default">Incluido</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {excluido ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleExcluir(equipo.ficha, false)}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleExcluir(equipo.ficha, true)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Equipos Manuales */}
          <TabsContent value="manuales" className="space-y-4">
            <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950">
              <p className="text-sm">
                Equipos agregados manualmente que no califican automáticamente
              </p>
            </div>

            {equiposManuales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay equipos agregados manualmente</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposManuales.map(equipo => (
                      <TableRow key={equipo.id}>
                        <TableCell className="font-medium">{equipo.ficha}</TableCell>
                        <TableCell>{equipo.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{equipo.marca}</Badge>
                        </TableCell>
                        <TableCell>{equipo.categoria}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoverManual(equipo.ficha)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Agregar Equipos */}
          <TabsContent value="agregar" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={fichaAgregar} onValueChange={setFichaAgregar}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar equipo para agregar" />
                  </SelectTrigger>
                  <SelectContent>
                    {equiposDisponibles.map(equipo => (
                      <SelectItem key={equipo.id} value={equipo.ficha}>
                        {equipo.ficha} - {equipo.nombre} ({equipo.marca})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAgregarManual} disabled={!fichaAgregar}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              <div className="rounded-lg border p-3 bg-muted">
                <p className="text-sm text-muted-foreground">
                  {equiposDisponibles.length} equipos disponibles para agregar manualmente
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
