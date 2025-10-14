import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Calendar, Search, Filter, Clock, AlertCircle, Download, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function Mantenimiento() {
  const { data, loading, clearDatabase } = useSupabaseData();
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

  const clampScale = (value: number) => Math.min(1.4, Math.max(0.8, Number(value.toFixed(2))));

  const handleScaleChange = (value: number[]) => {
    if (!value.length) return;
    setTableScale(clampScale(value[0]));
  };

  const adjustScale = (delta: number) => {
    setTableScale(prev => clampScale(prev + delta));
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
  }, {});
  
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

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título del documento
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Mantenimientos Programados', 20, 25);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, 35);
    
    // Resumen estadístico
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen:', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total de mantenimientos: ${totalMantenimientos}`, 20, 60);
    doc.text(`Vencidos: ${vencidos}`, 20, 68);
    doc.text(`Próximos (≤100): ${proximos}`, 20, 76);
    doc.text(`Normales: ${normales}`, 20, 84);
    
    // Preparar datos para la tabla
    const tableData = mantenimientosFiltrados.map(mant => {
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
        mant.horasKmRestante <= 0 ? 
          `${Math.abs(mant.horasKmRestante).toFixed(0)} ${unidad} vencido` :
          `${mant.horasKmRestante.toFixed(0)} ${unidad}`,
        formatearFecha(mant.fechaUltimoMantenimiento),
        estado.label
      ];
    });
    
    // Configurar tabla
    (doc as any).autoTable({
      startY: 95,
      head: [['Ficha', 'Equipo', 'Categoría', 'Tipo', 'Actual', 'Frecuencia', 'Últ. Mant.', 'Próximo', 'Restante', 'Fecha Últ.', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [34, 197, 94], // Verde
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Ficha
        1: { cellWidth: 25 }, // Equipo
        2: { cellWidth: 20 }, // Categoría
        3: { cellWidth: 15 }, // Tipo
        4: { cellWidth: 20 }, // Actual
        5: { cellWidth: 20 }, // Frecuencia
        6: { cellWidth: 20 }, // Últ. Mant.
        7: { cellWidth: 20 }, // Próximo
        8: { cellWidth: 25 }, // Restante
        9: { cellWidth: 20 }, // Fecha Últ.
        10: { cellWidth: 15 }, // Estado
      },
      didParseCell: (data: any) => {
        // Colorear filas según estado
        if (data.section === 'body') {
          const estado = data.row.raw[10]; // Estado está en la columna 10
          if (estado === 'Vencido') {
            data.cell.styles.fillColor = [254, 242, 242]; // Rojo claro
            data.cell.styles.textColor = [220, 38, 38]; // Rojo
          } else if (estado === 'Próximo') {
            data.cell.styles.fillColor = [255, 251, 235]; // Amarillo claro
            data.cell.styles.textColor = [180, 83, 9]; // Amarillo oscuro
          } else {
            data.cell.styles.fillColor = [240, 253, 244]; // Verde claro
            data.cell.styles.textColor = [22, 163, 74]; // Verde
          }
        }
      },
      margin: { top: 20, right: 15, bottom: 20, left: 15 },
      pageBreak: 'auto',
      showHead: 'everyPage',
    });
    
    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Guardar el PDF
    doc.save(`mantenimientos_${new Date().toISOString().split('T')[0]}.pdf`);
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
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar todos los datos de la base de datos? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      await clearDatabase();
    } finally {
      setClearing(false);
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
          <Label className="mb-2 block">Tipos</Label>
          <div className="space-y-2">
            {tipos.map(tipo => (
              <div
                key={tipo}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`tipo-${tipo}`}
                  checked={filtros.tipos.includes(tipo)}
                  onCheckedChange={() => toggleTipo(tipo)}
                />
                <label htmlFor={`tipo-${tipo}`} className="cursor-pointer text-sm">
                  {tipo}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Categorías</Label>
          <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
            {categorias.map(cat => (
              <div
                key={cat}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`cat-simple-${cat}`}
                  checked={filtros.categorias.includes(cat)}
                  onCheckedChange={() => toggleCategoria(cat)}
                />
                <label htmlFor={`cat-simple-${cat}`} className="cursor-pointer text-sm">
                  {cat}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Estados</Label>
          <div className="space-y-2">
            {['vencido', 'proximo', 'normal'].map(estado => (
              <div
                key={estado}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={`estado-simple-${estado}`}
                  checked={filtros.estados.includes(estado)}
                  onCheckedChange={() => toggleEstado(estado)}
                />
                <label htmlFor={`estado-simple-${estado}`} className="cursor-pointer text-sm capitalize">
                  {estado === 'proximo' ? 'Próximos' : estado === 'vencido' ? 'Vencidos' : 'Normales'}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-start">
          {filtrosAplicados && (
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="w-full transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
      <Navigation />


      <Card className="mb-6 border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Mantenimiento de datos
          </CardTitle>

          <CardDescription>
            Elimina todos los registros de equipos, inventarios y mantenimientos almacenados en la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-muted-foreground">
            Esta acción es irreversible. Asegúrate de haber realizado una copia de seguridad antes de continuar.
          </p>
          <Button
            variant="destructive"
            onClick={handleClearDatabase}
            disabled={clearing}

            className="w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {clearing ? 'Eliminando datos...' : 'Vaciar base de datos'}
          </Button>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Programados</CardDescription>
            <CardTitle className="text-3xl">{totalMantenimientos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencidos</CardDescription>
            <CardTitle className="text-3xl text-destructive">{vencidos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos (≤100)</CardDescription>
            <CardTitle className="text-3xl text-warning">{proximos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Normales</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{normales}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Mantenimientos Programados
              </CardTitle>
              <CardDescription>
                Control y seguimiento de mantenimientos preventivos
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 lg:justify-end">
              <Button
                variant={modoAvanzado ? "default" : "outline"}
                size="sm"
                onClick={() => setModoAvanzado(!modoAvanzado)}
                className="w-full justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary sm:w-auto"
              >
                {modoAvanzado ? "Modo Simple" : "Modo Avanzado"}
              </Button>
              <Button
                onClick={exportarPDF}
                variant="outline"
                size="sm"
                className="flex w-full items-center justify-center gap-2 transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
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
        <CardContent>
          <div className="rounded-md border bg-white p-2 sm:p-4">
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
                <Table className="min-w-[1000px]">
                  <TableHeader>
                <TableRow>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Últ. Mant.</TableHead>
                  <TableHead>Próximo</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Fecha Últ.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientosFiltrados.map((mant) => {
                  const estado = obtenerEstadoMantenimiento(mant.horasKmRestante);
                  const unidad = mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
                  const equipo = equiposPorFicha[mant.ficha];
                  
                  return (
                    <TableRow key={mant.id}>
                      <TableCell className="font-medium">{mant.ficha}</TableCell>
                      <TableCell>{mant.nombreEquipo}</TableCell>
                      <TableCell>{equipo?.categoria || 'N/A'}</TableCell>
                      <TableCell>{mant.tipoMantenimiento}</TableCell>
                      <TableCell>{mant.horasKmActuales.toLocaleString()} {unidad}</TableCell>
                      <TableCell>{mant.frecuencia.toLocaleString()} {unidad}</TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {mant.horasKmUltimoMantenimiento.toLocaleString()} {unidad}
                      </TableCell>
                      <TableCell>{mant.proximoMantenimiento.toLocaleString()} {unidad}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {mant.horasKmRestante <= 0 && (
                            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          {mant.horasKmRestante > 0 && mant.horasKmRestante <= 100 && (
                            <Clock className="w-4 h-4 text-amber-500 mr-2" />
                          )}
                          <span className={
                            mant.horasKmRestante <= 0 ? 'text-red-600 font-medium' :
                            mant.horasKmRestante <= 100 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'
                          }>
                            {mant.horasKmRestante <= 0 ? 
                              `${Math.abs(mant.horasKmRestante).toFixed(0)} ${unidad} vencido` :
                              `${mant.horasKmRestante.toFixed(0)} ${unidad}`
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatearFecha(mant.fechaUltimoMantenimiento)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={estado.variant} 
                          className={
                            estado.label === 'Vencido' ? 'bg-red-100 text-red-700 border-red-200' :
                            estado.label === 'Próximo' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }
                        >
                          {estado.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

          {mantenimientosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron mantenimientos que coincidan con los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}