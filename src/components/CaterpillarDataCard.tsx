import { useMemo } from 'react';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Información Caterpillar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data.modelo) {
    return (
      <Card className="border-amber-200/50 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Wrench className="h-5 w-5" />
            Información Caterpillar
          </CardTitle>
          <CardDescription>
            No se encontraron datos técnicos Caterpillar para el modelo {modelo}
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
    <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Wrench className="h-5 w-5" />
          Plan de Mantenimiento Caterpillar
        </CardTitle>
        <CardDescription>
          Intervalos PM y especificaciones técnicas para {catModelo.modelo}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <MousePointerClick className="h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-2 text-sm text-amber-900">
              <p className="font-semibold">¿Cómo usar esta ficha?</p>
              <ul className="space-y-1 text-xs leading-relaxed">
                <li>
                  1. Consulta el bloque «Próximo servicio programado» para identificar el PM correspondiente y las horas/km restantes.
                </li>
                <li>
                  2. Expande cualquier intervalo de la lista inferior para ver las tareas detalladas y los códigos de piezas del kit.
                </li>
                <li>
                  3. Registra el mantenimiento en la pestaña «Mantenimientos» usando la misma clave PM para mantener la trazabilidad.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {proximoServicio && (
          <div className="rounded-lg border border-amber-300/70 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-700">Próximo servicio programado</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800">
                    {proximoServicio.intervalo.codigo}
                  </Badge>
                  <Badge variant="secondary">{proximoServicio.intervalo.horas_intervalo}h</Badge>
                  {proximoServicio.mantenimientoAsociado && (
                    <Badge variant={getRemainingVariant(proximoServicio.restante)}>
                      {formatRemainingLabel(proximoServicio.restante, proximoServicio.unidad)}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {proximoServicio.intervalo.descripcion}
                </p>
              </div>
              {proximoServicio.mantenimientoAsociado && (
                <div className="rounded-md border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-800">
                  <p className="font-semibold">Referencia en tu plan:</p>
                  <p className="mt-1 font-medium">{proximoServicio.mantenimientoAsociado.tipoMantenimiento}</p>
                  <p className="text-muted-foreground">
                    Última actualización: {proximoServicio.mantenimientoAsociado.fechaUltimaActualizacion}
                  </p>
                </div>
              )}
            </div>

            {proximoServicio.tareas.length > 0 && (
              <div className="mt-4 rounded-md border border-amber-200/60 bg-amber-50/50 p-3">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                  <ClipboardList className="h-3.5 w-3.5" /> Tareas destacadas
                </p>
                <ul className="space-y-2 text-xs">
                  {proximoServicio.tareas.map((tarea) => (
                    <li key={tarea} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-amber-900">{tarea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-md border border-amber-200/60 bg-amber-50/40 p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                <Package className="h-3.5 w-3.5" /> Kit sugerido
              </p>
              {proximoServicio.piezas.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {proximoServicio.piezas.map((pieza) => (
                    <div key={pieza.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900">{pieza.pieza.numero_parte}</p>
                        <p className="text-muted-foreground">{pieza.pieza.descripcion}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {pieza.pieza.tipo}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        x{pieza.cantidad}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  No hay códigos de pieza cargados para este intervalo. Consulta el manual o tu dealer Caterpillar.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Especificaciones del Modelo */}
        <div className="rounded-lg border border-amber-200/60 bg-white/70 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-900">Especificaciones Técnicas</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Motor</p>
                <p className="font-medium">{catModelo.motor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Aceite Motor</p>
                <p className="font-medium">{catModelo.capacidad_aceite_motor}L</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Sistema Hidráulico</p>
                <p className="font-medium">{catModelo.capacidad_hidraulico}L</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Refrigerante</p>
                <p className="font-medium">{catModelo.capacidad_refrigerante}L</p>
              </div>
            </div>
          </div>
          {catModelo.serie_desde && (
            <div className="mt-3 rounded-md bg-amber-100/50 p-2 text-xs text-amber-800">
              <strong>Serie:</strong> {catModelo.serie_desde}
              {catModelo.serie_hasta && ` - ${catModelo.serie_hasta}`}
              {catModelo.notas && ` • ${catModelo.notas}`}
            </div>
          )}
        </div>

        <Separator className="bg-amber-200/50" />

        {/* Intervalos de Mantenimiento */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Package className="h-4 w-4" />
            Intervalos de Mantenimiento Programado
          </h3>
          <Accordion type="single" collapsible className="space-y-2">
            {intervalos.map((intervalo) => {
              const piezas = piezasPorIntervalo[intervalo.codigo] || [];
              const tareas = tareasPorIntervalo[intervalo.codigo] || [];
              const mantenimientoAsociado = findMantenimientoCoincidente(intervalo.codigo, intervalo.horas_intervalo);
              const restante = mantenimientoAsociado?.horasKmRestante ?? null;
              return (
                <AccordionItem
                  key={intervalo.id}
                  value={`interval-${intervalo.id}`}
                  className="rounded-lg border border-amber-200/60 bg-white/70 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          {intervalo.codigo}
                        </Badge>
                        <span className="font-medium">{intervalo.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {mantenimientoAsociado && (
                          <Badge variant={getRemainingVariant(restante)}>
                            {formatRemainingLabel(restante)}
                          </Badge>
                        )}
                        <Badge variant="secondary">{intervalo.horas_intervalo}h</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{intervalo.descripcion}</p>

                      {tareas.length > 0 && (
                        <div className="rounded-md border border-amber-200/40 bg-amber-50/50 p-3">
                          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                            <ClipboardList className="h-3.5 w-3.5" /> Tareas recomendadas
                          </p>
                          <ul className="space-y-2 text-xs">
                            {tareas.map((tarea) => (
                              <li key={tarea} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span className="text-amber-900">{tarea}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {piezas.length > 0 && (
                        <div className="rounded-md border border-amber-200/40 bg-amber-50/50 p-3">
                          <p className="mb-2 text-xs font-semibold text-amber-800">
                            Kits y Piezas Requeridas:
                          </p>
                          <div className="space-y-2">
                            {piezas.map((pieza) => (
                              <div
                                key={pieza.id}
                                className="flex items-start justify-between gap-2 text-xs"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-amber-900">
                                    {pieza.pieza.numero_parte}
                                  </p>
                                  <p className="text-muted-foreground">{pieza.pieza.descripcion}</p>
                                  <Badge variant="outline" className="mt-1 text-[10px]">
                                    {pieza.pieza.tipo}
                                  </Badge>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                  x{pieza.cantidad}
                                </Badge>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                x{pieza.cantidad}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {piezas.length === 0 && (
                      <p className="text-xs italic text-muted-foreground">
                        No hay códigos de pieza configurados para este intervalo.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {mantenimientosEspeciales.length > 0 && (
          <div className="space-y-3 rounded-lg border border-amber-200/60 bg-white/70 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" /> Intervenciones especializadas
            </h3>
            <ul className="space-y-2 text-xs text-amber-900">
              {mantenimientosEspeciales.map((especial) => (
                <li key={especial.id} className="rounded-md border border-amber-200/50 bg-amber-50/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-700">
                      {especial.intervaloCodigo}
                    </Badge>
                    {especial.responsableSugerido && (
                      <Badge variant="secondary">{especial.responsableSugerido}</Badge>
                    )}
                  </div>
                  <p className="mt-2 leading-relaxed text-amber-900">{especial.descripcion}</p>
                  {especial.referencia && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Referencia: {especial.referencia}
                    </p>
                  )}
                  {especial.adjuntos?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {especial.adjuntos.map((adjunto) => (
                        <a
                          key={adjunto.label}
                          href={adjunto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-amber-800 underline"
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

        <div className="rounded-lg border border-amber-300/50 bg-amber-100/40 p-3 text-xs text-amber-800">
          <strong>💡 Nota:</strong> Estos son intervalos recomendados por Caterpillar. Consulta el manual
          OMM específico de tu equipo o{' '}
          <a
            href="https://parts.cat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            parts.cat.com
          </a>{' '}
          para confirmar códigos de pieza actualizados según tu número de serie.
        </div>
      </CardContent>
    </Card>
  );
}
