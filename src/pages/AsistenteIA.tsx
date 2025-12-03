import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Layout } from '@/components/Layout';
import FloatingPrompt from '@/components/FloatingPrompt';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { useChatbot } from '@/hooks/useChatbot';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { AsistenteIAMobile } from '@/pages/mobile/AsistenteIAMobile';
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
  History,
  ClipboardList,
  Wrench,
  ListChecks,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

const isMarkdownTableSeparator = (line: string) => {
  const cleaned = line.replace(/^\||\|$/g, '').trim();
  if (!cleaned) return false;
  return cleaned.split('|').every((segment) => /^:?-+:?$/.test(segment.trim()));
};

const normalizeRow = (line: string) =>
  line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

const parseMarkdownTable = (content: string): ParsedTable | null => {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i];
    const separator = lines[i + 1];
    if (!header.includes('|') || !separator.includes('|')) {
      continue;
    }
    if (!isMarkdownTableSeparator(separator)) {
      continue;
    }

    const headers = normalizeRow(header).filter((cell) => cell.length > 0);
    if (!headers.length) {
      continue;
    }

    const rows: string[][] = [];
    for (let j = i + 2; j < lines.length; j++) {
      const row = lines[j];
      if (!row.includes('|')) break;
      const cells = normalizeRow(row);
      if (cells.every((cell) => cell === '')) continue;
      rows.push(cells);
    }

    if (!rows.length) {
      continue;
    }

    const normalizedRows = rows.map((row) => {
      const copy = [...row];
      while (copy.length < headers.length) {
        copy.push('');
      }
      return copy.slice(0, headers.length);
    });

    return { headers, rows: normalizedRows };
  }

  return null;
};

