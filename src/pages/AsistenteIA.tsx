import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { useChatbot } from '@/hooks/useChatbot';
import { getGroqModelPriority } from '@/integrations/groq/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CircleStop,
  Loader2,
  MessageSquare,
  Minimize2,
  Maximize2,
  RefreshCw,
  SendHorizontal,
  SidebarOpen,
  SidebarClose,
  Sparkles,
  UserRound,
  AlertTriangle,

} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import type { DatabaseData } from '@/types/equipment';
import type { SystemConfig } from '@/types/config';

interface ContextSection {
  title: string;
  items: string[];
}

interface ChatContextSummary {
  summary: string;
  sections: ContextSection[];
  lastUpdatedLabel: string;
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildChatContext = (data: DatabaseData | null, config: SystemConfig | null): ChatContextSummary => {
  if (!data) {
    return {
      summary:
        'Aun no se han cargado datos de Supabase. Indica al usuario que espere a que la sincronizacion finalice antes de ofrecer recomendaciones especificas.',
      sections: [
        {
          title: 'Estado de la base de datos',
          items: ['Datos en proceso de carga o no disponibles.'],
        },
      ],
      lastUpdatedLabel: new Date().toLocaleString('es-ES'),
    };
  }

  const totalEquipos = data.equipos.length;
  const equiposActivos = data.equipos.filter((equipo) => equipo.activo).length;
  const equiposInactivos = totalEquipos - equiposActivos;

  const categorias = data.equipos.reduce<Record<string, number>>((acc, equipo) => {
    if (!equipo.categoria) return acc;
    acc[equipo.categoria] = (acc[equipo.categoria] ?? 0) + 1;
    return acc;
  }, {});

  const categoriasDestacadas = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoria, cantidad]) => `${categoria}: ${cantidad}`);

  const proximosMantenimientos = data.mantenimientosProgramados
    .filter((mantenimiento) => mantenimiento.activo)
    .slice()
    .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
    .slice(0, 5)
    .map(
      (mantenimiento) =>
        `${mantenimiento.nombreEquipo} - ${mantenimiento.tipoMantenimiento} - ${mantenimiento.horasKmRestante} horas/km restantes`,
    );

  const inventariosCriticos = data.inventarios
    .filter((inventario) => inventario.activo && inventario.cantidad <= 3)
    .slice()
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 5)
    .map((inventario) => `${inventario.nombre} (${inventario.codigoIdentificacion}) - ${inventario.cantidad} en stock`);

  const actualizacionesRecientes = data.actualizacionesHorasKm
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5)
    .map((actualizacion) => {
      const equipo = actualizacion.nombreEquipo ?? actualizacion.ficha;
      return `${equipo} - ${actualizacion.horasKm} horas/km el ${formatDate(actualizacion.fecha)}`;
    });

  const empleadosActivos = data.empleados?.filter((empleado) => empleado.activo).length ?? 0;

  const summaryLines = [
    `Equipos registrados: ${totalEquipos} (activos: ${equiposActivos}, inactivos: ${equiposInactivos}).`,
    `Empleados activos disponibles: ${empleadosActivos}.`,
    proximosMantenimientos.length
      ? `Proximos mantenimientos prioritarios: ${proximosMantenimientos.join(' | ')}`
      : 'No hay mantenimientos proximos registrados.',
    inventariosCriticos.length
      ? `Inventarios criticos (<=3 unidades): ${inventariosCriticos.join(' | ')}`
      : 'No hay repuestos con stock critico (<=3 unidades).',
    actualizacionesRecientes.length
      ? `Ultimas actualizaciones de horas/km: ${actualizacionesRecientes.join(' | ')}`
      : 'No se registran actualizaciones recientes de horas/km.',
    config
      ? `Umbral preventivo: ${config.alertaPreventiva} horas/km - Umbral critico: ${config.alertaCritica} horas/km.`
      : 'Usa los umbrales predeterminados (50 preventivo / 15 critico) si no se especifican valores del sistema.',
  ];

  const sections: ContextSection[] = [
    {
      title: 'Indicadores generales',
      items: [
        `Equipos activos: ${equiposActivos}`,
        `Equipos fuera de servicio: ${equiposInactivos}`,
        categoriasDestacadas.length
          ? `Categorias destacadas: ${categoriasDestacadas.join(', ')}`
          : 'Categorias destacadas: Sin datos destacados',
      ],
    },
    {
      title: 'Mantenimientos en agenda',
      items: proximosMantenimientos.length
        ? proximosMantenimientos
        : ['No hay mantenimientos activos con prioridad inmediata.'],
    },
    {
      title: 'Inventarios criticos',
      items: inventariosCriticos.length
        ? inventariosCriticos
        : ['Todos los repuestos se encuentran por encima del nivel critico (<=3).'],
    },
    {
      title: 'Actividad reciente',
      items: actualizacionesRecientes.length
        ? actualizacionesRecientes
        : ['Sin lecturas recientes de horas/kilometros registradas.'],
    },
  ];

  return {
    summary: summaryLines.join('\n'),
    sections,
    lastUpdatedLabel: new Date().toLocaleString('es-ES'),
  };
};


