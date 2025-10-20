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

export interface ActualizacionHorasKm {
  id: number;
  ficha: string;
  nombreEquipo: string | null;
  fecha: string;
  horasKm: number;
  incremento: number;
  usuarioResponsable: string;
}

export interface FiltroUtilizado {
  idInventario?: number;
  nombre: string;
  cantidad: number;
}

export interface MantenimientoRealizado {
  id: number;
  ficha: string;
  nombreEquipo: string | null;
  fechaMantenimiento: string;
  horasKmAlMomento: number;
  idEmpleado: number | null;
  observaciones: string;
  incrementoDesdeUltimo: number;
  filtrosUtilizados: FiltroUtilizado[];
  usuarioResponsable: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  cargo: string;
  categoria: string;
  fechaNacimiento: string;
  activo: boolean;
  email?: string | null;
  telefono?: string | null;
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
  mantenimientosRealizados: MantenimientoRealizado[];
  actualizacionesHorasKm: ActualizacionHorasKm[];
  empleados?: Empleado[];
}