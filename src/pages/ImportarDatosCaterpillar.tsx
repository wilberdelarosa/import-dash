import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CATERPILLAR_MAINTENANCE_DATA, 
  getAllModels, 
  getAllCategories,
  type CaterpillarModelData 
} from '@/data/caterpillarMaintenanceData';
import { useKits } from '@/hooks/useKits';
import { usePlanes } from '@/hooks/usePlanes';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  FileText, 
  Loader2,
  Info
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ImportProgress {
  currentModel: string;
  currentStep: string;
  processed: number;
  total: number;
  kitsCreated: number;
  planesCreated: number;
  errors: string[];
}

export default function ImportarDatosCaterpillar() {
  const { createKit, createPieza, kits } = useKits();
  const { createPlan, createIntervalo, linkKitToInterval, planes } = usePlanes();
  const { toast } = useToast();
  
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    currentModel: '',
    currentStep: '',
    processed: 0,
    total: 0,
    kitsCreated: 0,
    planesCreated: 0,
    errors: [],
  });
  const [completed, setCompleted] = useState(false);

  const allModels = getAllModels();
  const allCategories = getAllCategories();

  const importCaterpillarData = async () => {
    setImporting(true);
    setCompleted(false);
    const errors: string[] = [];
    let kitsCreated = 0;
    let planesCreated = 0;

    try {
      setProgress({
        currentModel: '',
        currentStep: 'Iniciando importación...',
        processed: 0,
        total: CATERPILLAR_MAINTENANCE_DATA.length,
        kitsCreated: 0,
        planesCreated: 0,
        errors: [],
      });

      for (let i = 0; i < CATERPILLAR_MAINTENANCE_DATA.length; i++) {
        const modelData = CATERPILLAR_MAINTENANCE_DATA[i];
        
        setProgress(prev => ({
          ...prev,
          currentModel: modelData.model,
          currentStep: `Procesando modelo ${modelData.model}...`,
          processed: i,
        }));

        try {
          // 1. Crear plan de mantenimiento para el modelo
          setProgress(prev => ({
            ...prev,
            currentStep: `Creando plan de mantenimiento para ${modelData.model}...`,
          }));

          const plan = await createPlan({
            nombre: `Plan de Mantenimiento ${modelData.model}`,
            marca: 'Caterpillar',
            modelo: modelData.model,
            categoria: modelData.category,
            descripcion: `Plan de mantenimiento planificado (PM) para equipo Caterpillar ${modelData.model}`,
            activo: true,
          });

          planesCreated++;

          // 2. Procesar cada kit PM del modelo
          for (const pmKit of modelData.pmKits) {
            setProgress(prev => ({
              ...prev,
              currentStep: `Creando kit ${pmKit.name} para ${modelData.model}...`,
            }));

            // Verificar si el kit ya existe
            const kitCodigo = `CAT-${modelData.model}-${pmKit.code}`;
            const existingKit = kits.find(k => k.codigo === kitCodigo);

            let kitId: number;

            if (existingKit) {
              kitId = existingKit.id;
            } else {
              // Crear el kit
              const kit = await createKit({
                nombre: `${modelData.model} - ${pmKit.name}`,
                codigo: kitCodigo,
                descripcion: pmKit.description || `Kit de mantenimiento ${pmKit.name} para Caterpillar ${modelData.model}`,
                marca: 'Caterpillar',
                modelo_aplicable: modelData.model,
                categoria: modelData.category,
                activo: true,
              });

              kitId = kit.id;
              kitsCreated++;

              // Agregar todas las piezas al kit
              for (const filter of pmKit.filters) {
                await createPieza({
                  kit_id: kitId,
                  numero_parte: filter.partNumber,
                  descripcion: filter.description,
                  tipo: 'Filtro',
                  cantidad: filter.quantity,
                  unidad: 'unidad',
                  notas: `Sistema: ${filter.system}`,
                });
              }
            }

            // 3. Crear intervalo para el plan
            setProgress(prev => ({
              ...prev,
              currentStep: `Creando intervalo ${pmKit.hours}h para ${modelData.model}...`,
            }));

            const tareas: string[] = [
              'Cambio de filtros según kit',
              'Inspección visual de fugas',
              'Revisión de niveles de fluidos',
              'Muestreo de aceite (S•O•S)',
            ];

            if (pmKit.hours === 500 || pmKit.hours === 2000) {
              tareas.push('Inspección de correas y mangueras');
              tareas.push('Revisión de tensión de orugas/presión de neumáticos');
            }

            if (pmKit.hours === 1000 || pmKit.hours === 2000) {
              tareas.push('Cambio de aceite hidráulico');
              tareas.push('Inspección de sistemas hidráulicos');
            }

            const intervalo = await createIntervalo({
              plan_id: plan.id,
              codigo: pmKit.code,
              nombre: pmKit.name,
              horas_intervalo: pmKit.hours,
              descripcion: pmKit.description || null,
              tareas: tareas,
              orden: pmKit.hours / 250,
            });

            // 4. Vincular el kit al intervalo
            await linkKitToInterval(intervalo.id, kitId);
          }

          setProgress(prev => ({
            ...prev,
            kitsCreated,
            planesCreated,
            processed: i + 1,
          }));

        } catch (error: unknown) {
          const errorMsg = `Error procesando ${modelData.model}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      setProgress(prev => ({
        ...prev,
        currentModel: '',
        currentStep: 'Importación completada',
        processed: CATERPILLAR_MAINTENANCE_DATA.length,
        errors,
      }));

      setCompleted(true);

      toast({
        title: 'Importación completada',
        description: `Se crearon ${kitsCreated} kits y ${planesCreated} planes de mantenimiento.`,
      });

    } catch (error: unknown) {
      console.error('Error durante la importación:', error);
      toast({
        title: 'Error en la importación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const progressPercentage = progress.total > 0 
    ? (progress.processed / progress.total) * 100 
    : 0;

  return (
    <Layout title="Importar Datos Caterpillar">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Importar Datos Caterpillar</h1>
            <p className="text-muted-foreground mt-1">
              Importa kits y planes de mantenimiento planificado (PM) para equipos Caterpillar
            </p>
          </div>
        </div>

        {/* Información general */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelos disponibles</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allModels.length}</div>
              <p className="text-xs text-muted-foreground">
                {allCategories.length} categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kits totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {CATERPILLAR_MAINTENANCE_DATA.reduce((sum, m) => sum + m.pmKits.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                PM1 a PM4 por modelo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              {completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : importing ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <Info className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completed ? 'Completado' : importing ? 'Importando...' : 'Listo'}
              </div>
              <p className="text-xs text-muted-foreground">
                {completed ? `${progress.planesCreated} planes creados` : 'Presiona el botón para iniciar'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas informativas */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Información importante</AlertTitle>
          <AlertDescription>
            Este proceso creará kits de mantenimiento y planes para {allModels.length} modelos de equipos Caterpillar.
            Los kits incluyen todos los filtros necesarios para cada intervalo de mantenimiento (250h, 500h, 1000h, 2000h).
          </AlertDescription>
        </Alert>

        {/* Botón de importación */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar importación</CardTitle>
            <CardDescription>
              Este proceso puede tomar varios minutos dependiendo de la cantidad de datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{progress.currentStep}</span>
                  <span className="text-muted-foreground">
                    {progress.processed} / {progress.total}
                  </span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
                {progress.currentModel && (
                  <p className="text-sm text-muted-foreground">
                    Procesando: {progress.currentModel}
                  </p>
                )}
              </div>
            )}

            {completed && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Importación exitosa</AlertTitle>
                <AlertDescription className="text-green-700">
                  Se crearon {progress.kitsCreated} kits y {progress.planesCreated} planes de mantenimiento.
                </AlertDescription>
              </Alert>
            )}

            {progress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errores durante la importación</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {progress.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={importCaterpillarData}
              disabled={importing || completed}
              className="w-full"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : completed ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Importación completada
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Iniciar importación
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Vista previa de los datos */}
        <Card>
          <CardHeader>
            <CardTitle>Vista previa de los datos</CardTitle>
            <CardDescription>
              Modelos y kits que serán importados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {CATERPILLAR_MAINTENANCE_DATA.map((modelData) => (
                <AccordionItem key={modelData.model} value={modelData.model}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{modelData.model}</span>
                      <Badge variant="outline">{modelData.category}</Badge>
                      <Badge variant="secondary">{modelData.pmKits.length} kits</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {modelData.pmKits.map((kit) => (
                        <div key={kit.code} className="border-l-2 border-primary pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{kit.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {kit.hours}h
                            </Badge>
                          </div>
                          {kit.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {kit.description}
                            </p>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Filtros incluidos ({kit.filters.length}):
                            </p>
                            <ul className="text-xs space-y-1 ml-4">
                              {kit.filters.map((filter, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>
                                    {filter.partNumber} - {filter.description}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Qty: {filter.quantity} ({filter.system})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
