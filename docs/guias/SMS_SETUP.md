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

### 3. Configurar en Supabase

#### 3.1 Agregar secretos en Supabase Functions
1. Ve al Dashboard de Supabase
2. Navega a `Functions` > `send-sms` > `Settings`
3. Agrega los siguientes secretos:
   - `TWILIO_ACCOUNT_SID`: Tu Account SID
   - `TWILIO_AUTH_TOKEN`: Tu Auth Token
   - `TWILIO_PHONE_NUMBER`: Tu número de Twilio (+1234567890)

#### 3.2 Deploy de la función
```bash
cd supabase/functions/send-sms
supabase functions deploy send-sms
```

### 4. Configurar variables de entorno locales

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Estructura del Proyecto

```
supabase/
├── functions/
│   └── send-sms/
│       ├── index.ts        # Función para enviar SMS con Twilio
│       └── deno.json       # Configuración de Deno
src/
├── hooks/
│   └── useSMSService.ts    # Hook para usar el servicio de SMS
└── pages/
    └── Auth.tsx            # Página de autenticación con verificación PIN
```

## Flujo de Registro

1. Usuario ingresa Email y Teléfono
2. Sistema envía SMS con PIN a su número usando Supabase Function + Twilio
3. Usuario ingresa el PIN recibido
4. Si es correcto, puede crear su contraseña
5. Cuenta se crea automáticamente

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

## Desarrollo Local

En modo desarrollo, los SMS se loguean en la consola:
```
📱 SMS enviado a +18098556302: Tu PIN de registro en ALITO es: 2510...
```

**No se requiere Twilio configurado** para desarrollar localmente.

## Integración con Supabase Functions

### Hook: `useSMSService`

```typescript
import { useSMSService } from '@/hooks/useSMSService'

const { sendSMS } = useSMSService()

// Enviar SMS
const result = await sendSMS({
  phoneNumber: '+18098556302',
  message: 'Tu PIN de registro es: 2510'
})

if (result.success) {
  console.log('SMS enviado:', result.messageId)
} else {
  console.error('Error:', result.error)
}
```

### Función: `send-sms`

Ubicación: `supabase/functions/send-sms/index.ts`

Hace peticiones a la API de Twilio y retorna el ID del mensaje.

## Seguridad

⚠️ **Importante:**
- Nunca expongas `TWILIO_AUTH_TOKEN` en el cliente
- Los secretos se almacenan en Supabase Functions
- El PIN debe validarse en el cliente (estado local)
- Implementar límite de intentos (max 3 intentos) - TODO
- Implementar expiración de PIN (5 minutos) - TODO

## Deployment

### Producción en Vercel/Netlify

1. Agrega variables de entorno:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Despliega la función Supabase:
   ```bash
   supabase functions deploy send-sms
   ```

3. Despliega la app:
   ```bash
   npm run build
   # Deploy dist/ folder
   ```

## Troubleshooting

### SMS no se envía en producción
1. Verifica que los secretos de Supabase estén correctos
2. Comprueba los logs en Supabase Dashboard > Functions
3. Verifica que tu cuenta Twilio tenga fondos

### El número de Twilio no funciona
- Asegúrate de haber comprado el número en Twilio
- Verifica el formato: `+1234567890`
- Comprueba que el número esté activo en Twilio Console

### Error de autenticación
- Verifica que `VITE_SUPABASE_ANON_KEY` sea correcta
- Comprueba que el usuario esté autenticado (para RLS)

## Testing

Para probar sin Twilio:
1. El sistema en desarrollo simula el envío
2. USA EL PIN: `2510`
3. Verifica la consola del navegador

## Próximos Pasos

- [ ] Configurar secretos en Supabase Dashboard
- [ ] Deploy de send-sms function
- [ ] Test con Twilio real
- [ ] Agregar rate limiting para intentos de PIN
- [ ] Implementar expiración de PIN (5 minutos)
- [ ] Agregar reintentos de SMS
- [ ] Implementar OTP dinámico (en lugar de PIN fijo)
- [ ] Agregar WhatsApp como alternativa de SMS

