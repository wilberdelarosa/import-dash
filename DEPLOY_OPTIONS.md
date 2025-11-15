# 🚀 Deploy de Función Supabase - Opciones

## Opción 1: Desde el Dashboard (Más Fácil) ⭐

### Paso 1: Ve al Dashboard de Supabase
1. https://app.supabase.com
2. Selecciona tu proyecto
3. Navega a: **Functions** (en el menú izquierdo)

### Paso 2: Crea una Nueva Función
1. Click en **Create a new function**
2. Nombra: `send-sms`
3. Click **Create**

### Paso 3: Copia el Código
1. Abre `supabase/functions/send-sms/index.ts` desde tu proyecto
2. Copia **TODO el contenido**
3. Pega en el editor de Supabase Dashboard
4. Click **Deploy**

### Paso 4: Agrega los Secrets
1. En Supabase Dashboard, ve a: **Project Settings** → **Functions** → **Secrets**
2. Agrega estos 4 secrets (obtén valores de tu Dashboard de Twilio):
   ```
   TWILIO_ACCOUNT_SID = <tu_account_sid>
   TWILIO_AUTH_TOKEN = <tu_auth_token>
   TWILIO_MESSAGING_SERVICE_SID = <tu_messaging_service_sid>
   TWILIO_PHONE_NUMBER = <tu_numero_twilio>
   ```
3. Click **Add Secret** después de cada uno

### ✅ Listo!
Tu función está deployada y lista para usar.

---

## Opción 2: Con Docker (Alternativa)

Si tienes Docker instalado:

```bash
# Descarga la imagen de Supabase CLI en Docker
docker pull supabase/cli:latest

# Desde la carpeta del proyecto
docker run --rm -v ${PWD}:/workspace -w /workspace supabase/cli:latest functions deploy send-sms
```

---

## Opción 3: Con WSL (Windows Subsystem for Linux)

Si tienes WSL2 instalado:

```bash
# Abre WSL
wsl

# Navega a tu proyecto
cd /mnt/c/Users/wilbe/OneDrive/Documentos/ALITO\ MANTENIMIENTO\ APP/V01\ APP\ WEB/import-dash

# Instala Supabase CLI
npm install -g @supabase/cli

# Deploy
supabase functions deploy send-sms
```

---

## 🎯 Recomendación

**Opción 1 (Dashboard)** es la más rápida ahora mismo:
- ✅ 5 minutos máximo
- ✅ No requiere instalaciones
- ✅ Interfaz visual
- ✅ Puedes ver logs en tiempo real
- ✅ No requiere cambios de configuración

**Próximo paso**: Ve a tu Dashboard de Supabase y sigue los pasos de Opción 1 ⬆️
