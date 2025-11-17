# ✅ Checklist para Recibir SMS - PIN Verification

## 1️⃣ Crear Cuenta en Twilio (10 min)

- [ ] Ir a https://www.twilio.com
- [ ] Hacer click en "Sign Up"
- [ ] Completar formulario (email, nombre, teléfono)
- [ ] Verificar tu número de teléfono via SMS
- [ ] Completar verificación de cuenta

## 2️⃣ Obtener Credenciales de Twilio (5 min)

Una vez dentro del Dashboard:

- [ ] **Account SID**: 
  - Ubicación: Dashboard → Account → Account SID (mostrado en la página principal)
  - Copiar y guardar (parece: `AC1234567890abcdef1234567890abcd`)

- [ ] **Auth Token**:
  - Ubicación: Dashboard → Account → Auth Token (debajo de Account SID)
  - Copiar y guardar (parece: `ab1234567890abcdef1234567890cd`)

- [ ] **Número de Teléfono Twilio**:
  - Ir a: Dashboard → Phone Numbers → Manage → Active Numbers
  - Si no tienes números, click en "Get Your First Twilio Phone Number"
  - Seleccionar país y tipo de número
  - Copiar el número (parece: `+1234567890`)

## 3️⃣ Agregar Secrets en Supabase (10 min)

En tu Dashboard de Supabase:

1. Navega a: **Project Settings** → **Functions** → **Secrets**
   
2. Agrega 3 variables:
   ```
   TWILIO_ACCOUNT_SID = AC1234567890abcdef1234567890abcd
   TWILIO_AUTH_TOKEN = ab1234567890abcdef1234567890cd
   TWILIO_PHONE_NUMBER = +1234567890
   ```

3. Click en "Add Secret" para cada una

## 4️⃣ Deploy de la Función Supabase (5 min)

En tu terminal, desde la raíz del proyecto:

```bash
# Primero instala Supabase CLI si no lo tienes
npm install -g supabase

# Luego deploy la función
supabase functions deploy send-sms
```

Debería mostrar:
```
✓ Function deployed successfully [send-sms]
```

## 5️⃣ Cargar Fondos en Twilio (opcional pero necesario)

- [ ] Ir a: Twilio Dashboard → Account → Billing
- [ ] Agregar método de pago (tarjeta de crédito)
- [ ] Si es cuenta gratis: agregar números de teléfono "verificados" que puedan recibir SMS
  - Ir a: Verified Caller IDs
  - Agregar +18098556302 (tu número destino)
  - Verificar via SMS

## 6️⃣ Probar en Desarrollo

Una vez completado, prueba así:

1. Corre el servidor:
   ```bash
   npm run dev
   ```

2. Ve a http://localhost:5173

3. Haz click en "Registrarse"

4. Completa:
   - Email: `test@example.com`
   - Teléfono: `+18098556302`
   - Contraseña: cualquiera (min 6 caracteres)

5. Haz click en "Enviar PIN"

6. **Deberías recibir un SMS** con el PIN `2510`

7. Ingresa el PIN y click "Verificar PIN y Crear Cuenta"

## 🔧 Troubleshooting

### No recibo SMS
1. Verifica que tu número de teléfono esté verificado en Twilio
2. Si usas Twilio FREE, debes agregar el número en "Verified Caller IDs"
3. Revisa logs en Supabase: Dashboard → Functions → send-sms → Logs

### Error "SMS service not configured"
- Los secrets no se agregaron correctamente
- Revisa que los nombres sean exactos (mayúsculas/minúsculas)

### Error de autenticación
- El TWILIO_AUTH_TOKEN está mal copiado
- Copia nuevamente desde Twilio Dashboard

### Número de Twilio rechazado
- Debe estar en formato internacional: `+1234567890`
- No puede empezar sin el `+`

## 📱 Cuándo Llegarán los SMS

- **En Desarrollo** (npm run dev): Se loguea en consola, NO se envía
- **En Producción** (npm run build + deploy): Se envía realmente via Twilio

## 💰 Costo

- Twilio gratis: $15 de crédito inicial
- Costo por SMS: ~$0.0075 USD (muy barato)
- Si no usas fondos en 34 días, se cancela cuenta

## ✨ Status Actual

✅ Código del sistema implementado
✅ Función Supabase lista (en `supabase/functions/send-sms/`)
✅ Hook `useSMSService` listo
❌ **Falta**: Configurar Twilio + agregar Secrets a Supabase + Deploy función

---

**Tiempo total estimado**: 30-45 minutos

**Orden recomendado**:
1. Twilio signup + obtener credenciales (15 min)
2. Agregar Secrets en Supabase (10 min)
3. Deploy función (5 min)
4. Cargar fondos/verificar número (10 min)
5. Probar (5 min)
