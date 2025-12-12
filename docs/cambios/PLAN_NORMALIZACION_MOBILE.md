# 📋 Plan de Normalización Mobile - ALITO Mantenimiento

> **Versión:** 1.0  
> **Fecha:** 12 de Diciembre, 2025  
> **Referencia:** `SupervisorDashboard.tsx` - El diseño óptimo

---

## 📊 Resumen Ejecutivo

Se analizaron **11 componentes móviles** y se identificaron inconsistencias significativas en el diseño. Este documento detalla todos los cambios necesarios para normalizar la experiencia móvil.

### Estadísticas de Inconsistencias

| Problema | Archivos Afectados | Prioridad |
|----------|-------------------|-----------|
| Falta `showBottomNav={true}` | 6/11 (55%) | 🔴 Alta |
| Sin `tabular-nums` en badges | 9/11 (82%) | 🔴 Alta |
| Formateo de números inconsistente | 7/11 (64%) | 🔴 Alta |
| Falta `min-w-0` en flex containers | 3/11 (27%) | 🟡 Media |
| Tabs sin altura fija | 1/11 (9%) | 🟡 Media |
| Padding-bottom inconsistente | 5/11 (45%) | 🟢 Baja |

---

## 🎯 Patrones de Referencia (SupervisorDashboard.tsx)

### 1. Layout Base
```tsx
<MobileLayout title="Título" showBottomNav={true}>
  <div className="space-y-3">
    {/* Contenido sin pb-XX - MobileLayout maneja el espacio */}
  </div>
</MobileLayout>
```

### 2. Formateo de Números
```tsx
const formatNumber = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return '0';

  const abs = Math.abs(numberValue);
  const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
  
  return rounded.toLocaleString('es-ES', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
  });
};
```

### 3. Badges Numéricos
```tsx
<Badge className="h-5 px-2 py-0.5 text-[10px] leading-none font-medium max-w-[110px] truncate tabular-nums bg-{color}/10 text-{color} border-{color}/20">
  {formatNumber(value)}h
</Badge>
```

### 4. Contenedor Flex con Truncate
```tsx
<div className="flex items-center gap-2 min-w-0">
  <Icon className="h-4 w-4 flex-shrink-0" />
  <div className="min-w-0">
    <p className="text-sm font-medium truncate">{texto}</p>
  </div>
</div>
```

### 5. Tabs con Altura Fija
```tsx
<TabsContent value="tab1" className="mt-0">
  <div className="h-[200px] overflow-y-auto space-y-2">
    {/* Items */}
  </div>
</TabsContent>
```

### 6. Items de Lista (Row)
```tsx
<div className={cn(
  "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
  "border-{color}/30 bg-{color}/5 active:bg-{color}/10",
  "animate-in slide-in-from-left-2"
)} style={{ animationDelay: `${index * 0.03}s` }}>
  {/* Lado izquierdo - min-w-0 */}
  <div className="flex items-center gap-2 min-w-0">...</div>
  {/* Lado derecho - shrink-0 */}
  <div className="flex items-center gap-1.5 shrink-0">...</div>
</div>
```

---

## ✅ CHECKLIST DE CAMBIOS POR ARCHIVO

### 📁 1. DashboardMobile.tsx
**Estado actual:** ⚠️ Múltiples inconsistencias

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 1.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 1.2 | Agregar `tabular-nums` a badges de estadísticas | 🔴 Alta | ⬜ |
| 1.3 | Crear/usar función `formatNumber` centralizada | 🔴 Alta | ⬜ |
| 1.4 | Agregar `max-w-[110px] truncate` a badges de vencidos | 🟡 Media | ⬜ |
| 1.5 | Revisar padding-bottom (actualmente pb-20) | 🟢 Baja | ⬜ |

**Código actual problemático:**
```tsx
// ❌ Sin showBottomNav
<MobileLayout title="Dashboard">

// ❌ Badge sin tabular-nums
<Badge variant="destructive">{item.horasKmRestante}h</Badge>

// ❌ Formateo con Math.round simple
Math.round(value)
```

---

### 📁 2. MechanicDashboard.tsx
**Estado actual:** ⚠️ Parcialmente correcto

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 2.1 | Ya tiene `showBottomNav={true}` ✅ | - | ✅ |
| 2.2 | Agregar `tabular-nums` a badges de estadísticas | 🔴 Alta | ⬜ |
| 2.3 | Crear función `formatNumber` para stats | 🔴 Alta | ⬜ |
| 2.4 | Agregar altura controlada a lista de historial reciente | 🟡 Media | ⬜ |

---

