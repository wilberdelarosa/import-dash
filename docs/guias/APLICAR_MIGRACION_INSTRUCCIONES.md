# 🚀 Instrucciones para Aplicar Migración planes_asignados

## ⚠️ IMPORTANTE
Los errores de TypeScript que estás viendo son **normales** y **esperados** hasta que apliques la migración SQL a tu base de datos Supabase.

## 🎯 Método Recomendado: Aplicación Manual via Dashboard

### Paso 1: Acceder al SQL Editor
1. Abre tu navegador y ve a: https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh/editor
2. Haz clic en **"SQL Editor"** en el menú lateral izquierdo
3. Haz clic en el botón **"New Query"**

### Paso 2: Copiar la Migración SQL
1. Abre el archivo: `supabase\migrations\20241117000000_planes_asignados.sql`
2. Selecciona **TODO** el contenido (Ctrl+A)
3. Copia el contenido (Ctrl+C)

### Paso 3: Ejecutar la Migración
1. Pega el SQL en el editor del Dashboard (Ctrl+V)
2. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)
3. Espera a que aparezca el mensaje "Success"

### Paso 4: Verificar la Creación
En el panel lateral del Dashboard, verifica que se crearon:
- ✅ **Tabla**: `planes_asignados` (en "Database" → "Tables")
- ✅ **Vista**: `planes_asignados_detallados` (en "Database" → "Views")
- ✅ **Función**: `activar_alertas_mantenimiento` (en "Database" → "Functions")

### Paso 5: Regenerar Tipos TypeScript
Abre una terminal en VS Code y ejecuta:

```powershell
npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
```

**Nota**: Este comando puede tardar 10-15 segundos.

### Paso 6: Verificar que los Errores Desaparecieron
1. Los errores de TypeScript en `usePlanesAsignados.ts` deberían desaparecer automáticamente
2. Si persisten, cierra y vuelve a abrir el archivo

### Paso 7: Probar la Aplicación
```powershell
npm run dev
```

Luego:
1. Ve a la sección **Planificador**
2. Asigna un plan de mantenimiento
3. Ve al tab **"Planes Asignados"**
4. Deberías ver la tabla con el plan asignado

---

## 🔧 Método Alternativo: Supabase CLI (Requiere Configuración)

Si prefieres usar la CLI:

### 1. Instalar Supabase CLI (si no lo tienes)
```powershell
npm install -g supabase
```

### 2. Autenticar
```powershell
supabase login
```

### 3. Vincular Proyecto
```powershell
supabase link --project-ref ocsptehtkawcpcgckqeh
```

### 4. Aplicar Migración
```powershell
supabase db push
```

### 5. Regenerar Tipos
```powershell
npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
```

---

## ❓ Solución de Problemas

### "Error: relation planes_asignados does not exist"
→ La migración no se aplicó correctamente. Repite el **Paso 3**.

### "Permission denied for table maintenance_plans"
→ Verifica que la tabla `maintenance_plans` existe en tu base de datos.
→ Si no existe, elimina la línea de FOREIGN KEY del SQL antes de ejecutar.

### Los tipos no se actualizan
1. Cierra VS Code completamente
2. Ejecuta de nuevo el comando de regeneración de tipos
3. Abre VS Code

### Los errores persisten después de regenerar tipos
1. Presiona `Ctrl+Shift+P` en VS Code
2. Ejecuta: "TypeScript: Restart TS Server"

---

## 📊 ¿Qué Crea Esta Migración?

### Tabla `planes_asignados`
Almacena cada plan de mantenimiento asignado con:
- Equipo al que se asigna
- Plan e intervalo (PM1, PM2, etc.)
- Técnico responsable
- Estado (pendiente, en_proceso, completado, vencido)
- Configuración de alertas
- Horas actuales y próximo mantenimiento

### Vista `planes_asignados_detallados`
Consulta optimizada que incluye:
- Todos los datos del plan asignado
- Información del equipo (nombre, modelo, marca)
- Información del plan
- Horas restantes calculadas
- Prioridad automática (0-3)

### Función `activar_alertas_mantenimiento()`
Función automática que:
- Revisa todos los planes pendientes
- Activa alertas cuando quedan pocas horas
- Envía notificaciones (próximamente)

---

## ✅ Checklist Rápido

- [ ] Acceder al Supabase Dashboard
- [ ] Abrir SQL Editor
- [ ] Copiar y ejecutar el SQL de la migración
- [ ] Verificar que se crearon tabla, vista y función
- [ ] Regenerar tipos TypeScript
- [ ] Verificar que los errores desaparecieron
- [ ] Ejecutar `npm run dev`
- [ ] Probar asignar un plan
- [ ] Ver el tab "Planes Asignados"

---

## 🎉 Después de Aplicar la Migración

Una vez completados todos los pasos:

1. ✅ Los 6 errores de TypeScript desaparecerán
2. ✅ El hook `usePlanesAsignados` funcionará correctamente
3. ✅ El componente `PlanesAsignadosTable` mostrará datos reales
4. ✅ Los planes asignados se guardarán en Supabase
5. ✅ Los datos persistirán después de refrescar la página
6. ✅ Las actualizaciones serán en tiempo real

---

**¿Necesitas ayuda?** Ejecuta el script interactivo:
```powershell
.\apply-migration.ps1
```
