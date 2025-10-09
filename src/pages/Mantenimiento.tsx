import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Search, Filter, Clock, AlertCircle, Download, X } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function Mantenimiento() {
  const { data, loading } = useLocalStorage();
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

  return (
    <Layout title="Mantenimiento Programado">
      <Navigation />
      
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
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Mantenimientos Programados
              </CardTitle>
              <CardDescription>
                Control y seguimiento de mantenimientos preventivos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={modoAvanzado ? "default" : "outline"} 
                size="sm"
                onClick={() => setModoAvanzado(!modoAvanzado)}
              >
                {modoAvanzado ? "Modo Simple" : "Modo Avanzado"}
              </Button>
              <Button onClick={exportarPDF} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
          
          {!modoAvanzado ? (
            // Filtros simples
            <div className="space-y-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar mantenimientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Tipos</Label>
                  <div className="space-y-2">
                    {tipos.map(tipo => (
                      <div key={tipo} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tipo-${tipo}`}
                          checked={filtros.tipos.includes(tipo)}
                          onCheckedChange={() => toggleTipo(tipo)}
                        />
                        <label htmlFor={`tipo-${tipo}`} className="text-sm cursor-pointer">
                          {tipo}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Categorías</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {categorias.map(cat => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cat-simple-${cat}`}
                          checked={filtros.categorias.includes(cat)}
                          onCheckedChange={() => toggleCategoria(cat)}
                        />
                        <label htmlFor={`cat-simple-${cat}`} className="text-sm cursor-pointer">
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
                      <div key={estado} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`estado-simple-${estado}`}
                          checked={filtros.estados.includes(estado)}
                          onCheckedChange={() => toggleEstado(estado)}
                        />
                        <label htmlFor={`estado-simple-${estado}`} className="text-sm cursor-pointer capitalize">
                          {estado === 'proximo' ? 'Próximos' : estado === 'vencido' ? 'Vencidos' : 'Normales'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  {(filtros.tipos.length > 0 || filtros.categorias.length > 0 || filtros.estados.length > 0 || filtros.fichas.length > 0 || searchTerm) && (
                    <Button variant="outline" size="sm" onClick={limpiarFiltros} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Filtros avanzados
            <div className="space-y-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar mantenimientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Tipos (Multi-select)</Label>
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    {tipos.map(tipo => (
                      <div key={tipo} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tipo-adv-${tipo}`}
                          checked={filtros.tipos.includes(tipo)}
                          onCheckedChange={() => toggleTipo(tipo)}
                        />
                        <label htmlFor={`tipo-adv-${tipo}`} className="text-sm cursor-pointer flex-1">
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
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {categorias.map(cat => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cat-adv-${cat}`}
                          checked={filtros.categorias.includes(cat)}
                          onCheckedChange={() => toggleCategoria(cat)}
                        />
                        <label htmlFor={`cat-adv-${cat}`} className="text-sm cursor-pointer flex-1">
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
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {fichas.slice(0, 20).map(ficha => (
                      <div key={ficha} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`ficha-adv-${ficha}`}
                          checked={filtros.fichas.includes(ficha)}
                          onCheckedChange={() => toggleFicha(ficha)}
                        />
                        <label htmlFor={`ficha-adv-${ficha}`} className="text-sm cursor-pointer flex-1 font-mono">
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
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    {['vencido', 'proximo', 'normal'].map(estado => (
                      <div key={estado} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`estado-adv-${estado}`}
                          checked={filtros.estados.includes(estado)}
                          onCheckedChange={() => toggleEstado(estado)}
                        />
                        <label htmlFor={`estado-adv-${estado}`} className="text-sm cursor-pointer capitalize">
                          {estado === 'proximo' ? 'Próximos' : estado === 'vencido' ? 'Vencidos' : 'Normales'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="mb-2 block">Hrs/Km Restante Mínimo</Label>
                  <Input 
                    type="number"
                    placeholder="Mínimo"
                    value={filtros.restanteMin}
                    onChange={(e) => setFiltros({...filtros, restanteMin: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Hrs/Km Restante Máximo</Label>
                  <Input 
                    type="number"
                    placeholder="Máximo"
                    value={filtros.restanteMax}
                    onChange={(e) => setFiltros({...filtros, restanteMax: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  {(filtros.tipos.length > 0 || filtros.categorias.length > 0 || filtros.estados.length > 0 || filtros.fichas.length > 0 || filtros.restanteMin || filtros.restanteMax || searchTerm) && (
                    <Button variant="outline" onClick={limpiarFiltros} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Limpiar Todos los Filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Resumen de filtros activos */}
              {(filtros.tipos.length > 0 || filtros.categorias.length > 0 || filtros.estados.length > 0 || filtros.fichas.length > 0 || filtros.restanteMin || filtros.restanteMax) && (
                <div className="pt-4 border-t">
                  <Label className="mb-2 block text-sm font-semibold">Filtros Aplicados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filtros.tipos.map(tipo => (
                      <Badge key={tipo} variant="secondary">
                        Tipo: {tipo}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleTipo(tipo)}
                        />
                      </Badge>
                    ))}
                    {filtros.categorias.map(cat => (
                      <Badge key={cat} variant="secondary">
                        Cat: {cat}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleCategoria(cat)}
                        />
                      </Badge>
                    ))}
                    {filtros.fichas.map(ficha => (
                      <Badge key={ficha} variant="secondary" className="font-mono">
                        Ficha: {ficha}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleFicha(ficha)}
                        />
                      </Badge>
                    ))}
                    {filtros.estados.map(estado => (
                      <Badge key={estado} variant="secondary" className="capitalize">
                        {estado === 'proximo' ? 'Próximo' : estado === 'vencido' ? 'Vencido' : 'Normal'}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleEstado(estado)}
                        />
                      </Badge>
                    ))}
                    {filtros.restanteMin && (
                      <Badge variant="secondary">
                        Restante ≥ {filtros.restanteMin}
                      </Badge>
                    )}
                    {filtros.restanteMax && (
                      <Badge variant="secondary">
                        Restante ≤ {filtros.restanteMax}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
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