const buildSystemPrompt = (contextSummary: string) => `Eres ALITO BOT, el asistente virtual de soporte de la plataforma de gestión de maquinaria de ALITO GROUP SRL. Tu rol es responder SIEMPRE en español con un tono profesional y empático.

Instrucciones clave:
- Usa únicamente la información más reciente proporcionada en el contexto si está disponible. Si necesitas un dato que no aparece, indica de forma transparente que no se encuentra en la base actual.
- Propón pasos concretos y accionables basados en el estado de los equipos, mantenimientos e inventarios.
- Si detectas riesgos (por ejemplo, equipos con horas/km por debajo del umbral crítico o repuestos con stock bajo) resáltalos y sugiere cómo mitigarlos.
- Cuando el usuario pida ayuda fuera del ámbito de la flota o sin relación con los datos proporcionados, responde brevemente y redirígelo a la información disponible.

IMPORTANTE - Formateo de respuestas con tablas:
- Cuando el usuario solicite listas o información tabular (por ejemplo: "lista de equipos Caterpillar", "muestra todos los rodillos con más de 1000 horas"), genera las respuestas en formato de tabla Markdown.
- Usa la siguiente sintaxis para tablas:

| Nombre | Ficha | Modelo | Horas Actuales |
|--------|-------|--------|----------------|
| Excavadora 320 | EX-001 | 320 | 1,250 |
| Rodillo CB10 | RD-003 | CB10 | 890 |

- Las tablas deben incluir las columnas relevantes solicitadas por el usuario.
- Ordena y filtra los datos según los criterios especificados por el usuario.
- Si el usuario pide filtros complejos (ej: "equipos que no son Caterpillar y ficha > AC-44"), aplica todos los filtros correctamente.

Ejemplos de consultas que deben generar tablas:
- "lista de nombre, ficha, modelo de todos los equipos Caterpillar"
- "muéstrame los equipos con mantenimiento vencido"
- "dame una tabla de repuestos con stock bajo"
- "equipos activos con más de 2000 horas"

Contexto actualizado del negocio:
${contextSummary}

Siempre que entregues listados, utiliza tablas Markdown o viñetas claras. Refiérete a los equipos por su nombre comercial y ficha cuando sea posible.`;

const buildInitialAssistantMessage = (contextSections: ContextSection[]): string => {
  const indicador = contextSections[0]?.items.slice(0, 2).join(' · ') ?? '';
  const mantenimientos = contextSections[1]?.items?.slice(0, 2).join(' | ');

  const introduccionBase =
    'Hola, soy ALITO BOT. Ya estoy conectado a los datos operativos más recientes de tu flota. ¿En qué puedo ayudarte hoy?';

  const detalles: string[] = [];
  if (indicador) {
    detalles.push(`Resumen actual: ${indicador}.`);
  }
  if (mantenimientos) {
    detalles.push(`Seguimiento de mantenimientos: ${mantenimientos}.`);
  }

  return detalles.length ? `${introduccionBase} ${detalles.join(' ')}` : introduccionBase;
};

