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

// =====================================================
// Tipos para Sistema de Overrides
// =====================================================

export interface OverridePlan {
  id: number;
  ficha_equipo: string;
  plan_original_id: number | null;
  plan_forzado_id: number;
  motivo: string;
  usuario_email: string;
  created_at: string;
  updated_at: string;
  activo: boolean;
}

export interface EquipoConOverride {
  ficha_equipo: string;
  plan_original_id: number | null;
  plan_forzado_id: number;
  motivo: string;
  usuario_email: string;
  override_fecha: string;
  plan_original_nombre: string | null;
  plan_forzado_nombre: string;
  plan_marca: string;
  plan_modelo: string | null;
}

export interface CrearOverrideInput {
  ficha_equipo: string;
  plan_original_id?: number | null;
  plan_forzado_id: number;
  motivo: string;
  usuario_email: string;
}

export interface ActualizarOverrideInput {
  motivo?: string;
  activo?: boolean;
}

// =====================================================
// Tipos para Rutas Predictivas
// =====================================================

export interface RutaPredictiva {
  orden: number; // 1-8
  mp: string; // MP1, MP2, MP3, MP4
  nombre: string; // Descripción del intervalo
  horasObjetivo: number;
  horasActuales: number;
  horasRestantes: number;
  ciclo: number; // Número de ciclo (1, 2, 3...)
  intervaloId: number;
  kitId: number | null;
  kitNombre: string | null;
  tareas: string[];
}

export interface CicloMantenimiento {
  numero: number; // Número del ciclo
  inicio: number; // Horas de inicio del ciclo
  fin: number; // Horas de fin del ciclo
  intervalos: RutaPredictiva[];
  completo: boolean; // Si todos los MPs del ciclo están completados
}

// Planificación extendida con info de ruta
export interface PlanificacionConRuta extends PlanificacionMantenimiento {
  numero_ruta: number | null; // 1-8
  ciclo_numero: number | null;
  es_override: boolean;
  plan_id: number | null;
}
