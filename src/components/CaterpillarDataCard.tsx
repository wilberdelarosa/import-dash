import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { Loader2, Wrench, Package, Droplets, Thermometer, Fuel } from 'lucide-react';

interface Props {
  modelo: string;
  numeroSerie: string;
  marca: string;
}

export function CaterpillarDataCard({ modelo, numeroSerie, marca }: Props) {
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

  const { modelo: catModelo, intervalos, piezasPorIntervalo } = data;

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
                      <Badge variant="secondary">{intervalo.horas_intervalo}h</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{intervalo.descripcion}</p>
                      
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
              );
            })}
          </Accordion>
        </div>

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