interface QuickAccessLink {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

const QUICK_ACCESS_LINKS: QuickAccessLink[] = [
  { label: 'Historial de eventos', description: 'Auditoría completa de acciones y cambios.', to: '/historial', icon: History },
  { label: 'Planes de mantenimiento', description: 'Revisa y ajusta los planes activos.', to: '/planes-mantenimiento', icon: ClipboardList },
  { label: 'Control de mantenimiento', description: 'Supervisa el estado de los mantenimientos.', to: '/control-mantenimiento', icon: Wrench },
  { label: 'Listas personalizadas', description: 'Accede tareas guardadas y kits.', to: '/listas-personalizadas', icon: ListChecks },
];

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
  const { isMobile } = useDeviceDetection();
  const [contextMode, setContextMode] = useState<'docked' | 'floating'>('docked');
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [downloadingTableId, setDownloadingTableId] = useState<string | null>(null);

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
    return context.summary.length > 180 ? `${context.summary.slice(0, 177)}…` : context.summary;
  }, [context.summary]);
  const showDockedPanel = contextMode === 'docked' && !chatExpanded;

  const highlightStats = useMemo(
    () => [
      {
        label: 'Mensajes oficiales',
        value: `${totalMensajes}`,
        helper: 'Conversaciones activas',
      },
      {
        label: 'Consultas recibidas',
        value: `${userMessages}`,
        helper: 'Usuarios interactuando',
      },
      {
        label: 'Modelos en rotacion',
        value: modelPriority.slice(0, 3).join(' / ') || 'Automatico',
        helper: 'Prioridad configurada',
      },
      {
        label: 'Contexto principal',
        value: summarySnippet || 'Cargado al instante',
        helper: 'Resumen preparado',
      },
    ],
    [totalMensajes, userMessages, modelPriority, summarySnippet],
  );

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 180;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  const handleSubmit = async (text?: string) => {
    const payload = typeof text === 'string' ? text : input;
    if (!payload.trim()) return;
    await sendMessage(payload);
    setInput('');
    adjustTextareaHeight();
    setChatExpanded(true);
    // ensure response is visible after send
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  };

  const handleDownloadTable = (messageId: string, parsedTable: ParsedTable, label: string) => {
    setDownloadingTableId(messageId);
    try {
      const doc = new jsPDF({
        orientation: parsedTable.headers.length > 4 ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      doc.setFontSize(14);
      doc.text(label, 40, 40);
      autoTable(doc, {
        startY: 60,
        head: [parsedTable.headers],
        body: parsedTable.rows,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: parsedTable.headers.reduce<Record<number, { cellWidth: number | 'auto' }>>((acc, _, index) => {
          acc[index] = { cellWidth: 'auto' };
          return acc;
        }, {}),
      });
      const safeLabel = label.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || 'tabla';
      doc.save(`${safeLabel}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF de tabla', error);
    } finally {
      setDownloadingTableId(null);
    }
  };

  const contextPanels = (
    <>
      <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/20 p-2 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Estado del conocimiento</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Resumen generado con datos en tiempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5 text-sm">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3.5 py-2 text-xs backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-muted-foreground">Última actualización:</span>
            <span className="font-semibold text-foreground">{context.lastUpdatedLabel}</span>
          </div>
          {context.sections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <div className="h-1 w-1 rounded-full bg-primary" />
                {section.title}
              </h3>
              <ul className="space-y-2 pl-3">
                {section.items.map((item, index) => (
                  <li key={`${section.title}-${index}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="overflow-hidden border border-border/30 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-border/20 bg-gradient-to-r from-muted/10 to-transparent pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-muted p-2 backdrop-blur-sm shadow-sm">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Funcionamiento del asistente</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Sistema de selección automática de modelos IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-5 text-sm text-muted-foreground">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 backdrop-blur-sm">
            <p className="text-xs font-medium text-foreground">
              Prioridad configurada:{' '}
              <Badge variant="outline" className="ml-2 border-primary/30 bg-background/50 text-primary text-[0.7rem]">
                {modelPriority.join(' → ')}
              </Badge>
            </p>
          </div>
          <ul className="space-y-2.5 pl-1">
            <li className="flex items-start gap-2.5">
              <div className="mt-1 rounded-full bg-primary/20 p-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-xs leading-relaxed">
                Se usa el mejor modelo disponible para cada pregunta.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="mt-1 rounded-full bg-primary/20 p-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-xs leading-relaxed">
                Si Groq alcanza el límite, se reintenta con el siguiente modelo.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="mt-1 rounded-full bg-primary/20 p-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-xs leading-relaxed">
                Personaliza el orden con{' '}
                <code className="rounded-lg bg-muted px-2 py-1 text-[0.65rem] font-mono text-foreground">
                  VITE_GROQ_MODEL_PRIORITY
                </code>{' '}
                en tu{' '}
                <code className="rounded-lg bg-muted px-2 py-1 text-[0.65rem] font-mono text-foreground">
                  .env
                </code>
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card className="overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 via-card/90 to-primary/5 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/20 p-2 backdrop-blur-sm shadow-sm">
              <ListChecks className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Atajos estratégicos</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Acceso rápido a planes, historial y listas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-5">
          <div className="grid gap-2.5 md:grid-cols-2">
            {QUICK_ACCESS_LINKS.map((link) => (
              <Button
                key={link.label}
                variant="outline"
                size="sm"
                asChild
                className="h-full rounded-xl border border-border/30 bg-gradient-to-br from-background via-muted/60 to-muted/20 p-0 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <Link
                  to={link.to}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3.5 py-3 text-left"
                >
                  <link.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{link.label}</p>
                    <p className="text-[0.7rem] text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
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
    <>
      {isMobile ? (
        <AsistenteIAMobile
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onClearChat={reset}
        />
      ) : (
        <Layout title="Asistente inteligente con IA">
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
          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02]">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all duration-300 group-hover:scale-150" />
              <CardHeader className="relative space-y-2.5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-primary/20 p-2 backdrop-blur-sm shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs h-5">
                    Activo
                  </Badge>
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/90">
                  Contexto sincronizado
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-foreground/70 line-clamp-2">
                  {summarySnippet || 'Conecta los datos para habilitar el contexto corporativo.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative text-[0.7rem] text-muted-foreground pt-0">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="truncate">Actualizado: {context.lastUpdatedLabel.split(',')[1]?.trim() || context.lastUpdatedLabel}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-background via-muted/30 to-background shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-all duration-300 group-hover:scale-125" />
              <CardHeader className="relative space-y-2.5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted p-2 backdrop-blur-sm shadow-sm">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Motor IA activo
                </CardTitle>
                <CardDescription className="text-base font-bold text-foreground truncate">
                  {activeModel ?? 'Selección dinámica'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-0">
                <p className="text-[0.7rem] text-muted-foreground truncate">
                  <span className="font-medium">Prioridad:</span>{' '}
                  <span className="font-semibold text-foreground">{modelPriority.slice(0, 2).join(' → ')}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-background via-muted/20 to-background shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-tl from-primary/5 to-transparent blur-2xl transition-all duration-300 group-hover:scale-125" />
              <CardHeader className="relative space-y-2.5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted p-2 backdrop-blur-sm shadow-sm">
                    <UserRound className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs h-5">
                    {totalMensajes}
                  </Badge>
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Actividad del chat
                </CardTitle>
                <CardDescription className="text-base font-bold text-foreground">
                  {userMessages} {userMessages === 1 ? 'consulta' : 'consultas'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative text-[0.7rem] text-muted-foreground pt-0">
                Conversaciones con datos en tiempo real
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-dashed border-border/60 bg-gradient-to-br from-muted/10 via-background to-muted/5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:scale-[1.02]">
              <CardHeader className="space-y-2.5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted/50 p-2 backdrop-blur-sm shadow-sm">
                    {contextMode === 'docked' ? (
                      <SidebarClose className="h-4 w-4 text-primary" />
                    ) : (
                      <SidebarOpen className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Panel contextual
                </CardTitle>
                <CardDescription className="text-xs text-foreground/70">
                  {showDockedPanel ? 'Acoplado al chat' : 'Modo flotante activo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                  onClick={handleToggleContextMode}
                >
                  {contextMode === 'docked' ? <SidebarOpen className="h-3.5 w-3.5" /> : <SidebarClose className="h-3.5 w-3.5" />}
                  <span className="text-xs font-semibold">{contextMode === 'docked' ? 'Desacoplar' : 'Acoplar'}</span>
                </Button>
              </CardContent>
            </Card>
          </section>
          <div
            className={cn('flex flex-col gap-6 xl:gap-8', showDockedPanel && 'xl:grid xl:grid-cols-[minmax(0,1fr)_380px]')}
          >
            <Card
              className={cn(
                'flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all',
                chatExpanded ? 'min-h-[80vh] lg:min-h-[calc(100vh-200px)]' : 'min-h-[70vh] lg:min-h-[calc(100vh-240px)]',
              )}
            >
              <CardHeader className="border-b bg-muted/30 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2.5 shadow-sm">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Asistente IA
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Chatea con ALITO BOT sobre tu flota
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {highlightStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="group rounded-xl border border-border/30 bg-gradient-to-br from-card/90 to-muted/20 p-3 transition-all hover:shadow-md hover:border-primary/30 hover:scale-[1.02]"
                        >
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="mt-1.5 text-lg font-bold text-foreground leading-tight truncate">{stat.value}</p>
                          <p className="mt-1 text-[0.7rem] text-muted-foreground truncate">{stat.helper}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const conversationText = messages.map(m =>
                          `${m.role === 'user' ? 'Usuario' : 'ALITO BOT'}: ${m.content}`
                        ).join('\n\n');
                        const blob = new Blob([conversationText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `conversacion-alito-${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      disabled={messages.length === 0}
                      title="Exportar conversación"
                      className="h-9 w-9 rounded-lg hover:bg-primary/10"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatExpanded((prev) => !prev)}
                      className="h-9 w-9 rounded-lg hover:bg-primary/10"
                    >
                      {chatExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleContextMode}
                      className="h-9 w-9 rounded-lg hover:bg-primary/10"
                    >
                      {contextMode === 'docked' ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 sm:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 rounded-xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]"
                    onClick={() => setChatExpanded((prev) => !prev)}
                  >
                    {chatExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    <span className="text-xs font-semibold">{chatExpanded ? 'Compactar' : 'Expandir'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 rounded-xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]"
                    onClick={handleToggleContextMode}
                  >
                    {contextMode === 'docked' ? <SidebarOpen className="h-3.5 w-3.5" /> : <SidebarClose className="h-3.5 w-3.5" />}
                    <span className="text-xs font-semibold">{contextMode === 'docked' ? 'Flotante' : 'Acoplar'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pt-6 pb-4" style={{ paddingBottom: 140 }}>
                  <div className="flex flex-col gap-5">
                    {messages.map((message) => {
                      const isAssistant = message.role === 'assistant';
                      const isUser = message.role === 'user';
                      const timestamp = new Date(message.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const parsedTable = parseMarkdownTable(message.content);
                      const creationDate = new Date(message.createdAt ?? Date.now());
                      const tableLabel = `${isAssistant ? 'Tabla respuesta' : 'Tabla consulta'}-${creationDate.toISOString().split('T')[0]}`;

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
                              'h-9 w-9 shrink-0 border shadow-sm transition-all',
                              isAssistant
                                ? 'border-none bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-primary/30'
                                : 'border-border bg-muted',
                            )}
                          >
                            <AvatarFallback className={cn(
                              isAssistant ? 'bg-transparent text-white' : 'bg-transparent text-muted-foreground'
                            )}>
                              {isAssistant ? (
                                <Sparkles className="h-4 w-4 text-primary" />
                              ) : (
                                <UserRound className="h-4 w-4 text-muted-foreground" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'relative w-full max-w-full border px-4 py-3.5 shadow-sm transition-all sm:max-w-[85%]',
                              isAssistant
                                ? 'rounded-2xl rounded-tl-md border-border/50 bg-gradient-to-br from-muted/80 to-muted/50 backdrop-blur-sm text-foreground'
                                : 'rounded-2xl rounded-tr-md ml-auto border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20',
                            )}
                          >
                            <div className="mb-2.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'text-[0.65rem] font-bold uppercase tracking-[0.1em]',
                                    isAssistant ? 'text-primary' : 'text-primary-foreground/90',
                                  )}
                                >
                                  {isAssistant ? 'ALITO BOT' : 'TÚ'}
                                </span>
                                {isAssistant && (
                                  <Badge variant="outline" className="h-4 border-primary/30 bg-primary/10 px-1.5 text-[0.6rem] text-primary">
                                    IA
                                  </Badge>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-[0.65rem] font-medium tabular-nums',
                                  isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/70',
                                )}
                              >
                                {timestamp}
                              </span>
                            </div>
                            <div
                              className={cn(
                                'whitespace-pre-wrap text-sm leading-relaxed',
                                isAssistant ? 'text-foreground' : 'text-primary-foreground',
                              )}
                            >
                              {isAssistant ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-3 prose-headings:font-semibold prose-headings:tracking-tight prose-p:my-2 prose-p:leading-7 prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:rounded-md prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-mono prose-code:font-medium prose-code:border prose-code:border-border/40 prose-pre:my-3 prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:shadow-sm prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                                  <MarkdownRenderer content={message.content} />
                                </div>
                              ) : (
                                message.content
                              )}
                            </div>
                            {parsedTable && (
                              <div className="mt-3.5 overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                                <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-muted/40 to-muted/20 px-3.5 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <CircleStop className="h-3.5 w-3.5 text-primary" />
                                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-foreground">
                                      {tableLabel}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1.5 rounded-lg px-2.5 hover:bg-primary/10"
                                    onClick={() => handleDownloadTable(message.id, parsedTable, tableLabel)}
                                    disabled={downloadingTableId === message.id}
                                  >
                                    {downloadingTableId === message.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <SendHorizontal className="h-3.5 w-3.5" />
                                        <span className="text-[0.7rem] font-semibold">PDF</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-[280px] w-full table-auto">
                                    <thead>
                                      <tr className="border-b bg-muted/20">
                                        {parsedTable.headers.map((header) => (
                                          <th
                                            key={`${message.id}-${header}`}
                                            className="px-3 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                                          >
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {parsedTable.rows.map((row, rowIndex) => (
                                        <tr
                                          key={`${message.id}-row-${rowIndex}`}
                                          className={cn(
                                            'border-b transition-colors hover:bg-muted/40',
                                            rowIndex % 2 === 0 ? 'bg-muted/10' : 'bg-card'
                                          )}
                                        >
                                          {row.map((cell, cellIndex) => (
                                            <td
                                              key={`${message.id}-row-${rowIndex}-cell-${cellIndex}`}
                                              className="px-3 py-2.5 text-[0.8rem] tabular-nums"
                                            >
                                              {cell || '—'}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {isAssistant && message.model && (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground shadow-sm">
                                <Sparkles className="h-3 w-3 text-primary" />
                                {message.model}
                              </div>
                            )}
                          </div>
                          <div
                            className={cn(
                              'pointer-events-none absolute inset-0 -z-10 translate-y-4 rounded-[2.5rem] opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100',
                              isAssistant
                                ? 'bg-gradient-to-br from-primary/20 to-primary/5 group-hover:translate-y-6'
                                : 'bg-gradient-to-br from-primary/40 to-primary/20 group-hover:translate-y-6',
                            )}
                          />
                        </div>
                      );
                    })}
                    {isLoading && (
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Avatar className="h-9 w-9 border-none bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-primary/30">
                          <AvatarFallback className="bg-transparent text-white">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-border/50 bg-gradient-to-br from-muted/80 to-muted/50 backdrop-blur-sm px-5 py-3 shadow-sm">
                          <div className="flex gap-1.5">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Pensando...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={listEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator />
              <CardFooter className="sticky bottom-0 z-10 flex flex-col gap-3.5 border-t border-border/20 bg-gradient-to-r from-card/95 via-card/90 to-card/95 p-5 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3 opacity-50" />
                {error && (
                  <Alert variant="destructive" className="relative shadow-md">
                    <AlertTitle className="font-bold text-sm">No se pudo completar la consulta</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
                <form
                  className="relative flex w-full flex-col gap-3.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                  }}
                >
                  <Textarea
                    placeholder="Pregunta sobre tu flota, solicita análisis o información específica..."
                    value={input}
                    ref={textareaRef}
                    onInput={adjustTextareaHeight}
                    onChange={(event) => {
                      setInput(event.target.value);
                      adjustTextareaHeight();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="min-h-[70px] max-h-[180px] resize-none rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/98 to-muted/5 px-4 py-3.5 text-sm leading-relaxed shadow-lg backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:shadow-xl focus-visible:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary/10"
                  />
                  <p className="text-[0.7rem] text-muted-foreground">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[0.65rem] font-mono shadow-sm">Enter</kbd> para enviar • <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[0.65rem] font-mono shadow-sm">Shift+Enter</kbd> para nueva línea
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {activeModel ? (
                        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary shadow-sm">
                          <Sparkles className="mr-1 h-3 w-3" />
                          {activeModel}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-border/40 shadow-sm">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Selección automática
                        </Badge>
                      )}
                      {usage && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="font-mono text-[0.7rem] tabular-nums shadow-sm">
                            In: {usage.promptTokens}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[0.7rem] tabular-nums shadow-sm">
                            Out: {usage.completionTokens}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-[0.7rem] font-semibold tabular-nums shadow-sm">
                            {usage.totalTokens}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={reset}
                        disabled={isLoading}
                        className="h-9 rounded-lg px-3 hover:bg-primary/5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      {isLoading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={stop}
                          className="h-9 rounded-lg px-3 hover:bg-destructive/5"
                        >
                          <CircleStop className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !input.trim()}
                        className="gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <SendHorizontal className="h-3.5 w-3.5" />
                        )}
                        <span>{isLoading ? 'Generando...' : 'Enviar'}</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </CardFooter>
            </Card>
            {showDockedPanel ? (
              <div className="space-y-3.5">{contextPanels}</div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/30 p-6 text-center shadow-sm">
                <div className="mx-auto rounded-xl bg-primary/10 p-3">
                  <SidebarOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Panel contextual desacoplado</p>
                  <p className="text-xs text-muted-foreground">
                    Abre el panel lateral para consultar el resumen
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContextSheetOpen(true)}
                  className="gap-2 rounded-xl hover:bg-primary/5"
                >
                  <SidebarOpen className="h-3.5 w-3.5" />
                  Abrir panel
                </Button>
              </div>
            )}
          </div>
          <Sheet open={contextMode === 'floating' && contextSheetOpen} onOpenChange={setContextSheetOpen}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader className="space-y-2 border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-sm font-semibold">Panel contextual</SheetTitle>
                    <SheetDescription className="text-xs">
                      Resumen de la conversación
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-4 space-y-3.5">{contextPanels}</div>
            </SheetContent>
          </Sheet>
        </Layout>
      )}
      {/* Floating prompt stays visible in the assistant page and sends via the chatbot */}
      {!isMobile && (
        <FloatingPrompt
          onSend={async (text) => {
            await handleSubmit(text);
          }}
        />
      )}
    </>
  );
}



