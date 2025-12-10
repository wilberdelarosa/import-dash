import { FormEvent, useEffect, useMemo, useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ReadOnlyBanner } from '@/components/ui/ReadOnlyBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Draggable from 'react-draggable';
import {
  Loader2,
  Wrench,
  CalendarCheck,
  Gauge,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  X,
  Minimize2,
  GripVertical,
  AlertTriangle,
  CalendarRange,
  Route,
  MapPinned,
  GraduationCap,
  ClipboardList,
  Bell,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { EquipoSelectorDialog } from '@/components/EquipoSelectorDialog';
import { useCaterpillarData } from '@/hooks/useCaterpillarData';
import { getStaticCaterpillarData } from '@/data/caterpillarMaintenance';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import type { ActualizacionHorasKm, MantenimientoProgramado, MantenimientoRealizado } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { ControlMantenimientoMobile } from '@/pages/mobile/ControlMantenimientoMobile';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleDateString();
};

const resolveIntervaloCodigo = (mantenimiento: MantenimientoProgramado | null | undefined) => {
  if (!mantenimiento) return '';
  const match = mantenimiento.tipoMantenimiento?.match(/(PM\d)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }
  if (!mantenimiento.frecuencia) return '';
  if (mantenimiento.frecuencia <= 250) return 'PM1';
  if (mantenimiento.frecuencia <= 500) return 'PM2';
  if (mantenimiento.frecuencia <= 1000) return 'PM3';
  if (mantenimiento.frecuencia <= 2000) return 'PM4';
  return '';
};

const obtenerSemanaActual = () => {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - 6);
  const toISODate = (fecha: Date) => fecha.toISOString().split('T')[0];
  return {
    desde: toISODate(inicio),
    hasta: toISODate(fin),
  };
};

const normalizarRangoFechas = (desde: string, hasta: string) => {
  // Parsear fechas en tiempo local (YYYY-MM-DD)
  const [yInicio, mInicio, dInicio] = desde.split('-').map(Number);
  const [yFin, mFin, dFin] = hasta.split('-').map(Number);

  const inicio = new Date(yInicio, mInicio - 1, dInicio, 0, 0, 0, 0);
  const fin = new Date(yFin, mFin - 1, dFin, 23, 59, 59, 999);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) {
    return null;
  }

  return {
    desde: inicio.toISOString(),
    hasta: fin.toISOString(),
  };
};

interface RutaPlanItem {
  ficha: string;
  nombre: string;
  categoria: string;
  intervalo: string;
  intervaloDescripcion: string;
  restante: number;
  proximo: number;
  tareas: string[];
  kit: string[];
  capacitacion: string;
}

interface ResumenActualizaciones {
  desde: string;
  hasta: string;
  actualizados: {
    mantenimiento: MantenimientoProgramado;
    evento: ActualizacionHorasKm | null;
  }[];
  pendientes: MantenimientoProgramado[];
}

