import { Layout } from '@/components/Layout';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, FileDown, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reportes() {
  const { data, loading } = useLocalStorage();
  const [modoAvanzado, setModoAvanzado] = useState(false);
  const [filtros, setFiltros] = useState({
    categorias: [] as string[],
    marcas: [] as string[],
    estados: [] as string[],
    fichas: [] as string[],
    fechaDesde: '',
    fechaHasta: '',
    horasDesde: '',
    horasHasta: ''
  });

  if (loading) {
    return (
      <Layout title="Reportes y Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const categorias = [...new Set(data.equipos.map(e => e.categoria))];
  const marcas = [...new Set(data.equipos.map(e => e.marca))];
  const fichas = [...new Set(data.equipos.map(e => e.ficha))].sort();

  const equiposFiltrados = data.equipos.filter(equipo => {
    // Filtro de categorías (multi-select)
    const pasaCategoria = filtros.categorias.length === 0 || filtros.categorias.includes(equipo.categoria);
    
    // Filtro de marcas (multi-select)
    const pasaMarca = filtros.marcas.length === 0 || filtros.marcas.includes(equipo.marca);
    
    // Filtro de estados (multi-select)
    const pasaEstado = filtros.estados.length === 0 || 
      (filtros.estados.includes('activo') && equipo.activo) ||
      (filtros.estados.includes('inactivo') && !equipo.activo);
    
    // Filtro de fichas (multi-select)
    const pasaFicha = filtros.fichas.length === 0 || filtros.fichas.includes(equipo.ficha);
    
    // Filtro de horas/km - obtener del mantenimiento programado
    const mantenimiento = data.mantenimientosProgramados.find(m => m.ficha === equipo.ficha);
    const horasActuales = mantenimiento?.horasKmActuales || 0;
    const pasaHorasMin = !filtros.horasDesde || horasActuales >= parseFloat(filtros.horasDesde);
    const pasaHorasMax = !filtros.horasHasta || horasActuales <= parseFloat(filtros.horasHasta);
    
    return pasaCategoria && pasaMarca && pasaEstado && pasaFicha && pasaHorasMin && pasaHorasMax;
  });

  const resumenPorCategoria = categorias.map(categoria => {
    const equiposCategoria = equiposFiltrados.filter(e => e.categoria === categoria);
    return {
      categoria,
      total: equiposCategoria.length,
      activos: equiposCategoria.filter(e => e.activo).length,
      inactivos: equiposCategoria.filter(e => !e.activo).length
    };
  });

  const resumenPorMarca = marcas.map(marca => {
    const equiposMarca = equiposFiltrados.filter(e => e.marca === marca);
    return {
      marca,
      total: equiposMarca.length,
      activos: equiposMarca.filter(e => e.activo).length,
      inactivos: equiposMarca.filter(e => !e.activo).length
    };
  });

  const mantenimientosVencidos = data.mantenimientosProgramados.filter(m => 
    m.activo && m.horasKmRestante <= 0
  );

  const mantenimientosPorVencer = data.mantenimientosProgramados.filter(m => 
    m.activo && m.horasKmRestante > 0 && m.horasKmRestante <= 100
  );

  const exportarJSON = () => {
    const reporte = {
      fecha: new Date().toISOString(),
      filtros,
      resumen: {
        totalEquipos: equiposFiltrados.length,
        equiposActivos: equiposFiltrados.filter(e => e.activo).length,
        equiposInactivos: equiposFiltrados.filter(e => !e.activo).length,
        mantenimientosVencidos: mantenimientosVencidos.length,
        mantenimientosPorVencer: mantenimientosPorVencer.length
      },
      equipos: equiposFiltrados,
      resumenPorCategoria,
      resumenPorMarca,
      mantenimientos: {
        vencidos: mantenimientosVencidos,
        porVencer: mantenimientosPorVencer
      }
    };

    const dataStr = JSON.stringify(reporte, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-equipos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Título del documento
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text('Reporte de Equipos y Analytics', 20, 20);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 20, 28);
    
    // Resumen estadístico
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen General', 20, 40);
    
    doc.setFontSize(10);
    doc.text(`Total de Equipos: ${equiposFiltrados.length}`, 20, 48);
    doc.text(`Activos: ${equiposFiltrados.filter(e => e.activo).length}`, 20, 55);
    doc.text(`Inactivos: ${equiposFiltrados.filter(e => !e.activo).length}`, 20, 62);
    doc.text(`Mantenimientos Vencidos: ${mantenimientosVencidos.length}`, 150, 48);
    doc.text(`Mantenimientos por Vencer: ${mantenimientosPorVencer.length}`, 150, 55);
    
    // Tabla de resumen por categoría
    if (resumenPorCategoria.length > 0) {
      doc.setFontSize(12);
      doc.text('Resumen por Categoría', 20, 75);
      
      (doc as any).autoTable({
        startY: 80,
        head: [['Categoría', 'Total', 'Activos', 'Inactivos']],
        body: resumenPorCategoria.map(item => [
          item.categoria,
          item.total,
          item.activos,
          item.inactivos
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: 20, right: 150 }
      });
    }
    
    // Tabla de equipos
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 120;
    
    doc.setFontSize(12);
    doc.text('Detalle de Equipos', 20, finalY);
    
    const tableData = equiposFiltrados.map(equipo => {
      const mantenimiento = data.mantenimientosProgramados.find(m => m.ficha === equipo.ficha);
      const horasKm = mantenimiento?.horasKmActuales || 0;
      const unidad = mantenimiento?.tipoMantenimiento === 'Horas' ? 'hrs' : 'km';
      
      return [
        equipo.ficha,
        equipo.nombre,
        equipo.categoria,
        equipo.marca,
        equipo.modelo,
        `${horasKm.toLocaleString()} ${unidad}`,
        equipo.activo ? 'Activo' : 'Inactivo'
      ];
    });
    
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Ficha', 'Nombre', 'Categoría', 'Marca', 'Modelo', 'Horas/Km', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 40 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 6) {
          const estado = data.cell.raw;
          if (estado === 'Activo') {
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });
    
    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
    
    doc.save(`reporte-equipos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleCategoria = (categoria: string) => {
    setFiltros(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoria)
        ? prev.categorias.filter(c => c !== categoria)
        : [...prev.categorias, categoria]
    }));
  };

  const toggleMarca = (marca: string) => {
    setFiltros(prev => ({
      ...prev,
      marcas: prev.marcas.includes(marca)
        ? prev.marcas.filter(m => m !== marca)
        : [...prev.marcas, marca]
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
      categorias: [],
      marcas: [],
      estados: [],
      fichas: [],
      fechaDesde: '',
      fechaHasta: '',
      horasDesde: '',
      horasHasta: ''
    });
  };

  return (
    <Layout title="Reportes y Analytics">
      <Navigation />
      
      {/* Barra de filtros avanzados */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros de Reporte
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={modoAvanzado ? "default" : "outline"} 
                size="sm"
                onClick={() => setModoAvanzado(!modoAvanzado)}
              >
                {modoAvanzado ? "Modo Simple" : "Modo Avanzado"}
              </Button>
              {(filtros.categorias.length > 0 || filtros.marcas.length > 0 || filtros.estados.length > 0 || filtros.fichas.length > 0) && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  <X className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!modoAvanzado ? (
            // Filtros simples
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Categorías</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {categorias.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${cat}`}
                        checked={filtros.categorias.includes(cat)}
                        onCheckedChange={() => toggleCategoria(cat)}
                      />
                      <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                        {cat}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Marcas</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {marcas.map(marca => (
                    <div key={marca} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`marca-${marca}`}
                        checked={filtros.marcas.includes(marca)}
                        onCheckedChange={() => toggleMarca(marca)}
                      />
                      <label htmlFor={`marca-${marca}`} className="text-sm cursor-pointer">
                        {marca}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Estados</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="estado-activo"
                      checked={filtros.estados.includes('activo')}
                      onCheckedChange={() => toggleEstado('activo')}
                    />
                    <label htmlFor="estado-activo" className="text-sm cursor-pointer">
                      Activos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="estado-inactivo"
                      checked={filtros.estados.includes('inactivo')}
                      onCheckedChange={() => toggleEstado('inactivo')}
                    />
                    <label htmlFor="estado-inactivo" className="text-sm cursor-pointer">
                      Inactivos
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={exportarPDF} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={exportarJSON} variant="outline" className="flex-1">
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          ) : (
            // Filtros avanzados
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label className="mb-2 block">Marcas (Multi-select)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {marcas.map(marca => (
                      <div key={marca} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`marca-adv-${marca}`}
                          checked={filtros.marcas.includes(marca)}
                          onCheckedChange={() => toggleMarca(marca)}
                        />
                        <label htmlFor={`marca-adv-${marca}`} className="text-sm cursor-pointer flex-1">
                          {marca}
                        </label>
                      </div>
                    ))}
                  </div>
                  {filtros.marcas.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      {filtros.marcas.length} seleccionada(s)
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Fichas Específicas</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {fichas.slice(0, 20).map(ficha => (
                      <div key={ficha} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`ficha-${ficha}`}
                          checked={filtros.fichas.includes(ficha)}
                          onCheckedChange={() => toggleFicha(ficha)}
                        />
                        <label htmlFor={`ficha-${ficha}`} className="text-sm cursor-pointer flex-1 font-mono">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <Label className="mb-2 block">Horas/Km desde</Label>
                  <Input 
                    type="number"
                    placeholder="Mínimo"
                    value={filtros.horasDesde}
                    onChange={(e) => setFiltros({...filtros, horasDesde: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Horas/Km hasta</Label>
                  <Input 
                    type="number"
                    placeholder="Máximo"
                    value={filtros.horasHasta}
                    onChange={(e) => setFiltros({...filtros, horasHasta: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Estados</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="estado-activo-adv"
                        checked={filtros.estados.includes('activo')}
                        onCheckedChange={() => toggleEstado('activo')}
                      />
                      <label htmlFor="estado-activo-adv" className="text-sm cursor-pointer">
                        Activos
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="estado-inactivo-adv"
                        checked={filtros.estados.includes('inactivo')}
                        onCheckedChange={() => toggleEstado('inactivo')}
                      />
                      <label htmlFor="estado-inactivo-adv" className="text-sm cursor-pointer">
                        Inactivos
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={exportarPDF} className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button onClick={exportarJSON} variant="outline" className="flex-1">
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                </div>
              </div>

              {/* Resumen de filtros activos */}
              {(filtros.categorias.length > 0 || filtros.marcas.length > 0 || filtros.fichas.length > 0 || filtros.estados.length > 0 || filtros.horasDesde || filtros.horasHasta) && (
                <div className="pt-4 border-t">
                  <Label className="mb-2 block text-sm font-semibold">Filtros Aplicados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filtros.categorias.map(cat => (
                      <Badge key={cat} variant="secondary">
                        Cat: {cat}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleCategoria(cat)}
                        />
                      </Badge>
                    ))}
                    {filtros.marcas.map(marca => (
                      <Badge key={marca} variant="secondary">
                        Marca: {marca}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleMarca(marca)}
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
                      <Badge key={estado} variant="secondary">
                        {estado === 'activo' ? 'Activo' : 'Inactivo'}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => toggleEstado(estado)}
                        />
                      </Badge>
                    ))}
                    {filtros.horasDesde && (
                      <Badge variant="secondary">
                        Horas ≥ {filtros.horasDesde}
                      </Badge>
                    )}
                    {filtros.horasHasta && (
                      <Badge variant="secondary">
                        Horas ≤ {filtros.horasHasta}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equipos</CardDescription>
            <CardTitle className="text-2xl">{equiposFiltrados.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-2xl text-success">
              {equiposFiltrados.filter(e => e.activo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mantenimientos Vencidos</CardDescription>
            <CardTitle className="text-2xl text-destructive">{mantenimientosVencidos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Por Vencer</CardDescription>
            <CardTitle className="text-2xl text-warning">{mantenimientosPorVencer.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead>Inactivos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumenPorCategoria.map((item) => (
                  <TableRow key={item.categoria}>
                    <TableCell className="font-medium">{item.categoria}</TableCell>
                    <TableCell>{item.total}</TableCell>
                    <TableCell className="text-success">{item.activos}</TableCell>
                    <TableCell className="text-destructive">{item.inactivos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mantenimientos críticos */}
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos Críticos</CardTitle>
            <CardDescription>Equipos que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mantenimientosVencidos.slice(0, 5).map((mant) => (
                <div key={mant.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{mant.nombreEquipo}</p>
                    <p className="text-sm text-muted-foreground">{mant.ficha}</p>
                  </div>
                  <Badge variant="destructive">
                    Vencido: {Math.abs(mant.horasKmRestante).toFixed(0)} {mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km'}
                  </Badge>
                </div>
              ))}
              {mantenimientosPorVencer.slice(0, 3).map((mant) => (
                <div key={mant.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{mant.nombreEquipo}</p>
                    <p className="text-sm text-muted-foreground">{mant.ficha}</p>
                  </div>
                  <Badge variant="secondary">
                    Resta: {mant.horasKmRestante.toFixed(0)} {mant.tipoMantenimiento === 'Horas' ? 'hrs' : 'km'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}