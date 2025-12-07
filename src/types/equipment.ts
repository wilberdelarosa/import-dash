// Empresas disponibles para asignar equipos
// VENDIDO: El equipo fue vendido y no debe aparecer en el sistema (se marca inactivo automáticamente)
export type EmpresaEquipo = 'ALITO GROUP SRL' | 'ALITO EIRL' | 'VENDIDO';

export const EMPRESAS_DISPONIBLES: EmpresaEquipo[] = ['ALITO GROUP SRL', 'ALITO EIRL', 'VENDIDO'];

// Empresas operativas (excluye VENDIDO para selectores normales)
export const EMPRESAS_OPERATIVAS: EmpresaEquipo[] = ['ALITO GROUP SRL', 'ALITO EIRL'];

// Helper para verificar si un equipo está vendido
export const isEquipoVendido = (empresa: EmpresaEquipo | string): boolean => empresa === 'VENDIDO';

// Helper para verificar si un equipo debe mostrarse en el sistema (no vendido o inactivo)
export const isEquipoDisponible = (equipo: { empresa: EmpresaEquipo | string; activo: boolean }): boolean => {
  return equipo.activo && !isEquipoVendido(equipo.empresa);
};

export interface Equipo {
  id: number;
  ficha: string;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  placa: string;
  categoria: string;
  empresa: EmpresaEquipo;
  activo: boolean;
  motivoInactividad: string | null;
}

export interface Inventario {
  id: number;
  nombre: string;
  numeroParte: string;
  tipo: string;
  sistema: string | null;
  categoriaEquipo: string;
  cantidad: number;
  stockMinimo: number;
  movimientos: Movimiento[];
  activo: boolean;
  codigoIdentificacion: string;
  ubicacion: string | null;
  empresaSuplidora: string;
  marcaFabricante: string | null;
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
  horasPrevias?: number;
  restante?: number;
  observaciones?: string;
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
  horasPrevias?: number;
}

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  cargo: string;
  categoria: string;
  fechaNacimiento: string;
  activo: boolean;
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