export default function ControlMantenimientoProfesional() {
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const {
    data,
    loading,
    updateHorasActuales,
    registrarMantenimientoRealizado,
  } = useSupabaseDataContext();
  const { toast } = useToast();
  const { isSupervisor, isAdmin } = useUserRoles();
  
  // Supervisor es solo lectura - no puede editar
  const isReadOnly = isSupervisor && !isAdmin;

  // ============================================
  // TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER RETURN CONDICIONAL
  // ============================================

  // Lista derivada: solo equipos activos (no deben mostrarse inactivos en la UI)
  const activeEquipos = useMemo(() => data.equipos.filter((e) => e.activo), [data.equipos]);

  const [selectedFicha, setSelectedFicha] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');

  // Estados para planificador
  const [planFicha, setPlanFicha] = useState<string | null>(null);
  const [planIntervalo, setPlanIntervalo] = useState<string>('');
  const [rutaMarcada, setRutaMarcada] = useState<string[]>([]);
  const [tabActivo, setTabActivo] = useState<'mantenimiento' | 'planificador'>('mantenimiento');

  const [horasLectura, setHorasLectura] = useState('');
  const [fechaLectura, setFechaLectura] = useState('');
  const [responsableLectura, setResponsableLectura] = useState('');
  const [notasLectura, setNotasLectura] = useState('');
  const [unidadLectura, setUnidadLectura] = useState<'horas' | 'km'>('horas');

  const [registroFecha, setRegistroFecha] = useState('');
  const [registroHoras, setRegistroHoras] = useState('');
  const [registroResponsable, setRegistroResponsable] = useState('');
  const [registroObservaciones, setRegistroObservaciones] = useState('');
  const [registroFiltros, setRegistroFiltros] = useState('');
  const [unidadRegistro, setUnidadRegistro] = useState<'horas' | 'km'>('horas');

  const [updating, setUpdating] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [reportesOpen, setReportesOpen] = useState(false);
  const [reporteDesde, setReporteDesde] = useState(() => {
    const saved = localStorage.getItem('reporteDesde');
    return saved || '';
  });
  const [reporteHasta, setReporteHasta] = useState(() => {
    const saved = localStorage.getItem('reporteHasta');
    return saved || '';
  });
  const [reporteRango, setReporteRango] = useState<{ desde: string; hasta: string } | null>(() => {
    const saved = localStorage.getItem('reporteRango');
    return saved ? JSON.parse(saved) : null;
  });

  const [panelOpen, setPanelOpen] = useState(false);

  // Estados para actualización rápida en panel flotante
  const [fichaRapida, setFichaRapida] = useState('');
  const [equipoRapido, setEquipoRapido] = useState<MantenimientoProgramado | null>(null);
  const [lecturaRapida, setLecturaRapida] = useState('');
  const [fechaRapida, setFechaRapida] = useState('');
  const [responsableRapido, setResponsableRapido] = useState('');
  const [notasRapida, setNotasRapida] = useState('');
  const [updatingRapido, setUpdatingRapido] = useState(false);

  // Alertas de actualización
  const [alertasActualizacion, setAlertasActualizacion] = useState<Array<{
    id: string;
    ficha: string;
    nombreEquipo: string;
    lecturaAnterior: number;
    lecturaActual: number;
    incremento: number;
    fecha: string;
    timestamp: number;
  }>>([]);

  // Equipos Caterpillar para planificador
  const caterpillarEquipos = useMemo(
    () => activeEquipos
      .filter((equipo) => equipo.marca?.toLowerCase().includes('cat'))
      .sort((a, b) => a.ficha.localeCompare(b.ficha)),
    [activeEquipos],
  );

  useEffect(() => {
    if (!loading && data.mantenimientosProgramados.length > 0 && !selectedFicha) {
      // Seleccionar el primer mantenimiento que corresponda a un equipo activo
      const primera = data.mantenimientosProgramados.find((m) => activeEquipos.some((e) => e.ficha === m.ficha));
      if (primera) setSelectedFicha(primera.ficha);
    }
  }, [loading, data.mantenimientosProgramados, selectedFicha, activeEquipos]);

  useEffect(() => {
    if (caterpillarEquipos.length > 0) {
      setPlanFicha((current) => {
        if (current && caterpillarEquipos.some((equipo) => equipo.ficha === current)) {
          return current;
        }
        return caterpillarEquipos[0].ficha;
      });
    } else {
      setPlanFicha(null);
    }
  }, [caterpillarEquipos]);

  // Solicitar permisos de notificaciones del navegador al cargar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persistir fechas de reporte en localStorage
  useEffect(() => {
    if (reporteDesde) {
      localStorage.setItem('reporteDesde', reporteDesde);
    }
  }, [reporteDesde]);

  useEffect(() => {
    if (reporteHasta) {
      localStorage.setItem('reporteHasta', reporteHasta);
    }
  }, [reporteHasta]);

  useEffect(() => {
    if (reporteRango) {
      localStorage.setItem('reporteRango', JSON.stringify(reporteRango));
    }
  }, [reporteRango]);

  // Buscar equipo por ficha en actualización rápida
  useEffect(() => {
    if (fichaRapida.trim()) {
      const busqueda = fichaRapida.trim().toUpperCase();

      // Buscar coincidencia exacta primero
      let mantenimiento = data.mantenimientosProgramados.find(
        (m) => m.ficha.toUpperCase() === busqueda
      );

      // Si no encuentra, buscar por coincidencia parcial flexible
      if (!mantenimiento) {
        // Normalizar búsqueda: remover guiones y ceros a la izquierda
        const busquedaNormalizada = busqueda.replace(/-/g, '').replace(/^0+/, '');

        mantenimiento = data.mantenimientosProgramados.find((m) => {
          const fichaOriginal = m.ficha.toUpperCase();
          const fichaNormalizada = fichaOriginal.replace(/-/g, '').replace(/^0+/, '');

          // Buscar coincidencias flexibles
          return (
            fichaNormalizada === busquedaNormalizada || // Exacta normalizada (AC033 = AC33)
            fichaNormalizada.includes(busquedaNormalizada) || // Contiene (AC033 contiene 33)
            busquedaNormalizada.includes(fichaNormalizada) || // Es contenida
            fichaOriginal.includes(busqueda) // Contiene original (AC-033 contiene AC-033)
          );
        });
      }

      if (mantenimiento) {
        setEquipoRapido(mantenimiento);
        setLecturaRapida(mantenimiento.horasKmActuales.toString());
        setFechaRapida(new Date().toISOString().slice(0, 10));
      } else {
        setEquipoRapido(null);
      }
    } else {
      setEquipoRapido(null);
    }
  }, [fichaRapida, data.mantenimientosProgramados]);

  const selected = useMemo(
    () => {
      const mantenimiento = data.mantenimientosProgramados.find((m) => m.ficha === selectedFicha);
      return mantenimiento ?? null;
    },
    [data.mantenimientosProgramados, selectedFicha]
  );

  useEffect(() => {
    if (selected) {
      setHorasLectura(selected.horasKmActuales.toString());
      setRegistroHoras(selected.horasKmActuales.toString());
      setFechaLectura(new Date().toISOString().slice(0, 10));
      setRegistroFecha(new Date().toISOString().slice(0, 10));
      const unidadInferida = selected.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas';
      setUnidadLectura(unidadInferida as 'horas' | 'km');
      setUnidadRegistro(unidadInferida as 'horas' | 'km');
    }
  }, [selectedFicha, selected]);

  const categorias = useMemo(() => {
    const cats = new Set(activeEquipos.map(eq => eq.categoria).filter(c => c && c.trim() !== ''));
    return Array.from(cats).sort();
  }, [activeEquipos]);

  // Lógica del Planificador
  const planEquipo = useMemo(
    () => (planFicha ? activeEquipos.find((equipo) => equipo.ficha === planFicha) ?? null : null),
    [activeEquipos, planFicha],
  );

  const planMantenimientos = useMemo(
    () =>
      planFicha
        ? data.mantenimientosProgramados
          .filter((mantenimiento) => mantenimiento.ficha === planFicha)
          .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
        : [],
    [data.mantenimientosProgramados, planFicha],
  );

  const planProximo = planMantenimientos[0] ?? null;
  const planIntervaloSugerido = resolveIntervaloCodigo(planProximo);
  const esPlanCaterpillar = (planEquipo?.marca ?? '').toLowerCase().includes('cat');

  const { data: planCatData, loading: loadingPlanCat } = useCaterpillarData(
    esPlanCaterpillar ? planEquipo?.modelo ?? '' : '',
    esPlanCaterpillar ? planEquipo?.numeroSerie ?? '' : '',
  );

  const intervalosDisponibles = useMemo(() => planCatData.intervalos ?? [], [planCatData.intervalos]);

  useEffect(() => {
    if (intervalosDisponibles.length === 0) {
      setPlanIntervalo('');
      return;
    }
    setPlanIntervalo((current) => {
      if (current && intervalosDisponibles.some((intervalo) => intervalo.codigo === current)) {
        return current;
      }
      if (planIntervaloSugerido && intervalosDisponibles.some((intervalo) => intervalo.codigo === planIntervaloSugerido)) {
        return planIntervaloSugerido;
      }
      return intervalosDisponibles[0].codigo;
    });
  }, [intervalosDisponibles, planIntervaloSugerido]);

  const planIntervaloDescripcion = useMemo(() => {
    if (!planIntervalo) return 'Selecciona un intervalo para ver el detalle oficial.';
    return (
      intervalosDisponibles.find((intervalo) => intervalo.codigo === planIntervalo)?.descripcion ??
      'No hay descripción homologada para este intervalo.'
    );
  }, [intervalosDisponibles, planIntervalo]);

  const planTareas = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    return planCatData.tareasPorIntervalo?.[planIntervalo] ?? [];
  }, [planCatData.tareasPorIntervalo, planIntervalo]);

  const planKit = useMemo(() => {
    if (!planIntervalo) return [] as string[];
    const piezas = planCatData.piezasPorIntervalo?.[planIntervalo] ?? [];
    return piezas.map((pieza) => `${pieza.pieza.numero_parte} · ${pieza.pieza.descripcion}`);
  }, [planCatData.piezasPorIntervalo, planIntervalo]);

  const planEspeciales = useMemo(
    () =>
      planIntervalo
        ? (planCatData.mantenimientosEspeciales ?? []).filter(
          (especial) => especial.intervaloCodigo === planIntervalo,
        )
        : [],
    [planCatData.mantenimientosEspeciales, planIntervalo],
  );

  const planCapacitacion =
    planEspeciales[0]?.responsableSugerido
    ?? 'Define el responsable certificado para este plan';

  const planRuta: RutaPlanItem[] = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof getStaticCaterpillarData> | null>();
    return data.mantenimientosProgramados
      .map((mantenimiento) => {
        // Omitir mantenimientos cuyo equipo esté inactivo
        const equipo = activeEquipos.find((item) => item.ficha === mantenimiento.ficha);
        if (!equipo || !equipo.marca?.toLowerCase().includes('cat')) {
          return null;
        }
        const intervalo = resolveIntervaloCodigo(mantenimiento) || 'Sin MP';
        let catData = cache.get(equipo.modelo);
        if (!cache.has(equipo.modelo)) {
          catData = getStaticCaterpillarData(equipo.modelo);
          cache.set(equipo.modelo, catData ?? null);
        }
        const tareas = intervalo && catData?.tareasPorIntervalo?.[intervalo]
          ? catData.tareasPorIntervalo[intervalo]
          : [];
        const kit = intervalo && catData?.piezasPorIntervalo?.[intervalo]
          ? catData.piezasPorIntervalo[intervalo].map((pieza) => `${pieza.pieza.numero_parte} · ${pieza.pieza.descripcion}`)
          : [];
        const intervaloDescripcion = intervalo && catData?.intervalos
          ? catData.intervalos.find((item) => item.codigo === intervalo)?.descripcion ?? 'Sin descripción'
          : 'Sin descripción';
        const capacitacion =
          catData?.mantenimientosEspeciales?.find((especial) => especial.intervaloCodigo === intervalo)?.responsableSugerido ||
          'Asignar técnico certificado';

        return {
          ficha: equipo.ficha,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          intervalo,
          intervaloDescripcion,
          restante: mantenimiento.horasKmRestante,
          proximo: mantenimiento.proximoMantenimiento,
          tareas,
          kit,
          capacitacion,
        } satisfies RutaPlanItem;
      })
      .filter((item): item is RutaPlanItem => item !== null)
      .sort((a, b) => a.ficha.localeCompare(b.ficha));
  }, [activeEquipos, data.mantenimientosProgramados]);

  useEffect(() => {
    setRutaMarcada((prev) => prev.filter((ficha) => planRuta.some((item) => item.ficha === ficha)));
  }, [planRuta]);

  const planRutaFiltrada = useMemo(
    () => (planIntervalo ? planRuta.filter((item) => item.intervalo === planIntervalo) : planRuta),
    [planIntervalo, planRuta],
  );

  const rutaMarcadaFiltrada = useMemo(
    () => rutaMarcada.filter((ficha) => planRutaFiltrada.some((item) => item.ficha === ficha)),
    [rutaMarcada, planRutaFiltrada],
  );

  const rutaSeleccionadaCount = rutaMarcadaFiltrada.length;
  const rutaHeaderState: boolean | 'indeterminate' = planRutaFiltrada.length === 0
    ? false
    : rutaSeleccionadaCount === planRutaFiltrada.length
      ? true
      : rutaSeleccionadaCount > 0
        ? 'indeterminate'
        : false;

  const toggleRutaFicha = (ficha: string) => {
    setRutaMarcada((prev) => (prev.includes(ficha) ? prev.filter((item) => item !== ficha) : [...prev, ficha]));
  };

  const toggleRutaFiltrada = (checked: boolean) => {
    if (checked) {
      setRutaMarcada((prev) => {
        const current = new Set(prev);
        planRutaFiltrada.forEach((item) => current.add(item.ficha));
        return Array.from(current);
      });
    } else {
      setRutaMarcada((prev) => prev.filter((ficha) => !planRutaFiltrada.some((item) => item.ficha === ficha)));
    }
  };

  const limpiarRutaFiltrada = () => {
    setRutaMarcada((prev) => prev.filter((ficha) => !planRutaFiltrada.some((item) => item.ficha === ficha)));
  };

  const equiposFiltrados = useMemo(() => {
    return data.mantenimientosProgramados.filter((m) => {
      // Solo considerar mantenimientos de equipos activos
      const equipo = activeEquipos.find(eq => eq.ficha === m.ficha);

      // Si el equipo no existe o no está activo, excluir este mantenimiento
      if (!equipo) return false;

      const matchBusqueda =
        m.ficha.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.nombreEquipo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (equipo?.marca || '').toLowerCase().includes(busqueda.toLowerCase());

      const matchCategoria = filtroCategoria === 'all' ||
        (equipo?.categoria || '') === filtroCategoria;

      let matchEstado = true;

      // Si hay rango de reporte y el filtro es registrada/pendientes
      if (reporteRango && (filtroEstado === 'registrada' || filtroEstado === 'pendientes')) {
        const fechaUltima = new Date(m.fechaUltimaActualizacion);
        const inicioRango = new Date(reporteRango.desde);
        const finRango = new Date(reporteRango.hasta);

        fechaUltima.setHours(0, 0, 0, 0);
        inicioRango.setHours(0, 0, 0, 0);
        finRango.setHours(23, 59, 59, 999);

        const actualizadoEnRango = fechaUltima >= inicioRango && fechaUltima <= finRango;

        matchEstado = (filtroEstado === 'registrada' && actualizadoEnRango) ||
          (filtroEstado === 'pendientes' && !actualizadoEnRango);
      } else if (filtroEstado !== 'all' && filtroEstado !== 'registrada' && filtroEstado !== 'pendientes') {
        // Filtros de criticidad (cuando no hay rango o no se usan registrada/pendientes)
        matchEstado = (filtroEstado === 'critico' && m.horasKmRestante <= 25) ||
          (filtroEstado === 'alerta' && m.horasKmRestante > 25 && m.horasKmRestante <= 50) ||
          (filtroEstado === 'normal' && m.horasKmRestante > 50);
      }

      return matchBusqueda && matchCategoria && matchEstado;
    }).sort((a, b) => a.ficha.localeCompare(b.ficha));
  }, [data.mantenimientosProgramados, activeEquipos, busqueda, filtroCategoria, filtroEstado, reporteRango]);

  const resumenActualizaciones = useMemo(() => {
    if (!reporteRango) return null;

    const inicio = new Date(reporteRango.desde);
    const fin = new Date(reporteRango.hasta);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return null;
    }

    const eventosEnRango = data.actualizacionesHorasKm.filter((evento) => {
      const fechaEvento = new Date(evento.fecha);
      if (Number.isNaN(fechaEvento.getTime())) return false;
      return fechaEvento >= inicio && fechaEvento <= fin;
    });

    const eventosPorFicha = new Map<string, ActualizacionHorasKm[]>();
    eventosEnRango.forEach((evento) => {
      const listaEventos = eventosPorFicha.get(evento.ficha) ?? [];
      listaEventos.push(evento);
      eventosPorFicha.set(evento.ficha, listaEventos);
    });

    const actualizados: ResumenActualizaciones['actualizados'] = [];
    const pendientes: ResumenActualizaciones['pendientes'] = [];

    data.mantenimientosProgramados.forEach((mantenimiento) => {
      const fechaUltima = new Date(mantenimiento.fechaUltimaActualizacion);
      if (Number.isNaN(fechaUltima.getTime())) {
        pendientes.push(mantenimiento);
        return;
      }

      const fechaUltimaAjustada = new Date(fechaUltima);
      fechaUltimaAjustada.setHours(0, 0, 0, 0);

      if (fechaUltimaAjustada < inicio || fechaUltimaAjustada > fin) {
        pendientes.push(mantenimiento);
        return;
      }

      const eventosFicha = eventosPorFicha.get(mantenimiento.ficha) ?? [];
      const eventoRelacionado =
        eventosFicha.find((evento) => {
          const fechaEvento = new Date(evento.fecha);
          if (Number.isNaN(fechaEvento.getTime())) return false;
          return fechaEvento.toDateString() === fechaUltima.toDateString();
        }) ?? null;

      actualizados.push({
        mantenimiento,
        evento: eventoRelacionado,
      });
    });

    return {
      desde: reporteRango.desde,
      hasta: reporteRango.hasta,
      actualizados,
      pendientes,
    } satisfies ResumenActualizaciones;
  }, [data.actualizacionesHorasKm, data.mantenimientosProgramados, reporteRango]);

  // Contar solo mantenimientos que correspondan a equipos activos
  const totalEquiposPlanificados = data.mantenimientosProgramados.filter((m) => activeEquipos.some((e) => e.ficha === m.ficha)).length;
  const coberturaSemanal =
    resumenActualizaciones && totalEquiposPlanificados > 0
      ? Math.round((resumenActualizaciones.actualizados.length / totalEquiposPlanificados) * 100)
      : 0;
  const pendientesCriticos = resumenActualizaciones
    ? resumenActualizaciones.pendientes.filter((mantenimiento) => (mantenimiento.horasKmRestante ?? 0) <= 25)
    : [];

  // Solo mostrar mantenimientos de equipos activos en lista de próximos
  const proximos = data.mantenimientosProgramados
    .filter((m) => activeEquipos.some((e) => e.ficha === m.ficha))
    .slice()
    .sort((a, b) => a.horasKmRestante - b.horasKmRestante)
    .slice(0, 15);

  const hasMantenimientosProgramados = data.mantenimientosProgramados.length > 0;

  const handleActualizarHoras = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      await updateHorasActuales({
        mantenimientoId: selected.id,
        horasKm: Number(horasLectura),
        fecha: fechaLectura,
        usuarioResponsable: responsableLectura || undefined,
        observaciones: notasLectura || undefined,
        unidad: unidadLectura,
      });
      setNotasLectura('');
    } finally {
      setUpdating(false);
    }
  };

  const handleRegistrarMantenimiento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setRegistering(true);
    try {
      const filtros = registroFiltros
        .split(',')
        .map((filtro) => filtro.trim())
        .filter(Boolean)
        .map((nombre) => ({ nombre, cantidad: 1 } as MantenimientoRealizado['filtrosUtilizados'][number]));

      await registrarMantenimientoRealizado({
        mantenimientoId: selected.id,
        fecha: registroFecha,
        horasKm: Number(registroHoras),
        observaciones: registroObservaciones || undefined,
        filtrosUtilizados: filtros as MantenimientoRealizado['filtrosUtilizados'],
        usuarioResponsable: registroResponsable || undefined,
        unidad: unidadRegistro,
      });
      setRegistroObservaciones('');
      setRegistroFiltros('');
    } finally {
      setRegistering(false);
    }
  };

  const handleGenerarReporte = () => {
    if (!reporteDesde || !reporteHasta) {
      toast({
        title: 'Selecciona el rango',
        description: 'Debes indicar fecha inicial y final',
        variant: 'destructive',
      });
      return;
    }

    const rangoNormalizado = normalizarRangoFechas(reporteDesde, reporteHasta);
    if (!rangoNormalizado) {
      toast({
        title: 'Rango inválido',
        description: 'Verifica las fechas',
        variant: 'destructive',
      });
      return;
    }

    setReporteRango(rangoNormalizado);
    setPanelOpen(true);
  };

  const handleLimpiarReporte = () => {
    setReporteRango(null);
    setReporteDesde('');
    setReporteHasta('');
    setFiltroEstado('all');
    localStorage.removeItem('reporteRango');
    localStorage.removeItem('reporteDesde');
    localStorage.removeItem('reporteHasta');
    toast({
      title: 'Reporte limpiado',
      description: 'Se eliminó el rango de fechas y filtros',
    });
  };

  const handleActualizarRapido = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!equipoRapido) return;

    const lecturaAnterior = equipoRapido.horasKmActuales;
    const lecturaNueva = Number(lecturaRapida);
    const incremento = lecturaNueva - lecturaAnterior;

    setUpdatingRapido(true);
    try {
      const unidadInferida = equipoRapido.tipoMantenimiento.toLowerCase().includes('km') ? 'km' : 'horas';
      await updateHorasActuales({
        mantenimientoId: equipoRapido.id,
        horasKm: lecturaNueva,
        fecha: fechaRapida,
        usuarioResponsable: responsableRapido || undefined,
        observaciones: notasRapida || undefined,
        unidad: unidadInferida as 'horas' | 'km',
      });

      // Crear alerta de actualización
      const nuevaAlerta = {
        id: `${equipoRapido.id}-${Date.now()}`,
        ficha: equipoRapido.ficha,
        nombreEquipo: equipoRapido.nombreEquipo,
        lecturaAnterior,
        lecturaActual: lecturaNueva,
        incremento,
        fecha: fechaRapida,
        timestamp: Date.now(),
      };

      setAlertasActualizacion(prev => [nuevaAlerta, ...prev].slice(0, 50)); // Mantener últimas 50 alertas

      // Mostrar notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        const unidad = unidadInferida === 'km' ? 'km' : 'horas';
        new Notification('🔔 Lectura Actualizada', {
          body: `${equipoRapido.ficha} - ${equipoRapido.nombreEquipo}\nAnterior: ${lecturaAnterior} ${unidad}\nActual: ${lecturaNueva} ${unidad}\nIncremento: +${incremento} ${unidad}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: equipoRapido.id.toString(),
          requireInteraction: false,
          silent: false
        });
      }

      toast({
        title: '✅ Lectura actualizada',
        description: `${equipoRapido.nombreEquipo} - ${lecturaRapida} ${unidadInferida}`,
      });

      // Limpiar formulario
      setFichaRapida('');
      setEquipoRapido(null);
      setNotasRapida('');
      setResponsableRapido('');

      // Regenerar reporte si existe
      if (reporteRango) {
        const rangoNormalizado = normalizarRangoFechas(reporteDesde, reporteHasta);
        if (rangoNormalizado) {
          setReporteRango(rangoNormalizado);
        }
      }
    } catch (error) {
      toast({
        title: 'Error al actualizar',
        description: 'Intenta nuevamente',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRapido(false);
    }
  };

  // ============================================
  // RETURNS CONDICIONALES DESPUÉS DE TODOS LOS HOOKS
  // ============================================

  // Renderizar versión móvil
  if (isMobile) {
    return (
      <ControlMantenimientoMobile
        equipos={data.mantenimientosProgramados}
        catalogoEquipos={data.equipos}
        onUpdateLectura={async (id, lectura, fecha, notas) => {
          await updateHorasActuales({
            mantenimientoId: id,
            horasKm: lectura,
            fecha,
            observaciones: notas,
            unidad: 'horas' // Esto debería inferirse del equipo, pero por simplificación inicial
          });
        }}
        onRegistrarMantenimiento={async (id, datos) => {
          await registrarMantenimientoRealizado({
            mantenimientoId: id,
            ...datos
          });
        }}
        loading={loading}
      />
    );
  }

  if (loading) {
    return (
      <Layout title="Control de Mantenimiento">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (!hasMantenimientosProgramados) {
    return (
      <Layout title="Control de Mantenimiento">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sin mantenimientos programados</AlertTitle>
          <AlertDescription>
            Define al menos un plan de mantenimiento para comenzar.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Control de Mantenimiento">
      {/* Banner de solo lectura para supervisores */}
      {isReadOnly && <ReadOnlyBanner className="mb-4" />}
      
      {/* Tabs para Mantenimiento y Planificador */}
      <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'mantenimiento' | 'planificador')} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="mantenimiento">
            <Wrench className="h-4 w-4 mr-2" />
            Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="planificador">
            <Route className="h-4 w-4 mr-2" />
            Planificador
          </TabsTrigger>
        </TabsList>

        {/* Tab de Mantenimiento */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <div className="space-y-4">
            {/* Header Compacto con KPIs */}
            <div className="flex items-center gap-4 border rounded-lg bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Equipos</span>
                <span className="text-xl font-bold">{totalEquiposPlanificados}</span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Cobertura</span>
                <span className="text-xl font-bold text-green-600">{coberturaSemanal}%</span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Críticos</span>
                <span className={cn(
                  "text-xl font-bold",
                  pendientesCriticos.length > 0 ? "text-red-600" : "text-slate-400"
                )}>
                  {pendientesCriticos.length}
                </span>
              </div>
            </div>

            {/* Layout de 2 Columnas */}
            <div className="grid gap-4 lg:grid-cols-[400px,1fr]">
              {/* Columna Izquierda: Selector de Equipos */}
              <div className="space-y-3">
                {/* Filtros compactos */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar equipo..."
                      className="h-9 pl-8 text-sm"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>

                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {reporteRango ? (
                        <>
                          <SelectItem value="registrada">Lectura registrada</SelectItem>
                          <SelectItem value="pendientes">Pendientes</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="critico">Crítico</SelectItem>
                          <SelectItem value="alerta">Alerta</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabla compacta de equipos */}
                <div className="rounded-md border bg-white dark:bg-slate-950 max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 text-xs">Ficha</TableHead>
                        <TableHead className="h-8 text-xs">Equipo</TableHead>
                        <TableHead className="h-8 text-xs text-right">Restante</TableHead>
                        <TableHead className="h-8 w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equiposFiltrados.map((m) => (
                        <TableRow
                          key={m.id}
                          className={cn(
                            "cursor-pointer h-14 transition-colors",
                            selectedFicha === m.ficha && "bg-slate-100 dark:bg-slate-800"
                          )}
                          onClick={() => setSelectedFicha(m.ficha)}
                        >
                          <TableCell className="font-mono text-xs py-2">{m.ficha}</TableCell>
                          <TableCell className="py-2">
                            <div>
                              <div className="font-medium text-sm leading-tight">{m.nombreEquipo}</div>
                              <div className="text-xs text-slate-500">
                                {activeEquipos.find(eq => eq.ficha === m.ficha)?.categoria || 'Sin categoría'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Badge
                              variant={getRemainingVariant(m.horasKmRestante)}
                              className="text-xs px-1.5"
                            >
                              {m.horasKmRestante}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Columna Derecha: Formularios */}
              <div className="space-y-4">
                {selected && (
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3 px-4 py-3 border-b bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {selected.nombreEquipo}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {selected.ficha}
                          </Badge>
                          <Badge
                            variant={getRemainingVariant(selected.horasKmRestante)}
                            className="text-xs"
                          >
                            {selected.horasKmRestante} restante
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4">
                      <Tabs defaultValue="actualizar" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2 h-9">
                          <TabsTrigger value="actualizar" className="text-sm">Actualizar</TabsTrigger>
                          <TabsTrigger value="registrar" className="text-sm">Registrar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="actualizar" className="space-y-3 mt-4">
                          <form onSubmit={handleActualizarHoras} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Nueva lectura</Label>
                                <Input
                                  type="number"
                                  className="h-9 text-sm"
                                  value={horasLectura}
                                  onChange={(e) => setHorasLectura(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Unidad</Label>
                                <Select value={unidadLectura} onValueChange={(v) => setUnidadLectura(v as 'horas' | 'km')}>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="horas">Horas</SelectItem>
                                    <SelectItem value="km">Kilómetros</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Fecha</Label>
                                <Input
                                  type="date"
                                  className="h-9 text-sm"
                                  value={fechaLectura}
                                  onChange={(e) => setFechaLectura(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Responsable</Label>
                                <Input
                                  className="h-9 text-sm"
                                  value={responsableLectura}
                                  onChange={(e) => setResponsableLectura(e.target.value)}
                                  placeholder="Opcional"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Observaciones</Label>
                              <Textarea
                                rows={2}
                                className="text-sm resize-none"
                                value={notasLectura}
                                onChange={(e) => setNotasLectura(e.target.value)}
                                placeholder="Opcional"
                              />
                            </div>

                            <Button type="submit" className="w-full h-9 text-sm" disabled={updating || isReadOnly}>
                              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              {isReadOnly ? 'Solo lectura' : 'Guardar lectura'}
                            </Button>
                          </form>
                        </TabsContent>

                        <TabsContent value="registrar" className="space-y-3 mt-4">
                          <form onSubmit={handleRegistrarMantenimiento} className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Fecha</Label>
                                <Input
                                  type="date"
                                  className="h-9 text-sm"
                                  value={registroFecha}
                                  onChange={(e) => setRegistroFecha(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Lectura</Label>
                                <Input
                                  type="number"
                                  className="h-9 text-sm"
                                  value={registroHoras}
                                  onChange={(e) => setRegistroHoras(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Unidad</Label>
                                <Select value={unidadRegistro} onValueChange={(v) => setUnidadRegistro(v as 'horas' | 'km')}>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="horas">Horas</SelectItem>
                                    <SelectItem value="km">Km</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Responsable</Label>
                              <Input
                                className="h-9 text-sm"
                                value={registroResponsable}
                                onChange={(e) => setRegistroResponsable(e.target.value)}
                                placeholder="Técnico responsable"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Repuestos (separar por coma)</Label>
                              <Textarea
                                rows={2}
                                className="text-sm resize-none"
                                value={registroFiltros}
                                onChange={(e) => setRegistroFiltros(e.target.value)}
                                placeholder="Filtro aceite, Filtro aire, etc."
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Observaciones</Label>
                              <Textarea
                                rows={3}
                                className="text-sm resize-none"
                                value={registroObservaciones}
                                onChange={(e) => setRegistroObservaciones(e.target.value)}
                                placeholder="Detalle del trabajo realizado"
                              />
                            </div>

                            <Button type="submit" className="w-full h-9 text-sm" disabled={registering || isReadOnly}>
                              {registering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                              {isReadOnly ? 'Solo lectura' : 'Registrar mantenimiento'}
                            </Button>
                          </form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Reportes Colapsables */}
            <Collapsible open={reportesOpen} onOpenChange={setReportesOpen}>
              <Card className="border-slate-200">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-semibold">
                          Reportes Semanales
                        </CardTitle>
                        {resumenActualizaciones && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary">{resumenActualizaciones.actualizados.length} actualizados</Badge>
                            <Badge variant="destructive">{resumenActualizaciones.pendientes.length} pendientes</Badge>
                          </div>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        reportesOpen && "rotate-180"
                      )} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={reporteDesde}
                        onChange={(e) => setReporteDesde(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-sm text-slate-500">a</span>
                      <Input
                        type="date"
                        value={reporteHasta}
                        onChange={(e) => setReporteHasta(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button onClick={handleGenerarReporte} size="sm" className="h-9">
                        Generar
                      </Button>
                      {reporteRango && (
                        <Button onClick={handleLimpiarReporte} size="sm" variant="outline" className="h-9">
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Próximos Mantenimientos */}
            <Card className="border-slate-200">
              <CardHeader className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-900">
                <CardTitle className="text-base font-semibold">
                  Próximos Mantenimientos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-96">
                  <Table className="text-sm">
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 text-xs">Equipo</TableHead>
                        <TableHead className="h-8 text-xs w-20">Ficha</TableHead>
                        <TableHead className="h-8 text-xs w-24 text-right">Lectura</TableHead>
                        <TableHead className="h-8 text-xs w-24 text-right">Restante</TableHead>
                        <TableHead className="h-8 text-xs w-24 text-right">Próximo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximos.map((m) => (
                        <TableRow key={m.id} className="h-10">
                          <TableCell className="py-1">
                            <div className="font-medium text-sm">{m.nombreEquipo}</div>
                            <div className="text-xs text-slate-500">{m.tipoMantenimiento}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs py-1">{m.ficha}</TableCell>
                          <TableCell className="text-right py-1">
                            <span className="text-sm">{m.horasKmActuales}</span>
                          </TableCell>
                          <TableCell className="text-right py-1">
                            <Badge variant={getRemainingVariant(m.horasKmRestante)} className="text-xs px-1">
                              {m.horasKmRestante}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-1">
                            <span className="text-sm font-medium">{m.proximoMantenimiento}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botón Flotante y Panel Arrastrable */}
          <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
            {panelOpen && (
              <Draggable
                handle=".drag-handle"
                defaultPosition={{ x: 0, y: 0 }}
                position={undefined}
              >
                <div
                  role="dialog"
                  aria-modal="false"
                  className="pointer-events-auto w-[95vw] max-w-[1400px] rounded-2xl border border-primary/20 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur flex flex-col max-h-[90vh]"
                >
                  <div className="drag-handle cursor-move flex items-start justify-between gap-4 border-b px-6 py-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold">
                          <CalendarRange className="h-5 w-5 text-primary" /> Panel Flotante de Gestión
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Arrastra para mover libremente. Actualiza lecturas y genera reportes sin salir de esta vista.
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cerrar panel</span>
                    </Button>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[380px,1fr] flex-1 min-h-0 overflow-hidden">
                    {/* Columna Izquierda: Actualización Rápida */}
                    <div className="border-r overflow-y-auto px-5 py-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          Actualización Rápida
                        </h4>
                        <p className="text-xs text-muted-foreground">Ingresa la ficha para actualizar la lectura</p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="fichaRapida" className="text-xs font-semibold">Ficha del equipo</Label>
                          <Input
                            id="fichaRapida"
                            placeholder="Ej: AC-003"
                            value={fichaRapida}
                            onChange={(e) => setFichaRapida(e.target.value.toUpperCase())}
                            className="h-9 text-sm font-mono"
                            autoComplete="off"
                          />
                        </div>

                        {fichaRapida && !equipoRapido && (
                          <Alert variant="destructive" className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-sm">Equipo no encontrado</AlertTitle>
                            <AlertDescription className="text-xs">
                              No existe un equipo con la ficha "{fichaRapida}"
                            </AlertDescription>
                          </Alert>
                        )}

                        {equipoRapido && (
                          <div className="space-y-3">
                            <Card className="border-primary/30 bg-white dark:bg-slate-950">
                              <CardContent className="p-3 space-y-2">
                                <div>
                                  <p className="font-semibold text-sm truncate">{equipoRapido.nombreEquipo}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {equipoRapido.tipoMantenimiento}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Actual:</span>
                                    <span className="font-semibold ml-1">{equipoRapido.horasKmActuales}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Próximo:</span>
                                    <span className="font-semibold ml-1">{equipoRapido.proximoMantenimiento}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Restante:</span>
                                    <Badge
                                      variant={getRemainingVariant(equipoRapido.horasKmRestante)}
                                      className="ml-1 text-xs"
                                    >
                                      {equipoRapido.horasKmRestante}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <form onSubmit={handleActualizarRapido} className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label htmlFor="lecturaRapida" className="text-xs font-semibold">Nueva lectura *</Label>
                                  <Input
                                    id="lecturaRapida"
                                    type="number"
                                    value={lecturaRapida}
                                    onChange={(e) => setLecturaRapida(e.target.value)}
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label htmlFor="fechaRapida" className="text-xs font-semibold">Fecha *</Label>
                                  <Input
                                    id="fechaRapida"
                                    type="date"
                                    value={fechaRapida}
                                    onChange={(e) => setFechaRapida(e.target.value)}
                                    className="h-8 text-sm"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor="responsableRapido" className="text-xs font-semibold">Responsable</Label>
                                <Input
                                  id="responsableRapido"
                                  placeholder="Nombre del responsable"
                                  value={responsableRapido}
                                  onChange={(e) => setResponsableRapido(e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor="notasRapida" className="text-xs font-semibold">Observaciones</Label>
                                <Textarea
                                  id="notasRapida"
                                  placeholder="Notas adicionales..."
                                  value={notasRapida}
                                  onChange={(e) => setNotasRapida(e.target.value)}
                                  className="text-sm min-h-[50px] resize-none"
                                  rows={2}
                                />
                              </div>

                              <Button
                                type="submit"
                                className="w-full gap-2 h-9"
                                disabled={updatingRapido || isReadOnly}
                              >
                                {updatingRapido ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Actualizando...
                                  </>
                                ) : isReadOnly ? (
                                  'Solo lectura'
                                ) : (
                                  <>
                                    <CalendarCheck className="h-4 w-4" />
                                    Actualizar Lectura
                                  </>
                                )}
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Sección de Alertas de Actualización */}
                      {alertasActualizacion.length > 0 && (
                        <div className="pt-4 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold flex items-center gap-2">
                              <Bell className="h-3.5 w-3.5 text-amber-500" />
                              Alertas de Actualización
                            </h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setAlertasActualizacion([])}
                            >
                              Limpiar
                            </Button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alertasActualizacion.map((alerta) => (
                              <Alert key={alerta.id} className="py-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                                <div className="flex items-start gap-2">
                                  <Bell className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate">{alerta.ficha} - {alerta.nombreEquipo}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(alerta.timestamp).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Anterior:</span>
                                        <p className="font-semibold">{alerta.lecturaAnterior}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Actual:</span>
                                        <p className="font-semibold text-green-600">{alerta.lecturaActual}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Incremento:</span>
                                        <p className="font-semibold text-blue-600">+{alerta.incremento}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Columna Derecha: Reportes */}
                    <div className="overflow-y-auto px-5 py-5 space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 text-primary" />
                          Reportes por Rango
                        </h4>
                        <p className="text-xs text-muted-foreground">Genera reportes de actualizaciones por período</p>
                      </div>

                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor="reporteDesde" className="font-semibold text-xs">Desde</Label>
                            <Input
                              id="reporteDesde"
                              type="date"
                              value={reporteDesde}
                              onChange={(event) => setReporteDesde(event.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="reporteHasta" className="font-semibold text-xs">Hasta</Label>
                            <Input
                              id="reporteHasta"
                              type="date"
                              value={reporteHasta}
                              onChange={(event) => setReporteHasta(event.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => {
                              const semana = obtenerSemanaActual();
                              setReporteDesde(semana.desde);
                              setReporteHasta(semana.hasta);
                              const rangoNormalizado = normalizarRangoFechas(semana.desde, semana.hasta);
                              if (rangoNormalizado) setReporteRango(rangoNormalizado);
                            }}
                          >
                            Última semana
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => {
                              const hoy = new Date();
                              const hace7dias = new Date(hoy);
                              hace7dias.setDate(hace7dias.getDate() - 7);
                              setReporteDesde(hace7dias.toISOString().slice(0, 10));
                              setReporteHasta(hoy.toISOString().slice(0, 10));
                              const rangoNormalizado = normalizarRangoFechas(
                                hace7dias.toISOString().slice(0, 10),
                                hoy.toISOString().slice(0, 10)
                              );
                              if (rangoNormalizado) setReporteRango(rangoNormalizado);
                            }}
                          >
                            Últimos 7 días
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => {
                              const hoy = new Date();
                              const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                              setReporteDesde(primerDiaMes.toISOString().slice(0, 10));
                              setReporteHasta(hoy.toISOString().slice(0, 10));
                              const rangoNormalizado = normalizarRangoFechas(
                                primerDiaMes.toISOString().slice(0, 10),
                                hoy.toISOString().slice(0, 10)
                              );
                              if (rangoNormalizado) setReporteRango(rangoNormalizado);
                            }}
                          >
                            Este mes
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" onClick={handleGenerarReporte} className="flex-1 gap-2 h-8" size="sm">
                            <CalendarCheck className="h-4 w-4" />
                            Generar reporte
                          </Button>
                          {reporteRango && (
                            <Button type="button" onClick={handleLimpiarReporte} variant="outline" className="gap-2 h-8" size="sm">
                              <X className="h-4 w-4" />
                              Limpiar
                            </Button>
                          )}
                        </div>
                      </div>

                      {resumenActualizaciones ? (
                        <div className="space-y-5">
                          <div className="flex flex-wrap gap-3">
                            <Badge variant="secondary">
                              Actualizados: {resumenActualizaciones.actualizados.length}
                            </Badge>
                            <Badge variant={resumenActualizaciones.pendientes.length > 0 ? 'destructive' : 'outline'}>
                              Pendientes: {resumenActualizaciones.pendientes.length}
                            </Badge>
                            <Badge variant="outline">
                              Período: {new Date(resumenActualizaciones.desde).toLocaleDateString()} - {new Date(resumenActualizaciones.hasta).toLocaleDateString()}
                            </Badge>
                          </div>

                          <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold">Equipos con lectura registrada</h4>
                              {resumenActualizaciones.actualizados.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay registros en el rango seleccionado.</p>
                              ) : (
                                <div className="rounded-md border overflow-auto max-h-64">
                                  <Table className="text-sm">
                                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                                      <TableRow>
                                        <TableHead className="text-xs h-8">Equipo</TableHead>
                                        <TableHead className="text-xs h-8">Ficha</TableHead>
                                        <TableHead className="text-xs h-8">Última lectura</TableHead>
                                        <TableHead className="text-xs h-8">Responsable</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {resumenActualizaciones.actualizados.map(({ mantenimiento, evento }) => (
                                        <TableRow key={mantenimiento.id} className="h-10">
                                          <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                          <TableCell className="font-mono text-xs">{mantenimiento.ficha}</TableCell>
                                          <TableCell className="text-xs">
                                            {evento
                                              ? `${evento.horasKm} h/km • ${new Date(evento.fecha).toLocaleDateString()}`
                                              : 'Sin detalle'}
                                          </TableCell>
                                          <TableCell className="text-xs">{evento?.usuarioResponsable ?? 'No registrado'}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold">Equipos pendientes</h4>
                              {resumenActualizaciones.pendientes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Todos los equipos tienen lectura en el rango.</p>
                              ) : (
                                <div className="rounded-md border overflow-auto max-h-64">
                                  <Table className="text-sm">
                                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                                      <TableRow>
                                        <TableHead className="text-xs h-8">Equipo</TableHead>
                                        <TableHead className="text-xs h-8">Ficha</TableHead>
                                        <TableHead className="text-xs h-8">Última act.</TableHead>
                                        <TableHead className="text-xs h-8">Horas/km</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {resumenActualizaciones.pendientes.map((mantenimiento) => (
                                        <TableRow key={mantenimiento.id} className="h-10">
                                          <TableCell className="font-medium">{mantenimiento.nombreEquipo}</TableCell>
                                          <TableCell className="font-mono text-xs">{mantenimiento.ficha}</TableCell>
                                          <TableCell className="text-xs">{formatDate(mantenimiento.fechaUltimaActualizacion)}</TableCell>
                                          <TableCell className="text-xs">{mantenimiento.horasKmActuales}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Completa el rango y genera el reporte para revisar el estado de las lecturas.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Draggable>
            )}

            <Button
              className="pointer-events-auto h-14 w-14 rounded-full shadow-lg transition hover:scale-105"
              onClick={() => setPanelOpen((prev) => !prev)}
              size="icon"
            >
              <CalendarRange className="h-5 w-5" />
              <span className="sr-only">Alternar resumen de actualizaciones</span>
            </Button>
          </div>
        </TabsContent>

        {/* Tab de Planificador */}
        <TabsContent value="planificador" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-900">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Route className="h-5 w-5" />
                Planificador Preventivo Caterpillar
              </CardTitle>
              <CardDescription className="text-sm">
                Selecciona tu equipo Caterpillar e intervalo para ver tareas, kits y rutas sugeridas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {caterpillarEquipos.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sin equipos Caterpillar</AlertTitle>
                  <AlertDescription>
                    Registra equipos Caterpillar para habilitar la planificación inteligente de rutas preventivas.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Selectores */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="planFicha">Equipo Caterpillar</Label>
                      <EquipoSelectorDialog
                        equipos={caterpillarEquipos}
                        equipoSeleccionado={planFicha ?? undefined}
                        onSelect={(ficha) => setPlanFicha(ficha)}
                        titulo="Seleccionar Equipo Caterpillar"
                        descripcion="Selecciona un equipo Caterpillar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planIntervalo">Intervalo oficial</Label>
                      <Select
                        value={planIntervalo}
                        onValueChange={(value) => setPlanIntervalo(value)}
                        disabled={intervalosDisponibles.length === 0}
                      >
                        <SelectTrigger id="planIntervalo">
                          <SelectValue placeholder="Selecciona MP" />
                        </SelectTrigger>
                        <SelectContent>
                          {intervalosDisponibles.map((intervalo) => (
                            <SelectItem key={intervalo.codigo} value={intervalo.codigo}>
                              {intervalo.codigo} · {intervalo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loadingPlanCat && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Consultando catálogo Caterpillar...
                    </div>
                  )}

                  {/* KPIs Compactos */}
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-muted-foreground mb-1">Lectura actual</p>
                      <p className="text-lg font-semibold">
                        {planProximo ? `${planProximo.horasKmActuales}` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-muted-foreground mb-1">Próximo objetivo</p>
                      <p className="text-lg font-semibold">
                        {planProximo ? `${planProximo.proximoMantenimiento}` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-900">
                      <p className="text-xs text-muted-foreground mb-1">Restante</p>
                      <Badge variant={planProximo ? getRemainingVariant(planProximo.horasKmRestante) : 'outline'} className="text-sm">
                        {planProximo ? `${planProximo.horasKmRestante}` : 'N/A'}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-900">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <GraduationCap className="h-3 w-3" /> Capacitación
                      </p>
                      <p className="text-xs font-medium leading-snug">{planCapacitacion}</p>
                    </div>
                  </div>

                  {/* Descripción del Intervalo */}
                  <div className="rounded-lg border border-dashed p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-sm font-semibold mb-1">
                      Descripción {planIntervalo || 'del intervalo'}
                    </p>
                    <p className="text-sm text-muted-foreground">{planIntervaloDescripcion}</p>
                  </div>

                  {/* Tareas y Kit */}
                  <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
                    <div className="rounded-lg border p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <ClipboardList className="h-4 w-4 text-primary" /> Tareas clave
                      </p>
                      {planTareas.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {planTareas.map((tarea, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="leading-snug">{tarea}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Selecciona un intervalo para ver el checklist.</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold mb-3">
                          <MapPinned className="h-4 w-4 text-primary" /> Kit recomendado
                        </p>
                        {planKit.length > 0 ? (
                          <ul className="space-y-1 text-xs">
                            {planKit.map((pieza, idx) => (
                              <li key={idx} className="leading-snug text-muted-foreground">{pieza}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No hay repuestos para este intervalo.</p>
                        )}
                      </div>

                      {planEspeciales.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                          <p className="font-semibold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            Mantenimiento especial
                          </p>
                          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                            {planEspeciales.map((especial) => (
                              <li key={especial.id} className="leading-snug">{especial.descripcion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ruta Sugerida */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPinned className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Ruta sugerida {planIntervalo ? `• ${planIntervalo}` : ''}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                          {planRutaFiltrada.length} equipos
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                          {rutaSeleccionadaCount} marcados
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRutaFiltrada(true)}
                          disabled={planRutaFiltrada.length === 0}
                        >
                          Seleccionar todos
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={limpiarRutaFiltrada}
                          disabled={rutaSeleccionadaCount === 0}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>

                    {planRutaFiltrada.length === 0 ? (
                      <Alert>
                        <AlertTitle>Sin equipos en ruta</AlertTitle>
                        <AlertDescription>
                          No hay equipos Caterpillar con programación activa para este intervalo.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="rounded-md border overflow-auto max-h-96">
                        <Table>
                          <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-10 h-8">
                                <Checkbox
                                  checked={rutaHeaderState}
                                  onCheckedChange={(checked) => toggleRutaFiltrada(Boolean(checked))}
                                  aria-label="Seleccionar ruta"
                                />
                              </TableHead>
                              <TableHead className="h-8 text-xs">Equipo</TableHead>
                              <TableHead className="h-8 text-xs">Intervalo</TableHead>
                              <TableHead className="h-8 text-xs text-right">Restante</TableHead>
                              <TableHead className="h-8 text-xs">Próximo</TableHead>
                              <TableHead className="h-8 text-xs">Capacitación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planRutaFiltrada.map((item, index) => {
                              const isMarked = rutaMarcada.includes(item.ficha);
                              return (
                                <TableRow
                                  key={`${item.ficha}-${index}`}
                                  className={cn(
                                    "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors h-14",
                                    isMarked && "bg-primary/5"
                                  )}
                                >
                                  <TableCell className="py-2">
                                    <Checkbox
                                      checked={isMarked}
                                      onCheckedChange={() => toggleRutaFicha(item.ficha)}
                                      aria-label={`Marcar ${item.ficha}`}
                                    />
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="font-medium text-sm">{item.nombre}</div>
                                    <p className="text-xs text-muted-foreground">
                                      {item.ficha} • {item.categoria}
                                    </p>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <Badge variant="secondary" className="text-xs">{item.intervalo}</Badge>
                                    <p className="mt-1 text-xs text-muted-foreground leading-snug">
                                      {item.intervaloDescripcion.slice(0, 30)}...
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right py-2">
                                    <Badge
                                      variant={getRemainingVariant(item.restante)}
                                      className="text-xs font-semibold"
                                    >
                                      {item.restante}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-sm py-2">
                                    {item.proximo}
                                  </TableCell>
                                  <TableCell className="text-xs leading-snug py-2">
                                    {item.capacitacion.slice(0, 25)}...
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