### 📁 3. EquiposMobile.tsx
**Estado actual:** ⚠️ Varias inconsistencias

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 3.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 3.2 | Agregar `min-w-0` a contenedores flex de items | 🟡 Media | ⬜ |
| 3.3 | Agregar `tabular-nums` a badge de filtros activos | 🟡 Media | ⬜ |
| 3.4 | Cambiar pb-24 a pb-20 para consistencia | 🟢 Baja | ⬜ |

**Código actual problemático:**
```tsx
// ❌ Sin min-w-0
<div className="flex items-center gap-2">
  <p className="truncate">{nombre}</p>  // truncate no funciona bien sin min-w-0
</div>
```

---

### 📁 4. MantenimientoMobile.tsx
**Estado actual:** ⚠️ Parcialmente correcto

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 4.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 4.2 | Unificar formateo con función `formatNumber` | 🔴 Alta | ⬜ |
| 4.3 | Agregar `tabular-nums` a todos los badges numéricos | 🔴 Alta | ⬜ |
| 4.4 | Agregar `min-w-0` donde falte | 🟡 Media | ⬜ |
| 4.5 | Cambiar pb-28 a pb-20 | 🟢 Baja | ⬜ |

---

### 📁 5. InventarioMobile.tsx
**Estado actual:** ⚠️ Varias inconsistencias

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 5.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 5.2 | Formatear valores de stock con `toLocaleString('es-ES')` | 🔴 Alta | ⬜ |
| 5.3 | Agregar `tabular-nums` a badges de cantidad | 🔴 Alta | ⬜ |
| 5.4 | Agregar `min-w-0` a contenedores flex | 🟡 Media | ⬜ |
| 5.5 | Cambiar pb-24 a pb-20 | 🟢 Baja | ⬜ |

---

### 📁 6. HistorialMobile.tsx
**Estado actual:** ⚠️ Tabs sin altura fija

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 6.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 6.2 | Agregar `h-[200px]` a TabsContent | 🔴 Alta | ⬜ |
| 6.3 | Agregar `tabular-nums` a badges de estadísticas | 🔴 Alta | ⬜ |
| 6.4 | Formatear métricas con `toLocaleString('es-ES')` | 🟡 Media | ⬜ |

**Código actual problemático:**
```tsx
// ❌ Tabs sin altura fija
<TabsContent value="timeline" className="mt-4 space-y-4">
  {/* Contenido sin altura controlada */}
</TabsContent>
```

**Código corregido:**
```tsx
// ✅ Tabs con altura fija
<TabsContent value="timeline" className="mt-0">
  <div className="h-[200px] overflow-y-auto space-y-4">
    {/* Contenido con altura controlada */}
  </div>
</TabsContent>
```

---

### 📁 7. ReportesMobile.tsx
**Estado actual:** ⚠️ Varias inconsistencias

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 7.1 | Agregar `showBottomNav={true}` a MobileLayout | 🔴 Alta | ⬜ |
| 7.2 | Cambiar `toFixed(0)` por `formatNumber` con locale | 🔴 Alta | ⬜ |
| 7.3 | Agregar `tabular-nums` a badges de horas | 🔴 Alta | ⬜ |
| 7.4 | Cambiar pb-24 a pb-20 | 🟢 Baja | ⬜ |

---

### 📁 8. NotificacionesMobile.tsx
**Estado actual:** ⚠️ Parcialmente correcto

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 8.1 | Ya tiene `showBottomNav={true}` ✅ | - | ✅ |
| 8.2 | Agregar `tabular-nums` a badges de conteo | 🔴 Alta | ⬜ |
| 8.3 | Formatear stats con `toLocaleString('es-ES')` | 🟡 Media | ⬜ |

---

### 📁 9. MechanicPendingList.tsx
**Estado actual:** ✅ Casi perfecto

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 9.1 | Ya tiene `showBottomNav={true}` ✅ | - | ✅ |
| 9.2 | Ya tiene `tabular-nums` ✅ | - | ✅ |
| 9.3 | Ya tiene `formatHours()` ✅ | - | ✅ |
| 9.4 | Cambiar `pb-4` a `pb-20` | 🔴 Alta | ⬜ |
| 9.5 | Cambiar `max-w-[150px]` a `max-w-[110px]` para consistencia | 🟢 Baja | ⬜ |

---

### 📁 10. MechanicHistory.tsx
**Estado actual:** ✅ Mayormente correcto

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| 10.1 | Ya tiene `showBottomNav={true}` ✅ | - | ✅ |
| 10.2 | Revisar consistencia de `text-[10px]` vs `text-[9px]` | 🟢 Baja | ⬜ |

