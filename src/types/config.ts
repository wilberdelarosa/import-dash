export interface SystemConfig {
  id: number;
  alertaCritica: number;
  alertaPreventiva: number;
  permitirImportaciones: boolean;
  notificarEmail: boolean;
  notificarWhatsapp: boolean;
  notificarDispositivo: boolean;
  correoSoporte: string;
  correoNotificaciones: string;
  telefonoWhatsapp: string;
  modoOscuroAutomatico: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  id: 1,
  alertaCritica: 15,
  alertaPreventiva: 50,
  permitirImportaciones: true,
  notificarEmail: true,
  notificarWhatsapp: false,
  notificarDispositivo: true,
  correoSoporte: '',
  correoNotificaciones: '',
  telefonoWhatsapp: '',
  modoOscuroAutomatico: true,
};
