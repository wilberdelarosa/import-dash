# Aplicar Migración del Sistema de Planificación

## ✅ Estado Actual

Se ha creado:
1. **Migración SQL completa**: `supabase/migrations/20251117120000_complete_planificacion_system.sql`
   - Tabla `alertas_mantenimiento` (alertas configurables)
   - Tabla `equipos_planes_auto` (asociación automática modelo → plan)
   - Mejoras a `planificaciones_mantenimiento` (técnico, horas_alerta)
   - Vista materializada `equipos_con_planes_sugeridos`
   - Función `get_equipos_requieren_alerta()`
   - Triggers automáticos
   - Índices de rendimiento
   - Políticas RLS

2. **Hook TypeScript**: `src/hooks/usePlanificacion.ts` (✅ compilado)
   - CRUD completo para planificaciones
   - CRUD completo para alertas
   - Asociación/desasociación de planes a modelos
   - Optimistic updates
   - Real-time subscriptions
   - Toast notifications

3. **Tipos TypeScript**: `src/types/planificacion.ts` (✅ sin errores)

## 🚀 Opciones para Aplicar la Migración

### Opción 1: Supabase CLI (Recomendado)

Si tienes Supabase CLI configurado:

```powershell
# Navegar al directorio del proyecto
cd "c:\Users\wilbe\OneDrive\Documentos\ALITO MANTENIMIENTO APP\V01 APP WEB\import-dash"

# Aplicar todas las migraciones pendientes
npx supabase db push
```

### Opción 2: Supabase Dashboard (Manual)

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a **SQL Editor**
3. Abre el archivo `supabase/migrations/20251117120000_complete_planificacion_system.sql`
4. Copia todo el contenido
5. Pégalo en el editor SQL
6. Click en **Run** (o Ctrl+Enter)

### Opción 3: Desde este proyecto

Si prefieres aplicarlo directamente desde aquí:

```powershell
# Leer las credenciales de Supabase
$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_KEY = $env:VITE_SUPABASE_ANON_KEY  # O service_role para migraciones

# Luego usa el dashboard o CLI
```

## ⚙️ Verificar Aplicación Exitosa

Después de aplicar la migración, verifica con estas queries:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('alertas_mantenimiento', 'equipos_planes_auto');

-- Verificar vista materializada
SELECT * FROM equipos_con_planes_sugeridos LIMIT 1;

-- Verificar función
SELECT proname 
FROM pg_proc 
WHERE proname = 'get_equipos_requieren_alerta';

-- Verificar columnas nuevas en planificaciones
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'planificaciones_mantenimiento'
  AND column_name IN ('tecnico_responsable', 'horas_alerta', 'alerta_enviada', 'fecha_alerta');
```

## 🔄 Próximos Pasos

Una vez aplicada la migración:

1. **Integrar en ControlMantenimientoProfesional**
   - Reemplazar `planesAsignados` state con `usePlanificacion()` hook
   - Cambiar `handleAsignarPlan` para usar `crearPlanificacion()`
   - Actualizar tab "Asignados" para mostrar datos de BD

2. **Mejorar módulo Kits**
   - Añadir búsqueda y filtros
   - Segmentar por categoría de equipo
   - Mostrar planes que usan cada kit

3. **Mejorar módulo Planes**
   - Añadir búsqueda y filtros
   - Mostrar equipos asociados por modelo
   - UI para asociación automática

4. **Implementar sistema de alertas**
   - Componente de notificaciones
   - Polling de `equiposRequierenAlerta`
   - Actualizar `ultima_notificacion`

## 📋 Checklist

- [ ] Migración aplicada sin errores
- [ ] Tablas verificadas (alertas_mantenimiento, equipos_planes_auto)
- [ ] Vista materializada funciona
- [ ] Función RPC ejecutable
- [ ] RLS policies activas
- [ ] Hook usePlanificacion probado
- [ ] ControlMantenimientoProfesional integrado
- [ ] Datos persisten después de refresh

## ⚠️ Notas Importantes

- **Backup**: La migración NO elimina datos existentes
- **RLS**: Las políticas permiten CRUD para usuarios autenticados
- **Índices**: Se crean automáticamente para rendimiento
- **Triggers**: Auto-actualizan la vista materializada
- **Compatibilidad**: Compatible con estructura actual

## 🆘 Troubleshooting

### Error: "relation already exists"
Alguna tabla ya existe. Verifica si ejecutaste la migración previamente:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'alertas_mantenimiento';
```

### Error: "function already exists"
La función ya está creada. Usa `CREATE OR REPLACE FUNCTION` (ya está en la migración).

### Error: Permission denied
Asegúrate de usar la clave `service_role` en lugar de `anon` para ejecutar migraciones.

### Vista materializada no actualiza
Ejecuta manualmente:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY equipos_con_planes_sugeridos;
```

---

**Listo para aplicar**: Todo el código está preparado. Solo falta ejecutar la migración SQL en Supabase.
