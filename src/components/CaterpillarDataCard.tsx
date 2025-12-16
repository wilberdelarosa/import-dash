import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { Loader2, Wrench, Package, Droplets, Thermometer, Fuel, ClipboardList, AlertTriangle } from 'lucide-react';
import { MantenimientoProgramado } from '@/types/equipment';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';

interface Props {
  modelo: string;
  numeroSerie: string;
  marca: string;
  mantenimientos?: MantenimientoProgramado[];
}

export function CaterpillarDataCard({ modelo, numeroSerie, marca, mantenimientos }: Props) {
  const { data, loading } = useCaterpillarData(modelo, numeroSerie);

  // Solo mostrar si la marca es Caterpillar
  if (marca.toLowerCase() !== 'caterpillar' && marca.toLowerCase() !== 'cat') {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-amber-500/30 dark:border-amber-500/20">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            Información Caterpillar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data.modelo) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-500/10">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-amber-700 dark:text-amber-400">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
            Información Caterpillar
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            No se encontraron datos técnicos para el modelo {modelo}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { modelo: catModelo, intervalos, piezasPorIntervalo, tareasPorIntervalo, mantenimientosEspeciales } = data;

  const findMantenimientoCoincidente = (codigoIntervalo: string, horasIntervalo: number) => {
    if (!mantenimientos?.length) return null;

    const porFrecuencia = mantenimientos.find((mantenimiento) => {
      if (!mantenimiento.frecuencia) return false;
      return Math.abs(mantenimiento.frecuencia - horasIntervalo) <= Math.max(25, horasIntervalo * 0.1);
    });

    if (porFrecuencia) return porFrecuencia;

    return mantenimientos.find((mantenimiento) =>
      mantenimiento.tipoMantenimiento?.toLowerCase().includes(codigoIntervalo.toLowerCase()),
    );
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent dark:border-amber-500/20 dark:from-amber-500/10">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-amber-700 dark:text-amber-400">
          <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
          Plan de Mantenimiento Cat
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Intervalos PM y especificaciones técnicas para {catModelo.modelo}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-4 pt-0 sm:pt-0">
        {/* Especificaciones del Modelo */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-3">
          <h3 className="mb-2 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">Especificaciones Técnicas</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Fuel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Motor</p>
                <p className="text-xs sm:text-sm font-medium truncate">{catModelo.motor}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Aceite Motor</p>
                <p className="text-xs sm:text-sm font-medium">{catModelo.capacidad_aceite_motor}L</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Hidráulico</p>
                <p className="text-xs sm:text-sm font-medium">{catModelo.capacidad_hidraulico}L</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Refrigerante</p>
                <p className="text-xs sm:text-sm font-medium">{catModelo.capacidad_refrigerante}L</p>
              </div>
            </div>
          </div>
          {catModelo.serie_desde && (
            <div className="mt-2 rounded-md bg-amber-500/10 dark:bg-amber-500/20 p-1.5 sm:p-2 text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
              <strong>Serie:</strong> {catModelo.serie_desde}
              {catModelo.serie_hasta && ` - ${catModelo.serie_hasta}`}
              {catModelo.notas && ` • ${catModelo.notas}`}
            </div>
          )}
        </div>

        <Separator className="bg-amber-500/20" />

        {/* Intervalos de Mantenimiento */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Intervalos de Mantenimiento
          </h3>
          <Accordion type="single" collapsible className="space-y-1.5">
            {intervalos.map((intervalo) => {
              const piezas = piezasPorIntervalo[intervalo.codigo] || [];
              const tareas = tareasPorIntervalo[intervalo.codigo] || [];
              const mantenimientoAsociado = findMantenimientoCoincidente(intervalo.codigo, intervalo.horas_intervalo);
              const restante = mantenimientoAsociado?.horasKmRestante ?? null;
              return (
                <AccordionItem
                  key={intervalo.id}
                  value={`interval-${intervalo.id}`}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 px-2 sm:px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2 sm:py-3">
                    <div className="flex w-full items-center justify-between pr-1 sm:pr-2 gap-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] sm:text-xs shrink-0">
                          {intervalo.codigo}
                        </Badge>
                        <span className="text-xs sm:text-sm font-medium truncate">{intervalo.nombre}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {mantenimientoAsociado && (
                          <Badge variant={getRemainingVariant(restante)} className="text-[9px] sm:text-[10px] h-4 sm:h-5">
                            {formatRemainingLabel(restante)}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">{intervalo.horas_intervalo}h</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{intervalo.descripcion}</p>

                      {tareas.length > 0 && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-2">
                          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <ClipboardList className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Tareas
                          </p>
                          <ul className="space-y-1 text-[10px] sm:text-xs">
                            {tareas.map((tarea) => (
                              <li key={tarea} className="flex items-start gap-1.5">
                                <span className="mt-1 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-foreground">{tarea}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {piezas.length > 0 && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-2">
                          <p className="mb-1.5 text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Kits y Piezas:
                          </p>
                          <div className="space-y-1.5">
                            {piezas.map((pieza) => (
                              <div
                                key={pieza.id}
                                className="flex items-start justify-between gap-2 text-[10px] sm:text-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {pieza.pieza.numero_parte}
                                  </p>
                                  <p className="text-muted-foreground truncate">{pieza.pieza.descripcion}</p>
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-[9px] h-4">
                                  x{pieza.cantidad}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {piezas.length === 0 && (
                        <p className="text-[10px] sm:text-xs italic text-muted-foreground">
                          Sin códigos de pieza configurados.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {mantenimientosEspeciales.length > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-3">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Intervenciones especializadas
            </h3>
            <ul className="space-y-1.5 text-[10px] sm:text-xs">
              {mantenimientosEspeciales.map((especial) => (
                <li key={especial.id} className="rounded-md border border-amber-500/20 bg-background/50 p-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] sm:text-[10px]">
                      {especial.intervaloCodigo}
                    </Badge>
                    {especial.responsableSugerido && (
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px]">{especial.responsableSugerido}</Badge>
                    )}
                  </div>
                  <p className="mt-1.5 leading-relaxed text-foreground">{especial.descripcion}</p>
                  {especial.referencia && (
                    <p className="mt-1 text-muted-foreground">
                      Ref: {especial.referencia}
                    </p>
                  )}
                  {especial.adjuntos?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {especial.adjuntos.map((adjunto) => (
                        <a
                          key={adjunto.label}
                          href={adjunto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-medium text-amber-600 dark:text-amber-400 underline"
                        >
                          {adjunto.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20 p-2 text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
          <strong>💡 Nota:</strong> Intervalos recomendados por Caterpillar. Consulta{' '}
          <a
            href="https://parts.cat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            parts.cat.com
          </a>{' '}
          para confirmar piezas según tu número de serie.
        </div>
      </CardContent>
    </Card>
  );
}
