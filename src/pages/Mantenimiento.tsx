/* eslint-disable @typescript-eslint/no-explicit-any */
import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseDataContext } from '@/context/SupabaseDataContext';
import { EquipoLink } from '@/components/EquipoLink';
import type { MantenimientoProgramado } from '@/types/equipment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  Plus,
  Pencil,
  Loader2,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { jsPDF } from 'jspdf';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { formatRemainingLabel, getRemainingVariant } from '@/lib/maintenanceUtils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MantenimientoMobile } from '@/pages/mobile/MantenimientoMobile';

const numericField = z
  .string()
  .min(1, 'Este campo es obligatorio')
  .refine((value) => !Number.isNaN(Number(value)), {
    message: 'Ingresa un número válido',
  })
  .refine((value) => Number(value) >= 0, {
    message: 'El valor no puede ser negativo',
  });

const mantenimientoSchema = z.object({
  ficha: z.string().min(1, 'La ficha es obligatoria'),
  nombreEquipo: z.string().min(1, 'El nombre del equipo es obligatorio'),
  tipoMantenimiento: z.string().min(1, 'El tipo de mantenimiento es obligatorio'),
  horasKmActuales: numericField,
  fechaUltimaActualizacion: z.string().min(1, 'La fecha de actualización es obligatoria'),
  frecuencia: numericField,
  horasKmUltimoMantenimiento: numericField,
  fechaUltimoMantenimiento: z.string().nullable().optional(),
  activo: z.boolean(),
});

type MantenimientoFormValues = z.infer<typeof mantenimientoSchema>;

const getDefaultFormValues = (): MantenimientoFormValues => ({
  ficha: '',
  nombreEquipo: '',
  tipoMantenimiento: '',
  horasKmActuales: '',
  fechaUltimaActualizacion: new Date().toISOString().split('T')[0],
  frecuencia: '',
  horasKmUltimoMantenimiento: '',
  fechaUltimoMantenimiento: null,
  activo: true,
});

