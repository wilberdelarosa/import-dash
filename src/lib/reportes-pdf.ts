import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ReportePDFEquipo {
  ficha: string;
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  activo: boolean;
}

export interface ReportePDFResumenCategoria {
  categoria: string;
  total: number;
  activos: number;
  inactivos: number;
}

export interface GenerarReportePDFParams {
  equiposFiltrados: ReportePDFEquipo[];
  resumenPorCategoria: ReportePDFResumenCategoria[];
  mantenimientosVencidosCount: number;
  mantenimientosPorVencerCount: number;
  getHorasKm: (ficha: string) => { horasKm: number; unidad: string };
}

/**
 * Genera el PDF de "Reporte de Equipos y Analytics".
 * Reutilizado por la vista de escritorio (Reportes.tsx) y la vista móvil (ReportesMobile.tsx)
 * para garantizar que ambas produzcan exactamente el mismo documento.
 */
export function generarReportePDF({
  equiposFiltrados,
  resumenPorCategoria,
  mantenimientosVencidosCount,
  mantenimientosPorVencerCount,
  getHorasKm,
}: GenerarReportePDFParams) {
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
  doc.text(`Mantenimientos Vencidos: ${mantenimientosVencidosCount}`, 150, 48);
  doc.text(`Mantenimientos por Vencer: ${mantenimientosPorVencerCount}`, 150, 55);

  // Tabla de resumen por categoría
  if (resumenPorCategoria.length > 0) {
    doc.setFontSize(12);
    doc.text('Resumen por Categoría', 20, 75);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 120;

  doc.setFontSize(12);
  doc.text('Detalle de Equipos', 20, finalY);

  const tableData = equiposFiltrados.map(equipo => {
    const { horasKm, unidad } = getHorasKm(equipo.ficha);

    return [
      equipo.ficha,
      equipo.nombre,
      equipo.categoria,
      equipo.marca,
      equipo.modelo,
      `${horasKm.toFixed(1)} ${unidad}`,
      equipo.activo ? 'Activo' : 'Inactivo'
    ];
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}
