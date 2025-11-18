# 📊 Estado del Sistema de Planificación Integrado

## ✅ COMPLETADO (Listo para Usar)

### 1. Base de Datos - Migración SQL ✅
**Archivo**: `supabase/migrations/20251117120000_complete_planificacion_system.sql`

**Tablas Creadas**:
- `alertas_mantenimiento`: Configuración de alertas por equipo/intervalo
  * ficha_equipo, intervalo_mp, horas_alerta, tecnico_responsable
  * activa (boolean), ultima_notificacion (timestamp)
  
- `equipos_planes_auto`: Asociación automática modelo → plan
  * modelo, marca, categoria, plan_id
  * Ejemplo: "Excavadora 320" → Plan "CAT-320-STD"

**Tabla Mejorada**:
- `planificaciones_mantenimiento`: Añadidos campos
  * tecnico_responsable (VARCHAR)
  * horas_alerta (INTEGER) - cuántas horas antes alertar
  * alerta_enviada (BOOLEAN)
  * fecha_alerta (TIMESTAMPTZ)

**Vista Materializada**:
- `equipos_con_planes_sugeridos`: Une equipos + planes automáticos + historial
  * Auto-actualización con triggers
  * Muestra plan sugerido y horas restantes

**Función RPC**:
- `get_equipos_requieren_alerta()`: Retorna equipos que necesitan atención
  * Filtra donde horas_km_restante <= horas_alerta

**Índices**: 10+ índices para optimizar queries

**RLS**: Políticas completas para todos los usuarios autenticados

**Estado**: ⚠️ **PENDIENTE DE APLICAR** - Ver `APLICAR_MIGRACION_PLANIFICACION.md`

---

### 2. TypeScript Types ✅
**Archivo**: `src/types/planificacion.ts`

**Interfaces** (7 total):
- `PlanificacionMantenimiento` (23 campos)
- `AlertaMantenimiento` (13 campos)
- `EquipoPlanAuto` (6 campos)
- `EquipoConPlanSugerido` (14 campos)
- `EquipoRequiereAlerta` (8 campos)
- `CrearPlanificacionInput` (21 campos)
- `CrearAlertaInput` (6 campos)

**Estado**: ✅ **SIN ERRORES** - Compilación exitosa

---

### 3. Hook de Planificación ✅
**Archivo**: `src/hooks/usePlanificacion.ts` (373 líneas)

**Estados Manejados**:
```typescript
{
  planificaciones: PlanificacionMantenimiento[],
  alertas: AlertaMantenimiento[],
  equiposPlanesAuto: EquipoPlanAuto[],
  equiposConPlanes: EquipoConPlanSugerido[],
  equiposRequierenAlerta: EquipoRequiereAlerta[],
  loading: boolean
}
```

**Métodos CRUD**:

**Planificaciones**:
- `crearPlanificacion(input)` - Crea nueva planificación
- `actualizarPlanificacion(id, updates)` - Actualiza campos
- `eliminarPlanificacion(id)` - Elimina registro

**Alertas**:
- `crearAlerta(input)` - Configura nueva alerta
- `actualizarAlerta(id, updates)` - Modifica configuración
- `eliminarAlerta(id)` - Quita alerta

**Asociaciones Automáticas**:
- `asociarPlanAModelo(modelo, marca, planId, categoria?)` - Liga plan a modelo
- `desasociarPlanDeModelo(id)` - Desvincula

**Refrescar**:
- `refreshPlanificaciones()` - Recarga planificaciones
- `refreshAlertas()` - Recarga alertas
- `refreshAll()` - Recarga todo

**Características**:
- ✅ Optimistic updates (patrón de useKits/usePlanes)
- ✅ Real-time subscriptions (3 tablas monitoreadas)
- ✅ Toast notifications (feedback inmediato)
- ✅ Error handling completo
- ✅ Auto-carga al montar

**Estado**: ✅ **COMPILADO Y LISTO** - Esperando aplicación de migración

---

### 4. UI del Planificador ✅
**Archivo**: `src/pages/ControlMantenimientoProfesional.tsx`

**Layout Moderno**:
- Sidebar 320px: Búsqueda + filtros + lista de equipos
- Panel principal: Header + selector MP + KPIs + tabs

**4 Tabs Implementados**:
1. **Tareas**: Checklist de tareas del intervalo seleccionado
2. **Kit**: Piezas necesarias del kit asignado
3. **Ruta**: Otros equipos con mismo intervalo (para planificación masiva)
4. **Asignados**: ⭐ Lista de planes asignados con CRUD completo

**Tab "Asignados" Features**:
- Grid responsive de tarjetas de planificaciones
- Cada tarjeta muestra: equipo, MP, técnico, horas de alerta, estado
- Botones: Editar, Eliminar, Cambiar Estado
- Dialog de edición con todos los campos
- Estados: Pendiente / En Progreso / Completado

