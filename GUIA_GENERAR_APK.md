# 📱 Guía para Generar tu APK Android

¡Ya casi tienes tu App lista! He configurado todo el proyecto con **Capacitor** y plugins nativos para una experiencia pulida.

## ✨ Características de la App Android

La app incluye:
- 🎨 **Tema oscuro nativo** con colores de la marca (indigo/slate)
- 🚀 **Splash screen animado** con el logo de Alito
- 📱 **Status bar personalizado** que se adapta al tema
- 🔔 **Vibración háptica** para feedback táctil
- ⌨️ **Teclado optimizado** que no cubre el contenido
- 🔒 **Edge-to-edge** para aprovechar toda la pantalla
- 🌙 **Soporte para modo claro/oscuro** automático

## 🛠️ Paso 1: Instalar Android Studio

Necesitas el software oficial de Google para compilar apps Android.

1.  **Descarga Android Studio**: [https://developer.android.com/studio](https://developer.android.com/studio)
2.  **Instálalo**: Sigue las instrucciones del instalador. Asegúrate de marcar la opción **"Android SDK"** y **"Android SDK Platform-Tools"** durante la instalación.
3.  **Ábrelo**: Una vez instalado, abre Android Studio y deja que termine de configurar cualquier componente adicional que pida.

## 🚀 Paso 2: Abrir tu Proyecto

1.  En Android Studio, selecciona **"Open"** (Abrir proyecto).
2.  Navega hasta la carpeta de tu proyecto:
    `C:\Users\wilbe\OneDrive\Documentos\ALITO MANTENIMIENTO APP\V01 APP WEB\import-dash\android`
3.  Selecciona la carpeta `android` y dale a **OK**.
4.  Espera a que Android Studio sincronice el proyecto (puede tardar unos minutos descargando cosas).

## 📦 Paso 3: Generar el APK

### Opción A: APK de Debug (para pruebas)
1.  En el menú superior, ve a **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2.  Android Studio comenzará a compilar. Verás una barra de progreso abajo a la derecha.
3.  Cuando termine, aparecerá una notificación: *"APK(s) generated successfully"*.
4.  Haz clic en **"locate"** en esa notificación.
5.  ¡Listo! Ahí verás un archivo llamado `app-debug.apk`.

### Opción B: APK de Release (para producción)
1.  Ve a **Build** > **Generate Signed Bundle / APK...**
2.  Selecciona **APK** y dale Next
3.  Crea un nuevo keystore (o usa uno existente)
4.  Completa los datos del keystore
5.  Selecciona **release** y marca **V1 + V2 signature**
6.  El APK estará en `android/app/release/app-release.apk`

## 📲 Paso 4: Instalar en tu Celular

1.  Envía ese archivo `app-debug.apk` (o `app-release.apk`) a tu celular (por WhatsApp, USB, Drive, etc.).
2.  En tu celular, abre el archivo.
3.  Te pedirá permiso para instalar aplicaciones desconocidas (si es la primera vez). Acepta.
4.  ¡Disfruta de tu App **Alito Mantenimiento**!

---

## 🔄 ¿Hiciste cambios en la web y quieres actualizar la App?

Si modificas algo en tu código React/Vite en el futuro, solo ejecuta estos comandos en tu terminal (en la carpeta del proyecto):

```bash
npm run build
npx cap sync
```

Luego repite el **Paso 3** en Android Studio para generar el nuevo APK.

---

## 🔧 Plugins Instalados

| Plugin | Descripción |
|--------|-------------|
| `@capacitor/status-bar` | Control del status bar |
| `@capacitor/splash-screen` | Splash screen animado |
| `@capacitor/keyboard` | Manejo del teclado |
| `@capacitor/haptics` | Vibración háptica |

## 📁 Archivos Importantes

```
android/
├── app/src/main/
│   ├── java/.../MainActivity.java   # Configuración edge-to-edge
│   └── res/
│       ├── values/
│       │   ├── colors.xml           # Colores de la app
│       │   └── styles.xml           # Temas claro/oscuro
│       ├── values-night/            # Tema nocturno
│       └── values-v31/              # Android 12+ (Material You)
└── capacitor.config.ts              # Configuración de plugins
