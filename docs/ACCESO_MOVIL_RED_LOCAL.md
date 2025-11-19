# 📱 Acceso desde Dispositivos Móviles

## 🌐 Tu Configuración de Red

**IP Local**: `192.168.252.1`  
**Puerto**: `8080`

---

## 🚀 Inicio Rápido

### 1. Inicia el servidor
```powershell
npm run dev
```

### 2. Accede desde tu móvil

**URL**: `http://192.168.252.1:8080`

**Requisito**: Tu móvil debe estar conectado a la **misma red Wi-Fi** que tu PC.

---

## 📱 Diferentes Formas de Acceso

### Opción 1: URL Directa
En el navegador de tu móvil (Chrome, Safari), escribe:
```
http://192.168.252.1:8080
```

### Opción 2: Código QR
Genera un QR con esta URL usando:
- [QR Code Generator](https://www.qr-code-generator.com/)
- O en terminal: `qrencode -t ANSIUTF8 "http://192.168.252.1:8080"`

Escanea el QR con tu cámara del móvil.

### Opción 3: Enviar por WhatsApp
Envíate a ti mismo: `http://192.168.252.1:8080`

---

## ✅ Checklist de Verificación

- [ ] Servidor corriendo (`npm run dev`)
- [ ] PC y móvil en la **misma red Wi-Fi**
- [ ] URL correcta: `http://192.168.252.1:8080` (con `http://`, NO `https://`)
- [ ] Firewall de Windows permite puerto 8080

---

## 🔥 Solución de Problemas

### ❌ "No se puede acceder a este sitio"

**Causa**: Firewall bloqueando puerto 8080

**Solución**: Ejecuta en PowerShell como **administrador**:
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### ❌ "Página no carga" / "Tarda mucho"

**Verifica**:
1. ¿Servidor corriendo? Checa terminal con `npm run dev`
2. ¿Misma red Wi-Fi? Verifica en configuración del móvil
3. ¿IP correcta? Ejecuta en PowerShell:
   ```powershell
   ipconfig | findstr "IPv4"
   ```

### ❌ "Advertencia de seguridad"

**Normal**: Es una conexión HTTP local (no HTTPS)

**Acción**: Acepta y continúa. Es seguro en tu red local.

---

## 🌍 URLs de Acceso

| Dispositivo | URL |
|------------|-----|
| **Tu PC** | `http://localhost:8080` |
| **Móvil en red local** | `http://192.168.252.1:8080` |
| **Tablet en red local** | `http://192.168.252.1:8080` |

---

## 🔄 Si Cambias de Red Wi-Fi

Tu IP puede cambiar. Para obtener la nueva IP:

```powershell
# Ejecuta en PowerShell
ipconfig | findstr "IPv4"
```

Busca la IP que empiece con `192.168.*` o `10.*`

Actualiza la URL: `http://[NUEVA_IP]:8080`

---

## 🎯 Alternativa: Usar ngrok (Acceso desde Internet)

Si necesitas acceder desde fuera de tu red local:

### 1. Instala ngrok
```powershell
choco install ngrok
# O descarga desde https://ngrok.com/download
```

### 2. Inicia tu servidor
```powershell
npm run dev
```

### 3. Expone con ngrok
```powershell
ngrok http 8080
```

### 4. Usa la URL pública
ngrok te dará una URL como: `https://abc123.ngrok.io`

Esta URL funciona desde **cualquier lugar del mundo**.

---

## 📊 Comparación de Métodos

| Método | Velocidad | Seguridad | Requiere Internet | Complejidad |
|--------|-----------|-----------|-------------------|-------------|
| **Red Local** | ⚡ Rápido | 🔒 Seguro | ❌ No | ✅ Fácil |
| **ngrok** | 🐢 Más lento | ⚠️ Público | ✅ Sí | 🔧 Media |

**Recomendación**: Usa **red local** para testing. Es más rápido y seguro.

---

## 🎨 Testing Recomendado

Una vez accediendo desde móvil:

1. **Abre Chrome DevTools en PC** (para ver logs)
2. **Navega en móvil** por los módulos
3. **Sigue checklist** en `GUIA_TESTING_MOVIL.md`

---

## 💡 Tips

### Mantén la Pantalla Activa
En móvil, ajusta tiempo de espera de pantalla para que no se apague durante testing.

### Usa Remote Debugging
En Chrome móvil:
1. Conecta móvil a PC por USB
2. En PC: `chrome://inspect`
3. Verás tu móvil y podrás inspeccionar

### Guarda la URL en Favoritos
Agrega `http://192.168.252.1:8080` a marcadores de tu móvil para acceso rápido.

---

## 🚨 Seguridad

**IMPORTANTE**: Esta configuración es **solo para desarrollo**.

- ❌ NO expongas esta URL a Internet sin protección
- ❌ NO uses en producción
- ✅ Solo para testing en red local confiable

Para producción, usa un servicio de hosting profesional (Vercel, Netlify, etc.)

---

## 📞 Comando Rápido

Guarda este comando para obtener tu IP rápidamente:

```powershell
# Crear alias
Set-Alias -Name myip -Value { (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress }

# Usar
myip
```

---

**Última actualización**: 19 de noviembre, 2025  
**Puerto configurado**: 8080 (en `vite.config.ts`)  
**Host configurado**: `::` (acepta conexiones externas)
