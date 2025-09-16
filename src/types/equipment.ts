export interface Equipo {
  id: number;
  ficha: string;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  placa: string;
  categoria: string;
  activo: boolean;
  motivoInactividad: string | null;
}

export interface Inventario {
  id: number;
  nombre: string;
  tipo: string;
  categoriaEquipo: string;
  cantidad: number;
  movimientos: Movimiento[];
  activo: boolean;
  codigoIdentificacion: string;
  empresaSuplidora: string;
  marcasCompatibles: string[];
  modelosCompatibles: string[];
}

export interface Movimiento {
  fecha: string;
  tipo: string;
  cantidad: number;
  responsable: string;
  motivo: string;
}

export interface MantenimientoProgramado {
  id: number;
  ficha: string;
  nombreEquipo: string;
  tipoMantenimiento: string;
  horasKmActuales: number;
  fechaUltimaActualizacion: string;
  frecuencia: number;
  fechaUltimoMantenimiento: string | null;
  horasKmUltimoMantenimiento: number;
  proximoMantenimiento: number;
  horasKmRestante: number;
  activo: boolean;
}

export interface DatabaseData {
  equipos: Equipo[];
  inventarios: Inventario[];
  mantenimientosProgramados: MantenimientoProgramado[];
}