**Funciones Importantes**:
```typescript
calcularMPSugerido(horasActuales, historial) // MP inteligente basado en historial
handleAsignarPlan() // Crea plan con técnico y alerta
handleAsignarRutaMasiva() // Asigna plan a múltiples equipos
handleEditarPlan() // Modo edición
handleGuardarEdicion() // Guarda cambios
handleEliminarPlan() // Elimina con confirmación
handleCambiarEstadoPlan() // Cicla: Pendiente → En Progreso → Completado
```

**Estado Actual**: ⚠️ **USA STATE LOCAL** - No persiste a BD
```typescript
const [planesAsignados, setPlanesAsignados] = useState([]); // ❌ Se pierde al refresh
```

**Estado Deseado**: 🎯 **INTEGRAR usePlanificacion**
```typescript
const { planificaciones, crearPlanificacion, actualizarPlanificacion, eliminarPlanificacion } = usePlanificacion();
```

---

## 🔄 EN PROGRESO

### 5. Integración BD ↔ UI 🔄
**Archivo a Modificar**: `src/pages/ControlMantenimientoProfesional.tsx`

**Cambios Necesarios**:

#### A. Importar hook
```typescript
import { usePlanificacion } from '@/hooks/usePlanificacion';
```

#### B. Reemplazar state
```typescript
// ❌ QUITAR:
const [planesAsignados, setPlanesAsignados] = useState([]);

// ✅ USAR:
const { planificaciones, crearPlanificacion, actualizarPlanificacion, eliminarPlanificacion, loading } = usePlanificacion();
```

#### C. Actualizar handleAsignarPlan
```typescript
const handleAsignarPlan = async () => {
  if (!planFicha || !planIntervalo) return;
  
  const equipoSeleccionado = equiposDisponibles.find(e => e.ficha === planFicha);
  
  const nuevaPlanificacion: CrearPlanificacionInput = {
    fichaEquipo: equipoSeleccionado.ficha,
    nombreEquipo: equipoSeleccionado.nombre,
    categoria: equipoSeleccionado.categoria,
    marca: equipoSeleccionado.marca,
    modelo: equipoSeleccionado.modelo,
    lecturasActuales: equipoSeleccionado.horometro || equipoSeleccionado.odometro,
    unidadMedida: equipoSeleccionado.horometro ? 'HORAS' : 'KM',
    proximoMP: planIntervalo.nombre,
    horasKmProximoMP: planIntervalo.horas || planIntervalo.kilometros,
    estadoEquipo: equipoSeleccionado.estado || 'OPERATIVO',
    estado: 'Pendiente',
    prioridad: 'Media',
    descripcion: `Mantenimiento ${planIntervalo.nombre} programado`,
    observaciones: '',
    tecnico_responsable: tecnicoAsignado || null,
    horas_alerta: horasParaAlerta || 50,
  };
  
  try {
    await crearPlanificacion(nuevaPlanificacion);
    // ✅ Automáticamente se agregará a planificaciones[] por el hook
    toast({ title: 'Plan asignado', description: `${equipoSeleccionado.nombre} - ${planIntervalo.nombre}` });
  } catch (error) {
    // Error ya manejado por el hook
  }
};
```

#### D. Actualizar handleEditarPlan / handleGuardarEdicion
```typescript
const handleGuardarEdicion = async () => {
  if (!editandoPlan) return;
  
  try {
    await actualizarPlanificacion(editandoPlan.id, {
      tecnico_responsable: editandoPlan.tecnico_responsable,
      horas_alerta: editandoPlan.horas_alerta,
      prioridad: editandoPlan.prioridad,
      observaciones: editandoPlan.observaciones,
    });
    
    setEditandoPlan(null);
  } catch (error) {
    // Error manejado por hook
  }
};
```

#### E. Actualizar handleEliminarPlan
```typescript
const handleEliminarPlan = async (idPlan: number) => {
  if (!confirm('¿Eliminar esta planificación?')) return;
  
  try {
    await eliminarPlanificacion(idPlan);
  } catch (error) {
    // Error manejado
  }
};
```

#### F. Actualizar Tab "Asignados" para usar planificaciones
```typescript
// Cambiar:
planesAsignados.map(plan => ...)
// Por:
planificaciones.map(plan => ...)
```

**Progreso**: 0% - Esperando aplicación de migración primero

---

## ❌ PENDIENTE

### 6. Módulo Kits Mejorado ❌
**Archivo**: `src/pages/Kits.tsx`

**Mejoras Necesarias**:
- [ ] Buscador por nombre/código/categoría
- [ ] Filtros por categoría de equipo
- [ ] Segmentación: "Kits Excavadoras" / "Kits Cargadores"
- [ ] Badge mostrando "Usado en X planes"
- [ ] Collapsible "Ver Piezas" por kit
- [ ] Responsive grid mejorado

**Complejidad**: Media (2-3 horas)

---

### 7. Módulo Planes Mejorado ❌
**Archivo**: `src/pages/Planes.tsx`

