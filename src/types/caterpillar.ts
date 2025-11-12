export interface CatModelo {
  id: number;
  modelo: string;
  categoria: string;
  serie_desde: string | null;
  serie_hasta: string | null;
  motor: string;
  capacidad_aceite_motor: number;
  capacidad_hidraulico: number;
  capacidad_refrigerante: number;
  notas: string | null;
}

export interface CatIntervalo {
  id: number;
  codigo: string;
  nombre: string;
  horas_intervalo: number;
  descripcion: string;
}

export interface CatPieza {
  id: number;
  numero_parte: string;
  descripcion: string;
  tipo: string;
}

export interface ModeloIntervaloPieza {
  id: number;
  modelo_id: number;
  intervalo_id: number;
  pieza_id: number;
  cantidad: number;
  notas: string | null;
  pieza: CatPieza;
  intervalo: CatIntervalo;
}

export interface CaterpillarSpecializedMaintenance {
  id: string;
  intervaloCodigo: string;
  descripcion: string;
  referencia?: string;
  adjuntos?: { label: string; url: string }[];
  responsableSugerido?: string;
}

export interface CaterpillarEquipmentData {
  modelo: CatModelo | null;
  intervalos: CatIntervalo[];
  piezasPorIntervalo: Record<string, ModeloIntervaloPieza[]>;
  tareasPorIntervalo: Record<string, string[]>;
  mantenimientosEspeciales: CaterpillarSpecializedMaintenance[];
}
