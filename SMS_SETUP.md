# Sistema de Verificación PIN por SMS

## Configuración de Twilio

Para habilitar el envío de SMS con Twilio, sigue estos pasos:

### 1. Crear cuenta en Twilio
1. Ve a [twilio.com](https://www.twilio.com)
2. Crea una cuenta gratis o de pago
3. Verifica tu número de teléfono

### 2. Obtener credenciales
- Account SID: Se encuentra en el Dashboard de Twilio
- Auth Token: Se encuentra en el Dashboard de Twilio
- Número de teléfono de Twilio: Compra un número en Twilio

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Backend - Configurar endpoint SMS

Crea un endpoint en tu backend (Supabase Functions o servidor Node):

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Twilio } from "https://deno.land/x/twilio@0.15.0/mod.ts"

const client = new Twilio(
  Deno.env.get("TWILIO_ACCOUNT_SID")!,
  Deno.env.get("TWILIO_AUTH_TOKEN")!
)

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Not allowed", { status: 405 })
  }

  const { phoneNumber, message } = await req.json()

  try {
    const response = await client.messages.create({
      body: message,
      from: Deno.env.get("TWILIO_PHONE_NUMBER")!,
      to: phoneNumber,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: response.sid 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
```

### 5. Configurar variables en Supabase

En el dashboard de Supabase, ve a `Functions` > `Settings` > `Secrets` y agrega:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 6. Actualizar Auth.tsx

El archivo `src/pages/Auth.tsx` ya está listo para usar el hook `useSMSService`:

```typescript
import { useSMSService } from '@/hooks/useSMSService'

const { sendSMS } = useSMSService()

// Enviar SMS
await sendSMS({
  phoneNumber: '+18098556302',
  message: `Tu PIN de registro es: 2510`
})
```

## PIN Configuración

### PIN Actual
```
PIN: 2510
Teléfono destino: +18098556302
```

Para cambiar el PIN, edita en `src/pages/Auth.tsx`:
```typescript
const REGISTRATION_PIN = '2510' // Cambiar aquí
```

## Flujo de Registro

1. Usuario ingresa Email y Teléfono
2. Sistema envía SMS con PIN a su número
3. Usuario ingresa el PIN recibido
4. Si es correcto, puede crear su contraseña
5. Cuenta se crea automáticamente

## Desarrollo Local

En modo desarrollo, los SMS se loguean en la consola:
```
📱 SMS enviado a +18098556302: Tu PIN de registro es: 2510
```

## Seguridad

⚠️ **Importante:**
- Nunca expongas `TWILIO_AUTH_TOKEN` en el cliente
- Siempre usa variables de entorno
- El PIN debe enviarse desde el backend, no desde el cliente
- Implementar límite de intentos (max 3 intentos)
- Implementar expiración de PIN (5 minutos)

## Testing

Para probar sin Twilio:
1. El sistema en desarrollo simula el envío
2. USA EL PIN: `2510`
3. Verifica la consola del navegador

## Próximos Pasos

- [ ] Configurar backend endpoint en Supabase Functions
- [ ] Agregar rate limiting para intentos de PIN
- [ ] Implementar expiración de PIN (5 minutos)
- [ ] Agregar reintentos de SMS
- [ ] Implementar OTP dinámico (en lugar de PIN fijo)
- [ ] Agregar WhatsApp como alternativa de SMS