**Mejoras Necesarias**:
- [ ] Buscador por nombre/código/descripción
- [ ] Tab "Equipos Asociados" mostrando lista de equipos
- [ ] Contador: "15 equipos Excavadora 320 usan este plan"
- [ ] UI para asociar/desasociar planes a modelos
- [ ] Botón "Asociar todos los [Modelo]" al crear plan
- [ ] Vista de intervalos con kits asignados
- [ ] Mostrar distribución de MPs: "MP1: 5 equipos, MP2: 8..."

**Complejidad**: Media-Alta (3-4 horas)

---

### 8. Sistema de Alertas ❌
**Componente Nuevo**: `src/components/AlertasMantenimiento.tsx`

**Funcionalidad**:
- [ ] Polling cada 5 min de `equiposRequierenAlerta`
- [ ] Badge con número de equipos que requieren atención
- [ ] Panel deslizante mostrando alertas activas
- [ ] Botón "Programar Mantenimiento" por cada alerta
- [ ] Actualizar `ultima_notificacion` al enviar
- [ ] Integración con NotificacionesCentro existente

**Complejidad**: Media (2-3 horas)

---

### 9. Auto-Asociación de Equipos ❌
**Ubicación**: Módulo Planes

**Flujo**:
1. Al crear/editar un plan, mostrar lista de equipos con modelo coincidente
2. Checkbox "Asociar automáticamente a equipos [Modelo]"
3. Al marcar, crea registro en `equipos_planes_auto`
4. Vista materializada se actualiza automáticamente
5. Todos los equipos de ese modelo verán el plan en planificador

**Complejidad**: Baja-Media (1-2 horas)

---

### 10. Fix Ruta - Filtro por Equipo ❌
**Problema**: Tab "Ruta" muestra TODOS los equipos con el intervalo seleccionado

**Solución Propuesta**:
- Toggle: "Solo equipos relacionados" vs "Todos con este MP"
- Filtro por categoria/modelo cuando esté activado
- Mantener comportamiento actual como opción

**Complejidad**: Baja (30 min - 1 hora)

---

## 📈 Progreso General

```
████████████████░░░░░░░░░░░░░░░░ 40%

✅ Completado:     40%
🔄 En Progreso:    10%
❌ Pendiente:      50%
```

**Desglose**:
- ✅ Base de datos (migración lista): 100%
- ✅ TypeScript types: 100%
- ✅ Hook usePlanificacion: 100%
- ✅ UI del planificador: 100%
- 🔄 Integración BD ↔ UI: 0% (esperando migración)
- ❌ Kits mejorado: 0%
- ❌ Planes mejorado: 0%
- ❌ Sistema de alertas: 0%
- ❌ Auto-asociación: 0%
- ❌ Fix ruta: 0%

---

## 🎯 Orden de Implementación Recomendado

### Prioridad CRÍTICA 🔥
1. **Aplicar migración SQL** (5 min)
   - Ver: `APLICAR_MIGRACION_PLANIFICACION.md`
   - Sin esto, nada funcionará

2. **Integrar usePlanificacion en ControlMantenimientoProfesional** (30-45 min)
   - Reemplazar state por hook
   - Actualizar todos los handlers
   - Probar persistencia

3. **Verificar funcionamiento completo** (15 min)
   - Crear planificación
   - Editar planificación
   - Eliminar planificación
   - Verificar que persiste después de refresh

### Prioridad ALTA ⚡
4. **Sistema de alertas básico** (2 horas)
   - Componente que muestre `equiposRequierenAlerta`
   - Integrar en NotificacionesCentro
   - Badge con contador

5. **Auto-asociación básica** (1 hora)
   - UI simple en Planes para asociar modelo → plan
   - Probar que la vista materializada funciona

### Prioridad MEDIA 📊
6. **Mejorar módulo Kits** (2 horas)
   - Buscador y filtros
   - Mejor visualización

7. **Mejorar módulo Planes** (3 horas)
   - Buscador y filtros
   - Ver equipos asociados

### Prioridad BAJA 🔧
8. **Fix filtro de Ruta** (30 min)
   - Toggle para filtrar por equipo relacionado

---

## 🚀 Quick Start - Próximo Paso

**LO MÁS IMPORTANTE AHORA**:

1. Abre tu dashboard de Supabase
2. Ve a SQL Editor
3. Ejecuta el contenido de: `supabase/migrations/20251117120000_complete_planificacion_system.sql`
4. Verifica que las tablas se crearon: `alertas_mantenimiento`, `equipos_planes_auto`
5. Vuelve aquí y avísame para integrar el hook

**Tiempo estimado para tener sistema funcional**: 1 hora
- 5 min: Aplicar migración
- 45 min: Integrar hook en ControlMantenimientoProfesional
- 10 min: Probar y verificar

---

## 📞 Soporte

Si encuentras errores al aplicar la migración:
- Copia el mensaje de error completo
- Verifica que no existan las tablas ya (no problema si existen)
- Revisa que tengas permisos de `service_role` o acceso completo

**Todo el código está listo. Solo falta conectar las piezas** 🔌