export default function AsistenteIA() {
  const { data, loading, usingDemoData } = useSupabaseDataContext();
  const { config } = useSystemConfig();
  const [contextMode, setContextMode] = useState<'docked' | 'floating'>('docked');
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [input, setInput] = useState('');

  const context = useMemo(() => {
    // Crear contexto enriquecido con datos completos para búsquedas
    const baseContext = buildChatContext(loading ? null : data, config);
    
    if (!data) return baseContext;

    // Agregar todos los equipos con detalles completos al contexto
    const equiposDetallados = data.equipos.map(e => 
      `${e.nombre} (Ficha: ${e.ficha}, Marca: ${e.marca}, Modelo: ${e.modelo}, Serie: ${e.numeroSerie}, Categoría: ${e.categoria}, Estado: ${e.activo ? 'Activo' : 'Inactivo'})`
    ).join(' | ');

    const mantenimientosDetallados = data.mantenimientosProgramados.map(m =>
      `${m.nombreEquipo} (Ficha: ${m.ficha}, Tipo: ${m.tipoMantenimiento}, Horas actuales: ${m.horasKmActuales}, Restante: ${m.horasKmRestante})`
    ).join(' | ');

    const inventariosDetallados = data.inventarios.map(i =>
      `${i.nombre} (Código: ${i.codigoIdentificacion}, Stock: ${i.cantidad}, Categoría: ${i.categoriaEquipo})`
    ).join(' | ');

    return {
      ...baseContext,
      summary: `${baseContext.summary}

DATOS COMPLETOS PARA BÚSQUEDAS:

Equipos completos: ${equiposDetallados}

Mantenimientos: ${mantenimientosDetallados}

Inventarios: ${inventariosDetallados}

Usa estos datos para responder consultas específicas y generar tablas filtradas según los criterios del usuario.`
    };
  }, [data, config, loading]);
  const modelPriority = useMemo(() => getGroqModelPriority(), []);
  const systemPrompt = useMemo(() => buildSystemPrompt(context.summary), [context.summary]);
  const initialAssistantMessage = useMemo(
    () => buildInitialAssistantMessage(context.sections),
    [context.sections],
  );

  const { messages, isLoading, sendMessage, error, activeModel, usage, reset, stop } = useChatbot({
    systemPrompt,
    initialAssistantMessage,
  });
  const totalMensajes = messages.length;
  const userMessages = useMemo(
    () => messages.filter((message) => message.role === 'user').length,
    [messages],
  );
  const summarySnippet = useMemo(() => {
    if (!context.summary) return '';
    return context.summary.length > 180 ? `${context.summary.slice(0, 177)}â€¦` : context.summary;
  }, [context.summary]);
  const showDockedPanel = contextMode === 'docked' && !chatExpanded;

  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const contextPanels = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estado del conocimiento</CardTitle>
          <CardDescription>Resumen generado automáticamente con la información más reciente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Última actualización del contexto</span>
            <span>{context.lastUpdatedLabel}</span>
          </div>
          {context.sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {section.items.map((item, index) => (
                  <li key={`${section.title}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona el asistente</CardTitle>
          <CardDescription>
            El sistema cambia automáticamente de modelo si detecta límites de tokens o saturación en Groq.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Prioridad de modelos configurada:{' '}
            <span className="font-medium text-foreground">{modelPriority.join(' > ')}</span>
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Se usa el mejor modelo disponible para cada pregunta.</li>
            <li>Si Groq informa que se alcanzó el límite de tokens o cuota, se reintenta con el siguiente modelo.</li>
            <li>
              Puedes personalizar el orden estableciendo <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_GROQ_MODEL_PRIORITY</code>{' '}
              en tu archivo <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );

  const handleToggleContextMode = () => {
    setContextMode((prev) => {
      if (prev === 'docked') {
        setContextSheetOpen(true);
        return 'floating';
      }
      setContextSheetOpen(false);
      return 'docked';
    });
  };

  return (
    <Layout title="Asistente inteligente con IA">
      <Navigation />
      {usingDemoData && (
        <Alert variant="warning" className="mb-6 border-warning/50 bg-warning/10 text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Modo demostración con datos locales</AlertTitle>
          <AlertDescription>
            No se pudieron obtener datos reales desde Supabase. Revisa las variables{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> y{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>{' '}
            para conectar tu proyecto. Mientras tanto, se muestran datos de ejemplo para que puedas
            explorar la interfaz sin interrupciones.
          </AlertDescription>
        </Alert>
      )}
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-inner">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              Contexto sincronizado
            </CardTitle>
            <CardDescription className="text-base text-foreground">
              {summarySnippet || 'Conecta los datos para habilitar el contexto corporativo.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Última actualización: {context.lastUpdatedLabel}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Motor IA activo
            </CardTitle>
            <CardDescription className="text-base text-foreground">
              {activeModel ?? 'Selección dinámica'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Prioridad configurada:{' '}
              <span className="font-semibold text-foreground">{modelPriority.join(' > ')}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Actividad del chat
            </CardTitle>
            <CardDescription className="text-base text-foreground">
              {userMessages} consultas • {totalMensajes} mensajes
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Conversaciones personalizadas en tiempo real con datos operativos centralizados.
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Panel contextual
            </CardTitle>
            <CardDescription className="text-base text-foreground">
              {showDockedPanel ? 'Acoplado al chat' : 'Disponible en modo flotante'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={handleToggleContextMode}>
              {contextMode === 'docked' ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
              {contextMode === 'docked' ? 'Ver como panel flotante' : 'Acoplar nuevamente'}
            </Button>
          </CardContent>
        </Card>
      </section>
      <div
        className={cn('flex flex-col gap-6 xl:gap-8', showDockedPanel && 'xl:grid xl:grid-cols-[minmax(0,1fr)_380px]')}
      >
        <Card
          className={cn(
            'flex h-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background via-background/95 to-muted/40 shadow-2xl backdrop-blur transition-all',
            chatExpanded ? 'min-h-[80vh] lg:min-h-[calc(100vh-200px)]' : 'min-h-[70vh] lg:min-h-[calc(100vh-240px)]',
          )}
        >
          <CardHeader className="border-b border-border/60 bg-card/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Centro de conversaciones
                </CardTitle>
                <CardDescription>
                  Chatea con ALITO BOT y obtén respuestas contextualizadas usando la información más reciente de la base de datos.
                </CardDescription>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setChatExpanded((prev) => !prev)}
                  className="rounded-full border-border/70 bg-background/70 shadow-sm backdrop-blur hover:border-primary/40"
                >
                  {chatExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  <span className="sr-only">{chatExpanded ? 'Reducir chat' : 'Expandir chat'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleToggleContextMode}
                  className="rounded-full border-border/70 bg-background/70 shadow-sm backdrop-blur hover:border-primary/40"
                >
                  {contextMode === 'docked' ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
                  <span className="sr-only">
                    {contextMode === 'docked' ? 'Mostrar panel flotante' : 'Volver a acoplar panel'}
                  </span>
                </Button>
              </div>
            </div>
            <div className="flex gap-2 sm:hidden">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 rounded-full border-border/70 bg-background/70 shadow-sm backdrop-blur hover:border-primary/40"
                onClick={() => setChatExpanded((prev) => !prev)}
              >
                {chatExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {chatExpanded ? 'Vista compacta' : 'Pantalla completa'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 rounded-full border-border/70 bg-background/70 shadow-sm backdrop-blur hover:border-primary/40"
                onClick={handleToggleContextMode}
              >
                {contextMode === 'docked' ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
                {contextMode === 'docked' ? 'Panel flotante' : 'Acoplar panel'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-8 py-8">
              <div className="flex flex-col gap-6">
                {messages.map((message) => {
                  const isAssistant = message.role === 'assistant';
                  const isUser = message.role === 'user';
                  const timestamp = new Date(message.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'group relative flex w-full items-start gap-3',
                        isUser ? 'flex-row-reverse' : 'flex-row',
                      )}
                    >
                      <Avatar
                        className={cn(
                          'h-10 w-10 border border-border/40 shadow-lg transition-transform duration-300 group-hover:scale-105',
                          isAssistant
                            ? 'bg-gradient-to-br from-primary/80 via-primary to-primary-foreground/10 text-primary-foreground'
                            : 'bg-gradient-to-br from-muted/60 via-muted to-muted-foreground/20 text-muted-foreground',
                        )}
                      >
                        <AvatarFallback className="bg-transparent text-xs font-semibold uppercase tracking-wide">
                          {isAssistant ? (
                            <Sparkles className="h-5 w-5" />
                          ) : (
                            <UserRound className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'relative w-full max-w-full rounded-3xl border border-border/50 px-6 py-5 text-base shadow-[0_18px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300 sm:max-w-[85%]',
                          isAssistant
                            ? 'bg-gradient-to-br from-primary/10 via-background/90 to-background/60 text-foreground'
                            : 'bg-gradient-to-br from-primary to-primary-foreground/90 text-primary-foreground',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 pb-2 text-xs uppercase tracking-wide">
                          <span
                            className={cn(
                              'font-semibold',
                              isAssistant ? 'text-primary' : 'text-primary-foreground/80',
                            )}
                          >
                            {isAssistant ? 'ALITO BOT' : 'Tú'}
                          </span>
                          <span
                            className={cn(
                              'text-[0.7rem] font-medium',
                              isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/70',
                            )}
                          >
                            {timestamp}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'whitespace-pre-wrap leading-relaxed',
                            isAssistant ? 'text-foreground' : 'text-primary-foreground',
                          )}
                        >
                          {isAssistant ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            message.content
                          )}
                        </div>
                        {isAssistant && message.model && (
                          <div className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            Modelo activo: {message.model}
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          'pointer-events-none absolute inset-0 -z-10 translate-y-4 rounded-[2.5rem] opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-80',
                          isAssistant
                            ? 'bg-primary/20 group-hover:translate-y-6'
                            : 'bg-primary/40 group-hover:translate-y-6',
                        )}
                      />
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                      <AvatarFallback className="bg-transparent">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background/80 to-background px-5 py-3 text-sm text-muted-foreground shadow-[0_18px_45px_-25px_rgba(59,130,246,0.55)]">
                      ALITO BOT está redactando la respuesta
                    </div>
                  </div>
                )}
                <div ref={listEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col gap-3 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>No se pudo completar la consulta</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              className="flex w-full flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <Textarea
                placeholder="Escribe tu pregunta o solicita un análisis específico"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-h-[120px] resize-none rounded-2xl border border-primary/20 bg-gradient-to-br from-background/90 via-background/70 to-primary/5 px-4 py-4 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activeModel ? (
                    <Badge variant="outline" className="uppercase">
                      Modelo activo: {activeModel}
                    </Badge>
                  ) : (
                    <span>El asistente seleccionará automáticamente el mejor modelo disponible.</span>
                  )}
                  {usage && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Tokens prompt: {usage.promptTokens}</span>
                      <span>• Tokens respuesta: {usage.completionTokens}</span>
                      <span className="font-semibold text-foreground">Total: {usage.totalTokens}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={isLoading}
                    className="gap-2 rounded-full border-border/60 bg-background/70 px-6 shadow-sm backdrop-blur transition hover:border-primary/40 hover:shadow-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reiniciar charla
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="gap-2 rounded-full px-6 text-sm shadow-lg transition-all hover:shadow-xl"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    {isLoading ? 'Enviando' : 'Enviar'}
                  </Button>
                  {isLoading && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={stop}
                      className="gap-2 rounded-full px-6 text-sm hover:bg-primary/10"
                    >
                      <CircleStop className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardFooter>
        </Card>
        {showDockedPanel ? (
          <div className="space-y-4">{contextPanels}</div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border/60 p-4 text-center">
            <p className="text-sm font-medium text-foreground">Panel contextual desacoplado</p>
            <p className="text-xs text-muted-foreground">
              Abre el panel lateral para consultar el resumen mientras mantienes el chat a pantalla completa.
            </p>
            <Button variant="outline" className="gap-2 self-center" onClick={() => setContextSheetOpen(true)}>
              <SidebarOpen className="h-4 w-4" />
              Abrir panel contextual
            </Button>
          </div>
        )}
      </div>
      <Sheet open={contextMode === 'floating' && contextSheetOpen} onOpenChange={setContextSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Panel contextual del asistente</SheetTitle>
            <SheetDescription>Consulta el resumen sin dejar la conversación.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">{contextPanels}</div>
        </SheetContent>
      </Sheet>    </Layout>
  );
}




