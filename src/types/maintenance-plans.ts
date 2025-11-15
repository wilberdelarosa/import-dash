export interface PlanMantenimiento {
  id: number;
  nombre: string;
  marca: string;
  modelo: string | null;
  categoria: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface PlanIntervalo {
  id: number;
  plan_id: number;
  codigo: string;
  nombre: string;
  horas_intervalo: number;
  descripcion: string | null;
  tareas: string[];
  orden: number;
  created_at: string;
}

export interface KitMantenimiento {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  marca: string | null;
  modelo_aplicable: string | null;
  categoria: string | null;
  activo: boolean;
  created_at: string;
}

export interface KitPieza {
  id: number;
  kit_id: number;
  numero_parte: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  notas: string | null;
  created_at: string;
}

export interface PlanIntervaloKit {
  id: number;
  plan_intervalo_id: number;
  kit_id: number;
  created_at: string;
}

export interface IntervaloKitAssignment extends PlanIntervaloKit {
  kit: KitMantenimiento;
}

export interface PlanConIntervalos extends PlanMantenimiento {
  intervalos: IntervaloConKits[];
}

export interface KitConPiezas extends KitMantenimiento {
  piezas: KitPieza[];
}

export interface IntervaloConKits extends PlanIntervalo {
  kits: IntervaloKitAssignment[];
}
