export interface HistorialEvento {
  id: number;
  tipoEvento: 'crear' | 'actualizar' | 'eliminar' | 'mantenimiento_realizado' | 'stock_movido' | 'lectura_actualizada' | 'sistema';
  modulo: 'equipos' | 'inventarios' | 'mantenimientos' | 'sistema';
  fichaEquipo: string | null;
  nombreEquipo: string | null;
  usuarioResponsable: string;
  descripcion: string;
  datosAntes: any | null;
  datosDespues: any | null;
  nivelImportancia: 'info' | 'warning' | 'critical';
  metadata: any | null;
  createdAt: string;
}

export interface Notificacion {
  id: number;
  tipo: 'mantenimiento_vencido' | 'mantenimiento_proximo' | 'stock_bajo' | 'equipo_inactivo';
  titulo: string;
  mensaje: string;
  fichaEquipo: string | null;
  nombreEquipo: string | null;
  nivel: 'info' | 'warning' | 'critical';
  leida: boolean;
  accionUrl: string | null;
  metadata: any | null;
  createdAt: string;
}

export interface FiltrosHistorial {
  busqueda: string;
  tipoEvento: string[];
  modulo: string[];
  nivelImportancia: string[];
  fichaEquipo: string | null;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
}