---

### 📁 11. SupervisorDashboard.tsx ⭐ REFERENCIA
**Estado actual:** ✅ Perfecto - Es la referencia

| # | Cambio | Prioridad | Estado |
|---|--------|-----------|--------|
| - | Ninguno - Este es el modelo a seguir | - | ✅ |

---

## 📊 Resumen de Cambios por Prioridad

### 🔴 ALTA PRIORIDAD (Aplicar primero)

| Archivo | Cambio Principal |
|---------|------------------|
| DashboardMobile.tsx | showBottomNav + tabular-nums + formatNumber |
| EquiposMobile.tsx | showBottomNav |
| MantenimientoMobile.tsx | showBottomNav + tabular-nums |
| InventarioMobile.tsx | showBottomNav + formateo + tabular-nums |
| HistorialMobile.tsx | showBottomNav + altura fija tabs + tabular-nums |
| ReportesMobile.tsx | showBottomNav + formatNumber |
| MechanicPendingList.tsx | Cambiar pb-4 a pb-20 |
| MechanicDashboard.tsx | tabular-nums + formatNumber |
| NotificacionesMobile.tsx | tabular-nums |

**Total cambios alta prioridad:** ~25 modificaciones

### 🟡 MEDIA PRIORIDAD

| Archivo | Cambio |
|---------|--------|
| EquiposMobile.tsx | Agregar min-w-0 |
| MantenimientoMobile.tsx | Agregar min-w-0 |
| InventarioMobile.tsx | Agregar min-w-0 |
| MechanicDashboard.tsx | Altura controlada en historial |
| HistorialMobile.tsx | Formatear métricas |

**Total cambios media prioridad:** ~8 modificaciones

### 🟢 BAJA PRIORIDAD

| Archivo | Cambio |
|---------|--------|
| EquiposMobile.tsx | pb-24 → pb-20 |
| MantenimientoMobile.tsx | pb-28 → pb-20 |
| InventarioMobile.tsx | pb-24 → pb-20 |
| ReportesMobile.tsx | pb-24 → pb-20 |
| MechanicPendingList.tsx | max-w-[150px] → max-w-[110px] |
| MechanicHistory.tsx | text-[9px] → text-[10px] |

**Total cambios baja prioridad:** ~6 modificaciones

---

## 🛠️ Utilidad Centralizada Propuesta

Crear archivo: `src/lib/mobileFormatters.ts`

```tsx
/**
 * Formateadores centralizados para componentes móviles
 * Basados en el patrón de SupervisorDashboard.tsx
 */

export const formatNumber = (value: unknown, suffix: string = ''): string => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return `0${suffix}`;

  const abs = Math.abs(numberValue);
  const rounded = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
  
  const text = rounded.toLocaleString('es-ES', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 1,
  });
  
  return `${text}${suffix}`;
};

export const formatHours = (value: unknown): string => formatNumber(value, 'h');
export const formatKm = (value: unknown): string => formatNumber(value, 'km');
export const formatRemaining = (value: unknown): string => formatNumber(value, 'h');
export const formatStock = (value: unknown): string => formatNumber(value);
```

---

## 📝 Notas Adicionales

### ¿Por qué `showBottomNav={true}` es importante?
- Asegura que el padding inferior sea consistente
- El MobileLayout calcula automáticamente el espacio para la barra de navegación
- Evita que el contenido quede oculto detrás de la navegación

### ¿Por qué `tabular-nums` es importante?
- Los números tienen ancho fijo (monoespaciado)
- Evita que el layout "salte" cuando los valores cambian
- Mejora la legibilidad y alineación visual

### ¿Por qué altura fija en Tabs (`h-[200px]`)?
- Evita el "layout shift" al cambiar de tab
- El contenido mantiene su posición
- Mejor experiencia de usuario al navegar

### ¿Por qué `min-w-0` con `truncate`?
- Flexbox por defecto no permite que los hijos se encojan más allá de su contenido
- `min-w-0` resetea el min-width implícito
- Permite que `truncate` (text-overflow: ellipsis) funcione correctamente

---

## ✅ Orden de Implementación Recomendado

1. **Fase 1:** Crear `mobileFormatters.ts`
2. **Fase 2:** Aplicar cambios de alta prioridad
3. **Fase 3:** Aplicar cambios de media prioridad
4. **Fase 4:** Aplicar cambios de baja prioridad
5. **Fase 5:** Testing visual en diferentes dispositivos

---

**Documento preparado para implementación. ¿Proceder con los cambios?**