const formatDateForInput = (date: string | null | undefined) => {
  if (!date) {
    return '';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
};

export default function Mantenimiento() {
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const { data, loading, clearDatabase, createMantenimiento, updateMantenimiento, deleteMantenimiento } = useSupabaseDataContext();
  const [modoAvanzado, setModoAvanzado] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    tipos: [] as string[],
    categorias: [] as string[],
    estados: [] as string[],
    fichas: [] as string[],
    restanteMin: '',
    restanteMax: ''
  });
  const [clearing, setClearing] = useState(false);
  const [tableScale, setTableScale] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState<MantenimientoProgramado | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MantenimientoProgramado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'all' | 'categories'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const { toast } = useToast();

  const form = useForm<MantenimientoFormValues>({
    resolver: zodResolver(mantenimientoSchema),
    defaultValues: getDefaultFormValues(),
  });

  const clampScale = (value: number) => Math.min(1.4, Math.max(0.8, Number(value.toFixed(2))));

  const handleScaleChange = (value: number[]) => {
    if (!value.length) return;
    setTableScale(clampScale(value[0]));
  };

  const adjustScale = (delta: number) => {
    setTableScale(prev => clampScale(prev + delta));
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMantenimiento(null);
    form.reset(getDefaultFormValues());
  };

  const handleOpenCreateForm = () => {
    setEditingMantenimiento(null);
    form.reset(getDefaultFormValues());
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (mantenimiento: MantenimientoProgramado) => {
    const lastUpdate = formatDateForInput(mantenimiento.fechaUltimaActualizacion) || new Date().toISOString().split('T')[0];
    const lastMaintenance = formatDateForInput(mantenimiento.fechaUltimoMantenimiento);

    form.reset({
      ficha: mantenimiento.ficha,
      nombreEquipo: mantenimiento.nombreEquipo,
      tipoMantenimiento: mantenimiento.tipoMantenimiento,
      horasKmActuales: String(mantenimiento.horasKmActuales),
      fechaUltimaActualizacion: lastUpdate,
      frecuencia: String(mantenimiento.frecuencia),
      horasKmUltimoMantenimiento: String(mantenimiento.horasKmUltimoMantenimiento),
      fechaUltimoMantenimiento: lastMaintenance ? lastMaintenance : null,
      activo: mantenimiento.activo,
    });

    setEditingMantenimiento(mantenimiento);
    setIsFormOpen(true);
  };

  const onSubmit = async (values: MantenimientoFormValues) => {
    const payload = {
      ficha: values.ficha.trim(),
      nombreEquipo: values.nombreEquipo.trim(),
      tipoMantenimiento: values.tipoMantenimiento.trim(),
      horasKmActuales: Number(values.horasKmActuales),
      fechaUltimaActualizacion: values.fechaUltimaActualizacion,
      frecuencia: Number(values.frecuencia),
      fechaUltimoMantenimiento: values.fechaUltimoMantenimiento ?? null,
      horasKmUltimoMantenimiento: Number(values.horasKmUltimoMantenimiento),
      activo: values.activo,
    };

    setIsSubmitting(true);
    try {
      if (editingMantenimiento) {
        await updateMantenimiento(editingMantenimiento.id, payload);
      } else {
        await createMantenimiento(payload);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving mantenimiento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMantenimiento = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteMantenimiento(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting mantenimiento:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Mantenimiento Programado">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const tipos = [...new Set(data.mantenimientosProgramados.map(m => m.tipoMantenimiento))];

  // Crear mapa de equipos por ficha para obtener categorías
  const equiposPorFicha = data.equipos.reduce((acc, equipo) => {
    acc[equipo.ficha] = equipo;
    return acc;
  }, {} as Record<string, any>);

  const categorias = [...new Set(data.equipos.map(e => e.categoria))];

  // Recalcular próximo y restante según nueva lógica
  const mantenimientosConCalculos = data.mantenimientosProgramados.map(mant => {
    // Próximo = frecuencia + hr/km último mantenimiento
    const proximoCalculado = mant.horasKmUltimoMantenimiento + mant.frecuencia;
    // Restante = próximo - actual
    const restanteCalculado = proximoCalculado - mant.horasKmActuales;

    return {
      ...mant,
      proximoMantenimiento: proximoCalculado,
      horasKmRestante: restanteCalculado
    };
  });

  if (isMobile) {
    return (
      <>
        <MantenimientoMobile
          mantenimientos={mantenimientosConCalculos}
          onRegistrar={handleOpenEditForm}
          onVerDetalle={(ficha) => navigate(`/equipos?search=${ficha}`)}
          onEdit={handleOpenEditForm}
          onDelete={(mantenimiento) => {
            setDeleteTarget(mantenimiento);
            // El diálogo de confirmación se maneja globalmente en el componente
            // pero necesitamos abrirlo. Como el diálogo usa deleteTarget, 
            // solo necesitamos setearlo y quizás tener un useEffect o abrirlo directamente si es controlado.
            // Revisando el código, el AlertDialog usa deleteTarget para renderizar, 
            // pero necesitamos un estado para abrirlo si es controlado, o simplemente funciona si deleteTarget no es null.
            // En este archivo, el AlertDialog de eliminación parece no estar implementado completamente en la vista desktop
            // o usa un patrón diferente. Vamos a verificar la implementación del diálogo de eliminación.
            // Ah, veo handleDeleteMantenimiento pero no veo el JSX del diálogo en la parte desktop que leí antes.
            // Asumiremos que necesitamos implementar el diálogo de confirmación para móvil también o usar el existente.
            // Para asegurar que funcione, usaremos el estado deleteTarget y renderizaremos el diálogo.
          }}
          onCreate={handleOpenCreateForm}
          onRefresh={async () => {
            // Simular refresh o recargar datos si es posible
            // Como usamos SupabaseDataContext, los datos se actualizan solos o podríamos forzar un fetch si el contexto lo permite.
            // Por ahora, una pequeña espera para simular UX
            await new Promise(resolve => setTimeout(resolve, 1000));
          }}
          categorias={categorias}
          tipos={tipos}
        />

        {/* Diálogo de confirmación de eliminación para móvil */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el mantenimiento programado para {deleteTarget?.ficha}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMantenimiento}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Formulario móvil reutilizado */}
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</SheetTitle>
              <SheetDescription>
                {editingMantenimiento ? 'Actualiza los datos del mantenimiento.' : 'Programa un nuevo mantenimiento.'}
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ficha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ficha del Equipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. EQ-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombreEquipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Equipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Excavadora CAT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipoMantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Input placeholder="Horas/Km" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="horasKmActuales"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="horasKmUltimoMantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Último Mant.</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fechaUltimoMantenimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Último Mantenimiento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  const fichas = [...new Set(data.mantenimientosProgramados.map(m => m.ficha))].sort();

  const mantenimientosFiltrados = mantenimientosConCalculos.filter(mant => {
    const equipo = equiposPorFicha[mant.ficha];

    const matchesSearch = Object.values(mant)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filtros multi-select
    const matchesTipo = filtros.tipos.length === 0 || filtros.tipos.includes(mant.tipoMantenimiento);

    const matchesCategoria = filtros.categorias.length === 0 || (equipo && filtros.categorias.includes(equipo.categoria));

    const matchesFicha = filtros.fichas.length === 0 || filtros.fichas.includes(mant.ficha);

    const matchesEstado = filtros.estados.length === 0 ||
      (filtros.estados.includes('vencido') && mant.horasKmRestante <= 0) ||
      (filtros.estados.includes('proximo') && mant.horasKmRestante > 0 && mant.horasKmRestante <= 100) ||
      (filtros.estados.includes('normal') && mant.horasKmRestante > 100);

    // Filtro de rango de restante
    const restante = Math.abs(mant.horasKmRestante);
    const matchesRestanteMin = !filtros.restanteMin || restante >= parseFloat(filtros.restanteMin);
    const matchesRestanteMax = !filtros.restanteMax || restante <= parseFloat(filtros.restanteMax);

    return matchesSearch && matchesTipo && matchesCategoria && matchesFicha && matchesEstado && matchesRestanteMin && matchesRestanteMax && mant.activo;
  })
    .sort((a, b) => {
      // Ordenar por ficha de menor a mayor
      return a.ficha.localeCompare(b.ficha, 'es', { numeric: true, sensitivity: 'base' });
    });

  const totalMantenimientos = mantenimientosFiltrados.length;
  const vencidos = mantenimientosFiltrados.filter(m => m.horasKmRestante <= 0).length;
  const proximos = mantenimientosFiltrados.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length;
  const normales = mantenimientosFiltrados.filter(m => m.horasKmRestante > 100).length;

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const obtenerEstadoMantenimiento = (horasRestante: number) => {
    if (horasRestante <= 0) return { label: 'Vencido', variant: 'destructive' as const };
    if (horasRestante <= 100) return { label: 'Próximo', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  const exportarPDF = async (mode: 'all' | 'categories' = 'all', categoriasSeleccionadas: string[] = []) => {
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });


      if (mantenimientosFiltrados.length === 0) {
        throw new Error('No hay mantenimientos disponibles para generar el PDF');
      }

      if (mode === 'all') {
        // Modo: Todo junto - todos los mantenimientos filtrados
        generarPDFCompleto(doc, autoTable, mantenimientosFiltrados);
      } else if (mode === 'categories' && categoriasSeleccionadas.length > 0) {
        // Modo: Por categorías - filtrar por categorías seleccionadas
        const mantenimientosPorCategoria = mantenimientosFiltrados.filter(mant => {
          const equipo = equiposPorFicha[mant.ficha];
          return equipo && categoriasSeleccionadas.includes(equipo.categoria);
        });

        if (mantenimientosPorCategoria.length === 0) {
          throw new Error('No hay mantenimientos para las categorías seleccionadas');
        }

        generarPDFPorCategorias(doc, autoTable, mantenimientosPorCategoria, categoriasSeleccionadas);
      } else {
        // Fallback: si no hay categorías seleccionadas, imprimir todo
        generarPDFCompleto(doc, autoTable, mantenimientosFiltrados);
      }

      // Guardar el PDF con nombre descriptivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = mode === 'all'
        ? `mantenimientos_completo_${fecha}.pdf`
        : `mantenimientos_categorias_${fecha}.pdf`;

      doc.save(nombreArchivo);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      throw error;
    }
  };

  const generarPDFCompleto = (doc: jsPDF, autoTable: any, mantenimientos: any[]) => {

    // Configurar fuente
    doc.setFont('helvetica');

    // Encabezado corporativo con borde verde
    doc.setFillColor(36, 99, 56); // Verde corporativo oscuro
    doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');

    // Logo/Nombre de empresa
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ALITO MANTENIMIENTO', 20, 10);

    // Título del documento
    doc.setFontSize(20);
    doc.setTextColor(36, 99, 56); // Verde corporativo
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Mantenimientos Programados', 20, 28);

    // Línea decorativa
    doc.setDrawColor(36, 99, 56);
    doc.setLineWidth(0.5);
    doc.line(20, 32, doc.internal.pageSize.width - 20, 32);

    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const horaFormateada = fechaActual.toLocaleTimeString('es-ES');
    doc.text(`Fecha: ${fechaFormateada} | Hora: ${horaFormateada}`, 20, 40);

    // Resumen estadístico con cajas de colores
    const totalMant = mantenimientos.length;
    const venc = mantenimientos.filter(m => m.horasKmRestante <= 0).length;
    const prox = mantenimientos.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length;
    const norm = mantenimientos.filter(m => m.horasKmRestante > 100).length;

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 20, 52);

    // Cajas de resumen con colores
    const boxY = 58;
    const boxWidth = 60;
    const boxHeight = 18;
    const boxSpacing = 65;

    // Caja Total - Azul
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(20, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Programados', 25, boxY + 6);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(totalMant.toString(), 25, boxY + 14);

    // Caja Vencidos - Rojo
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(20 + boxSpacing, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Vencidos', 25 + boxSpacing, boxY + 6);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(venc.toString(), 25 + boxSpacing, boxY + 14);

    // Caja Próximos - Amarillo
    doc.setFillColor(251, 191, 36);
    doc.roundedRect(20 + boxSpacing * 2, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Próximos (≤100)', 25 + boxSpacing * 2, boxY + 6);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(prox.toString(), 25 + boxSpacing * 2, boxY + 14);

    // Caja Normales - Verde
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(20 + boxSpacing * 3, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Normales', 25 + boxSpacing * 3, boxY + 6);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(norm.toString(), 25 + boxSpacing * 3, boxY + 14);

    // Preparar datos para la tabla
    const tableData = mantenimientos.map(mant => {
      const estado = obtenerEstadoMantenimiento(mant.horasKmRestante);
      const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
      const equipo = equiposPorFicha[mant.ficha];

      return [
        mant.ficha,
        mant.nombreEquipo,
        equipo?.categoria || 'N/A',
        mant.tipoMantenimiento,
        `${mant.horasKmActuales.toLocaleString()} ${unidad}`,
        `${mant.frecuencia.toLocaleString()} ${unidad}`,
        `${mant.horasKmUltimoMantenimiento.toLocaleString()} ${unidad}`,
        `${mant.proximoMantenimiento.toLocaleString()} ${unidad}`,
        formatRemainingLabel(mant.horasKmRestante, unidad),
        formatearFecha(mant.fechaUltimoMantenimiento),
        estado.label
      ];
    });

    // Configurar tabla con estilos profesionales
    autoTable(doc, {
      startY: 82,
      head: [['Ficha', 'Equipo', 'Categoría', 'Tipo', 'Actual', 'Frecuencia', 'Últ. Mant.', 'Próximo', 'Restante', 'Fecha Últ.', 'Estado']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [36, 99, 56], // Verde corporativo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
        7: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [147, 51, 234] },
        8: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        9: { cellWidth: 20, halign: 'center' },
        10: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const estado = data.row.raw[10];

          // Estilo para la columna de Estado
          if (data.column.index === 10) {
            if (estado === 'Vencido') {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [185, 28, 28];
            } else if (estado === 'Próximo') {
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [146, 64, 14];
            } else {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [21, 128, 61];
            }
          }

          // Estilo para columna Restante
          if (data.column.index === 8) {
            if (estado === 'Vencido') {
              data.cell.styles.textColor = [220, 38, 38];
            } else if (estado === 'Próximo') {
              data.cell.styles.textColor = [217, 119, 6];
            } else {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        }
      },
      margin: { top: 20, right: 15, bottom: 25, left: 15 },
      pageBreak: 'auto',
      showHead: 'everyPage',
    });

    // Pie de página profesional
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Línea superior del footer
      const footerY = doc.internal.pageSize.height - 15;
      doc.setDrawColor(36, 99, 56);
      doc.setLineWidth(0.3);
      doc.line(15, footerY, doc.internal.pageSize.width - 15, footerY);

      // Información del footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('ALITO Mantenimiento - Sistema de Gestión', 15, footerY + 5);

      // Número de página
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 15,
        footerY + 5,
        { align: 'right' }
      );

      // Nota de confidencialidad
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(
        'Documento confidencial - Uso interno exclusivo',
        doc.internal.pageSize.width / 2,
        footerY + 9,
        { align: 'center' }
      );
    }
  };

  const generarPDFPorCategorias = (
    doc: jsPDF,
    autoTable: any,
    mantenimientos: any[],
    categoriasSeleccionadas: string[],
  ) => {
    let isFirstCategory = true;

    categoriasSeleccionadas.forEach(categoria => {
      const mantenimientosCategoria = mantenimientos.filter(mant => {
        const equipo = equiposPorFicha[mant.ficha];
        return equipo && equipo.categoria === categoria;
      });

      if (mantenimientosCategoria.length === 0) return;

      if (!isFirstCategory) {
        doc.addPage();
      }
      isFirstCategory = false;

      // Configurar fuente
      doc.setFont('helvetica');

      // Encabezado corporativo
      doc.setFillColor(36, 99, 56);
      doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ALITO MANTENIMIENTO', 20, 10);

      // Título de la categoría
      doc.setFontSize(20);
      doc.setTextColor(36, 99, 56);
      doc.text(`Mantenimientos - ${categoria}`, 20, 28);

      // Línea decorativa
      doc.setDrawColor(36, 99, 56);
      doc.setLineWidth(0.5);
      doc.line(20, 32, doc.internal.pageSize.width - 20, 32);

      // Fecha de generación
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      const fechaActual = new Date();
      const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const horaFormateada = fechaActual.toLocaleTimeString('es-ES');
      doc.text(`Fecha: ${fechaFormateada} | Hora: ${horaFormateada}`, 20, 40);

      // Resumen de la categoría con cajas
      const totalCat = mantenimientosCategoria.length;
      const vencCat = mantenimientosCategoria.filter(m => m.horasKmRestante <= 0).length;
      const proxCat = mantenimientosCategoria.filter(m => m.horasKmRestante > 0 && m.horasKmRestante <= 100).length;
      const normCat = mantenimientosCategoria.filter(m => m.horasKmRestante > 100).length;

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen de Categoría', 20, 52);

      const boxY = 58;
      const boxWidth = 60;
      const boxHeight = 18;
      const boxSpacing = 65;

      // Cajas de resumen
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(20, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Total', 25, boxY + 6);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(totalCat.toString(), 25, boxY + 14);

      doc.setFillColor(239, 68, 68);
      doc.roundedRect(20 + boxSpacing, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Vencidos', 25 + boxSpacing, boxY + 6);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(vencCat.toString(), 25 + boxSpacing, boxY + 14);

      doc.setFillColor(251, 191, 36);
      doc.roundedRect(20 + boxSpacing * 2, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Próximos', 25 + boxSpacing * 2, boxY + 6);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(proxCat.toString(), 25 + boxSpacing * 2, boxY + 14);

      doc.setFillColor(34, 197, 94);
      doc.roundedRect(20 + boxSpacing * 3, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Normales', 25 + boxSpacing * 3, boxY + 6);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(normCat.toString(), 25 + boxSpacing * 3, boxY + 14);

      // Preparar datos para la tabla
      const tableData = mantenimientosCategoria.map(mant => {
        const estado = obtenerEstadoMantenimiento(mant.horasKmRestante);
        const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';

        return [
          mant.ficha,
          mant.nombreEquipo,
          mant.tipoMantenimiento,
          `${mant.horasKmActuales.toLocaleString()} ${unidad}`,
          `${mant.frecuencia.toLocaleString()} ${unidad}`,
          `${mant.horasKmUltimoMantenimiento.toLocaleString()} ${unidad}`,
          `${mant.proximoMantenimiento.toLocaleString()} ${unidad}`,
          formatRemainingLabel(mant.horasKmRestante, unidad),
          formatearFecha(mant.fechaUltimoMantenimiento),
          estado.label
        ];
      });

      // Configurar tabla con estilos profesionales
      autoTable(doc, {
        startY: 82,
        head: [['Ficha', 'Equipo', 'Tipo', 'Actual', 'Frecuencia', 'Últ. Mant.', 'Próximo', 'Restante', 'Fecha Últ.', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [36, 99, 56],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
          6: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [147, 51, 234] },
          7: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
          8: { cellWidth: 22, halign: 'center' },
          9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const estado = data.row.raw[9];
            if (estado === 'Vencido') {
              data.cell.styles.fillColor = [254, 242, 242];
              data.cell.styles.textColor = [220, 38, 38];
            } else if (estado === 'Próximo') {
              data.cell.styles.fillColor = [255, 251, 235];
              data.cell.styles.textColor = [180, 83, 9];
            } else {
              data.cell.styles.fillColor = [240, 253, 244];
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
        margin: { top: 20, right: 15, bottom: 20, left: 15 },
        pageBreak: 'auto',
        showHead: 'everyPage',
      });
    });

    // Pie de página profesional
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Línea superior del footer
      const footerY = doc.internal.pageSize.height - 15;
      doc.setDrawColor(36, 99, 56);
      doc.setLineWidth(0.3);
      doc.line(15, footerY, doc.internal.pageSize.width - 15, footerY);

      // Información del footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('ALITO Mantenimiento - Sistema de Gestión', 15, footerY + 5);

      // Número de página
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 15,
        footerY + 5,
        { align: 'right' }
      );

      // Nota de confidencialidad
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(
        'Documento confidencial - Uso interno exclusivo',
        doc.internal.pageSize.width / 2,
        footerY + 9,
        { align: 'center' }
      );
    }
  };

  const handlePrintClick = () => {
    setSelectedCategories([]);
    setPrintMode('all');
    setIsPrintDialogOpen(true);
  };

  const handlePrint = async () => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);

    try {
      await exportarPDF(printMode, selectedCategories);
      setIsPrintDialogOpen(false);

      // Mostrar notificación de éxito
      toast({
        title: "PDF generado exitosamente",
        description: "El archivo ha sido descargado correctamente.",
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);

      const description = error instanceof Error
        ? error.message
        : 'Hubo un problema al crear el documento. Por favor, inténtalo de nuevo.';

      // Mostrar notificación de error
      toast({
        title: "Error al generar PDF",
        description,

        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const togglePrintCategory = (categoria: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleTipo = (tipo: string) => {
    setFiltros(prev => ({
      ...prev,
      tipos: prev.tipos.includes(tipo)
        ? prev.tipos.filter(t => t !== tipo)
        : [...prev.tipos, tipo]
    }));
  };

  const toggleCategoria = (categoria: string) => {
    setFiltros(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoria)
        ? prev.categorias.filter(c => c !== categoria)
        : [...prev.categorias, categoria]
    }));
  };

  const toggleEstado = (estado: string) => {
    setFiltros(prev => ({
      ...prev,
      estados: prev.estados.includes(estado)
        ? prev.estados.filter(e => e !== estado)
        : [...prev.estados, estado]
    }));
  };

  const toggleFicha = (ficha: string) => {
    setFiltros(prev => ({
      ...prev,
      fichas: prev.fichas.includes(ficha)
        ? prev.fichas.filter(f => f !== ficha)
        : [...prev.fichas, ficha]
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipos: [],
      categorias: [],
      estados: [],
      fichas: [],
      restanteMin: '',
      restanteMax: ''
    });
    setSearchTerm('');
  };

  const handleClearDatabase = async () => {
    setConfirmClearOpen(true);
  };

  const confirmClearDatabase = async () => {
    try {
      setClearing(true);
      await clearDatabase();
    } finally {
      setClearing(false);
      setConfirmClearOpen(false);
    }
  };

  const filtrosAplicados =
    filtros.tipos.length > 0 ||
    filtros.categorias.length > 0 ||
    filtros.estados.length > 0 ||
    filtros.fichas.length > 0 ||
    Boolean(filtros.restanteMin) ||
    Boolean(filtros.restanteMax) ||
    Boolean(searchTerm);

  const renderSimpleFilters = () => (
    <div className="space-y-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar mantenimientos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            Tipos
          </Label>
          <div className="space-y-2">
            {tipos.map(tipo => (
              <div
                key={tipo}
                className="flex items-center space-x-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white dark:hover:bg-slate-800/50"
              >
                <Checkbox
                  id={`tipo-${tipo}`}
                  checked={filtros.tipos.includes(tipo)}
                  onCheckedChange={() => toggleTipo(tipo)}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <label htmlFor={`tipo-${tipo}`} className="cursor-pointer text-sm flex-1">
                  {tipo}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
            Categorías
          </Label>
          <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2">
            {categorias.map(cat => (
              <div
                key={cat}
                className="flex items-center space-x-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Checkbox
                  id={`cat-simple-${cat}`}
                  checked={filtros.categorias.includes(cat)}
                  onCheckedChange={() => toggleCategoria(cat)}
                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <label htmlFor={`cat-simple-${cat}`} className="cursor-pointer text-sm flex-1">
                  {cat}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            Estados
          </Label>
          <div className="space-y-2">
            {['vencido', 'proximo', 'normal'].map(estado => {
              const estadoConfig = {
                vencido: {
                  color: 'red',
                  label: 'Vencidos',
                  Icon: AlertCircle,
                  iconColor: 'text-red-600 dark:text-red-500'
                },
                proximo: {
                  color: 'amber',
                  label: 'Próximos',
                  Icon: Clock,
                  iconColor: 'text-amber-600 dark:text-amber-500'
                },
                normal: {
                  color: 'emerald',
                  label: 'Normales',
                  Icon: CheckCircle2,
                  iconColor: 'text-emerald-600 dark:text-emerald-500'
                }
              }[estado];

              const Icon = estadoConfig?.Icon || CheckCircle2;

              return (
                <div
                  key={estado}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-2 py-1.5 transition-all duration-200",
                    filtros.estados.includes(estado)
                      ? "bg-primary/10 dark:bg-primary/20 border-2 border-primary/50 shadow-sm"
                      : "hover:bg-white dark:hover:bg-slate-800/50 border-2 border-transparent"
                  )}
                >
                  <Checkbox
                    id={`estado-simple-${estado}`}
                    checked={filtros.estados.includes(estado)}
                    onCheckedChange={() => toggleEstado(estado)}
                    className={`data-[state=checked]:bg-${estadoConfig?.color}-500 data-[state=checked]:border-${estadoConfig?.color}-500`}
                  />
                  <label htmlFor={`estado-simple-${estado}`} className="cursor-pointer text-sm flex-1 flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${estadoConfig?.iconColor}`} />
                    {estadoConfig?.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-end">
          {filtrosAplicados && (
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="w-full transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar mantenimientos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 block">Tipos (Multi-select)</Label>
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            {tipos.map(tipo => (
              <div
                key={tipo}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`tipo-adv-${tipo}`}
                  checked={filtros.tipos.includes(tipo)}
                  onCheckedChange={() => toggleTipo(tipo)}
                />
                <label htmlFor={`tipo-adv-${tipo}`} className="flex-1 cursor-pointer text-sm">
                  {tipo}
                </label>
              </div>
            ))}
          </div>
          {filtros.tipos.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              {filtros.tipos.length} seleccionado(s)
            </Badge>
          )}
        </div>

        <div>
          <Label className="mb-2 block">Categorías (Multi-select)</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {categorias.map(cat => (
              <div
                key={cat}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`cat-adv-${cat}`}
                  checked={filtros.categorias.includes(cat)}
                  onCheckedChange={() => toggleCategoria(cat)}
                />
                <label htmlFor={`cat-adv-${cat}`} className="flex-1 cursor-pointer text-sm">
                  {cat}
                </label>
              </div>
            ))}
          </div>
          {filtros.categorias.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              {filtros.categorias.length} seleccionada(s)
            </Badge>
          )}
        </div>

        <div>
          <Label className="mb-2 block">Fichas Específicas</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {fichas.slice(0, 20).map(ficha => (
              <div
                key={ficha}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`ficha-adv-${ficha}`}
                  checked={filtros.fichas.includes(ficha)}
                  onCheckedChange={() => toggleFicha(ficha)}
                />
                <label htmlFor={`ficha-adv-${ficha}`} className="flex-1 cursor-pointer text-sm font-mono">
                  {ficha}
                </label>
              </div>
            ))}
          </div>
          {filtros.fichas.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              {filtros.fichas.length} seleccionada(s)
            </Badge>
          )}
        </div>

        <div>
          <Label className="mb-2 block">Estados</Label>
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            {['vencido', 'proximo', 'normal'].map(estado => (
              <div
                key={estado}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`estado-adv-${estado}`}
                  checked={filtros.estados.includes(estado)}
                  onCheckedChange={() => toggleEstado(estado)}
                />
                <label htmlFor={`estado-adv-${estado}`} className="cursor-pointer text-sm capitalize">
                  {estado === 'proximo' ? 'Próximos' : estado === 'vencido' ? 'Vencidos' : 'Normales'}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
        <div>
          <Label className="mb-2 block">Hrs/Km Restante Mínimo</Label>
          <Input
            type="number"
            placeholder="Mínimo"
            value={filtros.restanteMin}
            onChange={(e) => setFiltros({ ...filtros, restanteMin: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-2 block">Hrs/Km Restante Máximo</Label>
          <Input
            type="number"
            placeholder="Máximo"
            value={filtros.restanteMax}
            onChange={(e) => setFiltros({ ...filtros, restanteMax: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          {filtrosAplicados && (
            <Button
              variant="outline"
              onClick={limpiarFiltros}
              className="w-full transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar Todos los Filtros
            </Button>
          )}
        </div>
      </div>

      {(filtros.tipos.length > 0 || filtros.categorias.length > 0 || filtros.estados.length > 0 || filtros.fichas.length > 0 || filtros.restanteMin || filtros.restanteMax) && (
        <div className="border-t pt-4">
          <Label className="mb-2 block text-sm font-semibold">Filtros Aplicados:</Label>
          <div className="flex flex-wrap gap-2">
            {filtros.tipos.map(tipo => (
              <Badge key={tipo} variant="secondary">
                Tipo: {tipo}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer transition-colors hover:text-destructive"
                  onClick={() => toggleTipo(tipo)}
                />
              </Badge>
            ))}
            {filtros.categorias.map(cat => (
              <Badge key={cat} variant="secondary">
                Cat: {cat}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer transition-colors hover:text-destructive"
                  onClick={() => toggleCategoria(cat)}
                />
              </Badge>
            ))}
            {filtros.fichas.map(ficha => (
              <Badge key={ficha} variant="secondary" className="font-mono">
                Ficha: {ficha}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer transition-colors hover:text-destructive"
                  onClick={() => toggleFicha(ficha)}
                />
              </Badge>
            ))}
            {filtros.estados.map(estado => (
              <Badge key={estado} variant="secondary" className="capitalize">
                {estado === 'proximo' ? 'Próximo' : estado === 'vencido' ? 'Vencido' : 'Normal'}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer transition-colors hover:text-destructive"
                  onClick={() => toggleEstado(estado)}
                />
              </Badge>
            ))}
            {filtros.restanteMin && (
              <Badge variant="secondary">Restante ≥ {filtros.restanteMin}</Badge>
            )}
            {filtros.restanteMax && (
              <Badge variant="secondary">Restante ≤ {filtros.restanteMax}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderFilterContent = () => (modoAvanzado ? renderAdvancedFilters() : renderSimpleFilters());

  return (
    <Layout title="Mantenimiento Programado">

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMantenimiento ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}</DialogTitle>
            <DialogDescription>
              Registra o actualiza la programación de mantenimiento preventivo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ficha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ficha del equipo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          list="fichas-disponibles"
                          placeholder="Ej. EQ-001"
                          onBlur={(event) => {
                            field.onBlur();
                            const equipo = data.equipos.filter(e => e.activo).find((eq) => eq.ficha === event.target.value);
                            if (equipo) {
                              form.setValue('nombreEquipo', equipo.nombre, { shouldValidate: true });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nombreEquipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del equipo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre descriptivo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoMantenimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de mantenimiento</FormLabel>
                      <FormControl>
                        <Input {...field} list="tipos-mantenimiento" placeholder="Horas, Kilómetros..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaUltimaActualizacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha última actualización</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="horasKmActuales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas/Km actuales</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frecuencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia programada</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="horasKmUltimoMantenimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lectura del último mantenimiento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaUltimoMantenimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha último mantenimiento</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <span className="text-sm text-muted-foreground">
                            {field.value ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-2 sm:space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseForm} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMantenimiento ? 'Actualizar mantenimiento' : 'Crear mantenimiento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          <datalist id="fichas-disponibles">
            {data.equipos.filter(e => e.activo).map((equipo) => (
              <option key={equipo.id} value={equipo.ficha}>
                {equipo.ficha} - {equipo.nombre}
              </option>
            ))}
          </datalist>
          <datalist id="tipos-mantenimiento">
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo} />
            ))}
          </datalist>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mantenimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el mantenimiento programado de la ficha {deleteTarget?.ficha}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMantenimiento}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar impresión</DialogTitle>
            <DialogDescription>
              Elige cómo deseas imprimir los mantenimientos programados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Modo de impresión</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setPrintMode('all')}>
                  <Checkbox
                    id="print-all"
                    checked={printMode === 'all'}
                    onCheckedChange={() => setPrintMode('all')}
                  />
                  <div className="flex-1">
                    <label htmlFor="print-all" className="cursor-pointer">
                      <div className="font-medium">Todo junto</div>
                      <div className="text-sm text-muted-foreground">
                        Imprime todos los mantenimientos en un solo documento
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setPrintMode('categories')}>
                  <Checkbox
                    id="print-categories"
                    checked={printMode === 'categories'}
                    onCheckedChange={() => setPrintMode('categories')}
                  />
                  <div className="flex-1">
                    <label htmlFor="print-categories" className="cursor-pointer">
                      <div className="font-medium">Por categorías</div>
                      <div className="text-sm text-muted-foreground">
                        Segmenta los mantenimientos por categoría de equipo
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {printMode === 'categories' && (
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Seleccionar categorías</Label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
                  {categorias.length > 0 ? (
                    categorias.map(categoria => (
                      <div
                        key={categoria}
                        className="flex items-center space-x-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/40 cursor-pointer"
                        onClick={() => togglePrintCategory(categoria)}
                      >
                        <Checkbox
                          id={`print-cat-${categoria}`}
                          checked={selectedCategories.includes(categoria)}
                          onCheckedChange={() => togglePrintCategory(categoria)}
                        />
                        <label htmlFor={`print-cat-${categoria}`} className="flex-1 cursor-pointer text-sm">
                          {categoria}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No hay categorías disponibles
                    </div>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedCategories.length} categoría(s) seleccionada(s)
                  </Badge>
                )}
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm space-y-1">
                  <div className="font-medium">Información de impresión</div>
                  <div className="text-muted-foreground">
                    {printMode === 'all'
                      ? `Se imprimirán ${mantenimientosFiltrados.length} mantenimientos en total.`
                      : selectedCategories.length > 0
                        ? `Se imprimirán los mantenimientos de ${selectedCategories.length} categoría(s).`
                        : 'Selecciona al menos una categoría para imprimir.'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPrintDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              disabled={
                isGeneratingPDF ||
                (printMode === 'categories' && selectedCategories.length === 0)
              }
            >
              {isGeneratingPDF ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isGeneratingPDF ? 'Generando…' : 'Generar y Descargar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 lg:space-y-8">
        {/* KPIs Mejorados */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden border-l-4 border-l-slate-500 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">Total Programados</CardDescription>
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-2">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight">{totalMantenimientos}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Equipos monitoreados</p>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-slate-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">Vencidos</CardDescription>
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-500">{vencidos}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">Próximos (≤100)</CardDescription>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{proximos}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Programar pronto</p>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">Normales</CardDescription>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{normales}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Estado óptimo</p>
            </CardHeader>
          </Card>
        </section>

        <Card className="flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="space-y-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  Mantenimientos Programados
                </CardTitle>
                <CardDescription className="mt-2">
                  Control y seguimiento de mantenimientos preventivos
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 lg:justify-end">
                <Button
                  type="button"
                  onClick={handleOpenCreateForm}
                  size="sm"
                  className="flex w-full items-center justify-center gap-2 sm:w-auto shadow-sm hover:shadow transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo mantenimiento
                </Button>
                <Button
                  onClick={handlePrintClick}
                  variant="outline"
                  size="sm"
                  className="flex w-full items-center justify-center gap-2 transition-all hover:bg-primary/5 hover:border-primary sm:w-auto"
                  title="Descargar PDF de mantenimientos"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </Button>
                <Button
                  variant={modoAvanzado ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoAvanzado(!modoAvanzado)}
                  className="w-full justify-center transition-all sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {modoAvanzado ? "Modo Simple" : "Modo Avanzado"}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Sheet>
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <span className="text-sm font-semibold text-primary">Filtros</span>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Ajustar filtros
                    </Button>
                  </SheetTrigger>
                </div>
                <div className="hidden sm:block">{renderFilterContent()}</div>
                <SheetContent side="bottom" className="sm:hidden overflow-y-auto">
                  <SheetHeader className="text-left">
                    <SheetTitle>Filtros y búsqueda</SheetTitle>
                    <SheetDescription>Refina la tabla para encontrar el mantenimiento que necesitas.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4 pb-6">{renderFilterContent()}</div>
                </SheetContent>
              </Sheet>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zoom</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => adjustScale(-0.1)}
                    aria-label="Reducir zoom de la tabla"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[tableScale]}
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    onValueChange={handleScaleChange}
                    className="w-32 sm:w-40"
                    aria-label="Control de zoom"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => adjustScale(0.1)}
                    aria-label="Aumentar zoom de la tabla"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-sm font-medium text-muted-foreground">
                    {Math.round(tableScale * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-0 pb-6 sm:px-6">
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <div className="min-w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card shadow-sm">
                <div
                  className={cn('overflow-x-auto', tableScale > 1 ? 'pb-4' : undefined)}
                  style={{ touchAction: 'pan-y pinch-zoom' }}
                >
                  <div
                    className="origin-top-left"
                    style={{
                      transform: `scale(${tableScale})`,
                      transformOrigin: 'top left',
                      width: `${100 / tableScale}%`,
                    }}
                  >
                    <Table className="w-full min-w-[1000px]">
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700">
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Ficha</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Equipo</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Categoría</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Actual</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Frecuencia</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Últ. Mant.</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Próximo</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Restante</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Fecha Últ.</TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Estado</TableHead>
                          <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mantenimientosFiltrados.map((mant) => {
                          const estado = obtenerEstadoMantenimiento(mant.horasKmRestante);
                          const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
                          const equipo = equiposPorFicha[mant.ficha];

                          return (
                            <TableRow key={mant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                              <TableCell className="font-mono font-medium text-slate-700 dark:text-slate-300">{mant.ficha}</TableCell>
                              <TableCell>
                                <EquipoLink ficha={mant.ficha} variant="link" className="p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">
                                  {mant.nombreEquipo}
                                </EquipoLink>
                              </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">{equipo?.categoria || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {mant.tipoMantenimiento}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{mant.horasKmActuales.toLocaleString()} <span className="text-xs text-muted-foreground">{unidad}</span></TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">{mant.frecuencia.toLocaleString()} <span className="text-xs text-muted-foreground">{unidad}</span></TableCell>
                              <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                                {mant.horasKmUltimoMantenimiento.toLocaleString()} <span className="text-xs text-muted-foreground">{unidad}</span>
                              </TableCell>
                              <TableCell className="font-medium text-purple-600 dark:text-purple-400">{mant.proximoMantenimiento.toLocaleString()} <span className="text-xs text-muted-foreground">{unidad}</span></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {mant.horasKmRestante <= 0 && (
                                    <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                                  )}
                                  {mant.horasKmRestante > 0 && mant.horasKmRestante <= 100 && (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span
                                    className={
                                      mant.horasKmRestante <= 0
                                        ? 'font-bold text-red-600 dark:text-red-500'
                                        : mant.horasKmRestante <= 100
                                          ? 'font-bold text-amber-600 dark:text-amber-500'
                                          : 'font-semibold text-emerald-600 dark:text-emerald-500'
                                    }
                                  >
                                    {formatRemainingLabel(mant.horasKmRestante, unidad)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">{formatearFecha(mant.fechaUltimoMantenimiento)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={estado.variant}
                                  className={
                                    estado.label === 'Vencido'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : estado.label === 'Próximo'
                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }
                                >
                                  {estado.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditForm(mant)}
                                    aria-label="Editar mantenimiento"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget(mant)}
                                    disabled={isDeleting && deleteTarget?.id === mant.id}
                                    aria-label="Eliminar mantenimiento"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            {mantenimientosFiltrados.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No se encontraron mantenimientos que coincidan con los filtros seleccionados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        onConfirm={confirmClearDatabase}
        title="Eliminar todos los datos"
        description="¿Está seguro de que desea eliminar todos los datos de la base de datos? Esta acción no se puede deshacer y se perderá toda la información almacenada."
        confirmText="Eliminar todo"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Layout>
  );
}
