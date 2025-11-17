/* eslint-disable @typescript-eslint/no-explicit-any */
export type TipoEventoBase =
  | 'crear'
  | 'actualizar'
  | 'eliminar'
  | 'mantenimiento_realizado'
  | 'stock_movido'
  | 'lectura_actualizada'
  | 'sistema';

export type TipoEventoDetallado =
  | TipoEventoBase
  | 'equipo_creado'
  | 'equipo_actualizado'
  | 'equipo_eliminado'
  | 'inventario_creado'
  | 'inventario_actualizado'
  | 'inventario_eliminado'
  | 'mantenimiento_creado'
  | 'mantenimiento_actualizado'
  | 'mantenimiento_eliminado'
  | 'importacion_sincronizada';

export interface HistorialEvento {
  id: number;
  tipoEvento: TipoEventoDetallado;
  categoriaEvento: TipoEventoBase;
  etiquetaCategoria: string;
  etiquetaSubtipo: string | null;
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
  tipoEvento: TipoEventoBase[];
  modulo: string[];
  nivelImportancia: string[];
  fichaEquipo: string | null;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
}
