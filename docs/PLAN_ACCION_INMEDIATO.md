# 📋 Plan de Acción Inmediato - Planificador Inteligente

**Fecha**: 18 de Noviembre, 2025  
**Estado**: En Ejecución

---

## ✅ Completado

### 1. Logo corregido
- ✅ Eliminado emoji fallback de BrandLogo.tsx
- ✅ Usa solo public/favicon.ico

### 2. Carrusel de Equipos
- ✅ Ya está pulido y funcionando correctamente
- ✅ Animaciones y transiciones optimizadas

### 3. Notificaciones Push
- ✅ Ya configurado con Notification API
- ✅ Hook useNotifications.ts funcional
- ✅ No requiere service worker adicional

### 4. Documentación Completa
- ✅ Especificación técnica creada
- ✅ Diagramas UI/UX diseñados
- ✅ Flujos de usuario documentados

---

## 🔥 Prioridad CRÍTICA - Hacer Ahora

### 1. Crear Migración de Overrides (15 min)
```sql
-- Archivo: supabase/migrations/YYYYMMDDHHMMSS_overrides_planes.sql
CREATE TABLE overrides_planes (
  id BIGSERIAL PRIMARY KEY,
  ficha_equipo VARCHAR NOT NULL,
  plan_original_id BIGINT REFERENCES planes_mantenimiento(id),
  plan_forzado_id BIGINT NOT NULL REFERENCES planes_mantenimiento(id),
  motivo TEXT NOT NULL,
  usuario_email VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_overrides_ficha ON overrides_planes(ficha_equipo);

-- Mejoras a planificaciones_mantenimiento
ALTER TABLE planificaciones_mantenimiento
ADD COLUMN numero_ruta INTEGER,
ADD COLUMN ciclo_numero INTEGER,
ADD COLUMN es_override BOOLEAN DEFAULT false,
ADD COLUMN plan_id BIGINT REFERENCES planes_mantenimiento(id);

CREATE INDEX idx_plan_ruta ON planificaciones_mantenimiento(ficha_equipo, numero_ruta);
```

### 2. Crear Hook useRutasPredictivas (30 min)
**Ubicación**: `src/hooks/useRutasPredictivas.ts`

**Funcionalidad**:
- Generar 8 próximas rutas basadas en plan actual
- Calcular horas objetivo para cada MP
- Detectar ciclos (MP1-MP4 = 1 ciclo completo)
- Guardar rutas en `planificaciones_mantenimiento`

### 3. Crear Hook useOverridesPlanes (20 min)
**Ubicación**: `src/hooks/useOverridesPlanes.ts`

**Funcionalidad**:
- CRUD de overrides
- Verificar si equipo tiene override activo
- Historial de cambios

---

## ⚡ Prioridad ALTA - Esta Semana

### 4. Rediseñar Tab Planificador (4 horas)
**Ubicación**: `src/pages/ControlMantenimientoProfesional.tsx`

**Cambios**:
- Nueva vista con dos paneles:
  - Izquierda: Índice de equipos con filtros
  - Derecha: 8 rutas planificadas
- Panel de sugerencias inteligentes
- Sistema de overrides visuales
- Guardar rutas en BD

### 5. Mejorar Módulo Planes (3 horas)
**Ubicación**: `src/pages/PlanesMantenimiento.tsx`

**Nuevas Features**:
- Tab "Equipos Asociados" con lista completa
- Contador de uso por plan
- Reasignación masiva
- Búsqueda segmentada por marca/modelo

### 6. Mejorar Módulo Kits (2 horas)
**Ubicación**: `src/pages/KitsMantenimiento.tsx`

**Nuevas Features**:
- Agrupación por categoría (Filtros, Lubricantes, etc.)
- Búsqueda con autocomplete
- Badges mostrando "Usado en X planificaciones"
- Vista colapsable de piezas

---

## 📊 Prioridad MEDIA - Próxima Semana

### 7. Sistema de Alertas Inteligentes (2 horas)
- Panel de alertas de proximidad
- "⚠️ Faltan 50h para MP4"
- Integración con NotificacionesCentro
- Notificaciones automáticas

### 8. Documentación de Usuario (1 hora)
- Guía de uso del planificador
- Cómo funcionan los overrides
- Ejemplos prácticos

---

## 🎯 Roadmap Detallado

### Semana 1 (Esta semana)
**Lunes-Martes**:
- [x] Corregir logo ✅
- [x] Documentación completa ✅
- [ ] Crear migración overrides
- [ ] Implementar useRutasPredictivas
- [ ] Implementar useOverridesPlanes

**Miércoles-Jueves**:
- [ ] Rediseñar Tab Planificador (50%)
- [ ] Implementar índice interactivo
- [ ] Panel de sugerencias

**Viernes**:
- [ ] Completar Tab Planificador (100%)
- [ ] Testing básico
- [ ] Fix bugs iniciales

### Semana 2
**Lunes-Martes**:
- [ ] Mejorar Módulo Planes
- [ ] Tab Equipos Asociados
- [ ] Reasignación masiva

**Miércoles**:
- [ ] Mejorar Módulo Kits
- [ ] Agrupación por categoría
- [ ] Búsqueda inteligente

**Jueves-Viernes**:
- [ ] Sistema de Alertas
- [ ] Documentación de usuario
- [ ] Testing completo

---

## 📝 Notas Importantes

### Base de Datos
⚠️ **IMPORTANTE**: Usuario debe aplicar estas migraciones en orden:
1. `20251117120000_complete_planificacion_system.sql` (ya existe)
2. `overrides_planes.sql` (nueva)

### Hooks Existentes
Ya tienes estos hooks funcionando:
- ✅ `usePlanificacion.ts` - CRUD de planificaciones
- ✅ `usePlanes.ts` - CRUD de planes
- ✅ `useKits.ts` - CRUD de kits
- ✅ `useSugerenciaMantenimiento.ts` - Cálculo de MPs

Solo necesitas crear:
- ⏳ `useRutasPredictivas.ts`
- ⏳ `useOverridesPlanes.ts`

### Componentes a Modificar
1. `ControlMantenimientoProfesional.tsx` - Tab Planificador
2. `PlanesMantenimiento.tsx` - Agregar features
3. `KitsMantenimiento.tsx` - Agregar features
4. `NotificacionesCentro.tsx` - Integrar alertas

---

## 🚀 Comando para Empezar

```powershell
# 1. Crear archivo de migración
New-Item "supabase/migrations/$(Get-Date -Format 'yyyyMMddHHmmss')_overrides_planes.sql"

# 2. Copiar SQL de REDISEÑO_COMPLETO_PLANIFICADOR.md

# 3. Aplicar migración
.\scripts\apply-migration-interactive.ps1

# 4. Crear hooks nuevos
New-Item "src/hooks/useRutasPredictivas.ts"
New-Item "src/hooks/useOverridesPlanes.ts"

# 5. Iniciar desarrollo
npm run dev
```

---

## 📞 Soporte

Si tienes dudas sobre:
- **Lógica de negocio**: Ver `REDISEÑO_COMPLETO_PLANIFICADOR.md`
- **Base de datos**: Ver `ESTADO_SISTEMA_PLANIFICACION.md`
- **Hooks existentes**: Ver archivos en `src/hooks/`

---

**Estado**: Plan Activo ✅  
**Progreso**: 30% (Documentación completa)  
**Siguiente paso**: Crear migración de overrides
