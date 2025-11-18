// Tipos para el sistema completo de planificación de mantenimiento

export interface AlertaMantenimiento {
  id: number;
  ficha_equipo: string;
  nombre_equipo: string;
  intervalo_mp: string; // PM1, PM2, PM3, PM4
  horas_alerta: number;
  tecnico_responsable: string | null;
  activa: boolean;
  ultima_notificacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanificacionMantenimiento {
  id: number;
  fichaEquipo: string;
  nombreEquipo: string;
  categoria: string;
  marca: string;
  modelo: string;
  lecturasActuales: number;
  proximoMP: string;
  proximasHoras: number;
  horasRestantes: number;
  planId: number | null;
  intervaloId: number | null;
  kitId: number | null;
  planNombre: string | null;
  kitNombre: string | null;
  estado: 'pendiente' | 'programado' | 'en_progreso' | 'completado';
  fechaProgramada: string | null;
  observaciones: string | null;
  tecnico_responsable: string | null;
  horas_alerta: number;
  alerta_enviada: boolean;
  fecha_alerta: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipoPlanAuto {
  id: number;
  modelo: string;
  marca: string;
  categoria: string | null;
  plan_id: number;
  created_at: string;
}

export interface EquipoConPlanSugerido {
  equipo_id: number;
  ficha: string;
  nombre: string;
  marca: string;
  modelo: string;
  categoria: string;
  numero_serie: string;
  plan_sugerido_id: number | null;
  plan_sugerido_nombre: string | null;
  plan_sugerido_descripcion: string | null;
  horas_km_actuales: number | null;
  proximo_mantenimiento: number | null;
  horas_km_restante: number | null;
}

export interface EquipoRequiereAlerta {
  ficha_equipo: string;
  nombre_equipo: string;
  intervalo_mp: string;
  horas_actuales: number;
  horas_objetivo: number;
  horas_restantes: number;
  tecnico_responsable: string | null;
  debe_alertar: boolean;
}

export interface CrearPlanificacionInput {
  fichaEquipo: string;
  nombreEquipo: string;
  categoria: string;
  marca: string;
  modelo: string;
  lecturasActuales: number;
  proximoMP: string;
  proximasHoras: number;
  horasRestantes: number;
  planId?: number;
  intervaloId?: number;
  kitId?: number;
  planNombre?: string;
  kitNombre?: string;
  estado?: 'pendiente' | 'programado' | 'en_progreso' | 'completado';
  fechaProgramada?: string;
  observaciones?: string;
  tecnico_responsable?: string;
  horas_alerta?: number;
}

export interface CrearAlertaInput {
  ficha_equipo: string;
  nombre_equipo: string;
  intervalo_mp: string;
  horas_alerta: number;
  tecnico_responsable?: string;
  activa?: boolean;
}
