/**
 * Configuración de Capacitor para experiencia nativa mejorada
 * Este módulo inicializa los plugins nativos cuando la app se ejecuta en Android/iOS
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardStyle, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Detectar si estamos en una plataforma nativa
export const isNativePlatform = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';

/**
 * Inicializar la app nativa
 * Debe llamarse una vez al iniciar la aplicación
 */
export async function initializeNativeApp() {
  if (!isNativePlatform) return;

  try {
    // Configurar Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    
    // Ocultar splash screen después de cargar
    await SplashScreen.hide({
      fadeOutDuration: 500,
    });
    
    // Configurar teclado
    if (isAndroid) {
      await Keyboard.setStyle({ style: KeyboardStyle.Dark });
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    }
    
    console.log('[Capacitor] App nativa inicializada correctamente');
  } catch (error) {
    console.warn('[Capacitor] Error al inicializar:', error);
  }
}

/**
 * Vibración háptica para feedback táctil
 */
export const haptic = {
  /** Vibración ligera para toques */
  light: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* Plugin no disponible */ }
  },
  
  /** Vibración media para selecciones */
  medium: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* Plugin no disponible */ }
  },
  
  /** Vibración fuerte para acciones importantes */
  heavy: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch { /* Plugin no disponible */ }
  },
  
  /** Vibración de selección */
  selection: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.selectionChanged();
    } catch { /* Plugin no disponible */ }
  },
  
  /** Notificación de éxito */
  success: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch { /* Plugin no disponible */ }
  },
  
  /** Notificación de advertencia */
  warning: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch { /* Plugin no disponible */ }
  },
  
  /** Notificación de error */
  error: async () => {
    if (!isNativePlatform) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch { /* Plugin no disponible */ }
  },
};

/**
 * Cambiar estilo del status bar según el tema
 */
export async function setStatusBarStyle(isDark: boolean) {
  if (!isNativePlatform) return;
  
  try {
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
    await StatusBar.setBackgroundColor({ 
      color: isDark ? '#0f172a' : '#ffffff' 
    });
  } catch { /* Plugin no disponible */ }
}

/**
 * Mostrar/ocultar status bar
 */
export async function toggleStatusBar(show: boolean) {
  if (!isNativePlatform) return;
  
  try {
    if (show) {
      await StatusBar.show();
    } else {
      await StatusBar.hide();
    }
  } catch { /* Plugin no disponible */ }
}

export default {
  initializeNativeApp,
  haptic,
  setStatusBarStyle,
  toggleStatusBar,
  isNativePlatform,
  isAndroid,
  isIOS,
};
