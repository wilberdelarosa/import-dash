import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alito.mantenimiento',
  appName: 'Alito Mantenimiento',
  webDir: 'dist',
  
  // Configuración de servidor
  server: {
    // Habilitar HTTPS en desarrollo
    androidScheme: 'https',
    // Permitir navegación clara
    cleartext: false,
  },
  
  // Plugins nativos
  plugins: {
    // Splash Screen mejorado
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0f172a', // slate-900
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'large',
      spinnerColor: '#6366f1', // indigo-500
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    // Status Bar
    StatusBar: {
      style: 'DARK', // Para fondo claro
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    
    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    
    // Haptics para feedback táctil
    Haptics: {
      selectionDuration: 3,
    },
  },
  
  // Configuración Android específica
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Transiciones suaves
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
