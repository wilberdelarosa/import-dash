# 🔄 Normalización de Tabs: Vencidos y Próximos

> **Fecha:** 12 de Diciembre, 2025  
> **Archivo:** `src/pages/mobile/SupervisorDashboard.tsx`  
> **Tipo:** Mejora de consistencia UI + Fix de Layout Shift

---

## 📋 Resumen del Cambio

Se realizaron dos correcciones importantes:

1. **Normalización de Badge:** El tab "Vencidos" ahora usa el mismo patrón de clases custom que "Próximos"
2. **Altura Fija de Tabs:** Ambos tabs tienen altura fija `h-[200px]` para evitar layout shift

---

## 🐛 Problema Identificado: Layout Shift

### Síntoma
Al cambiar entre tabs "Vencidos" (11 items) y "Próximos" (2 items), todo el diseño se expandía/contraía causando un efecto visual molesto.

### Causa Raíz
```tsx
// ❌ ANTES: Altura variable
<div className="space-y-2 max-h-[250px] min-h-[120px] overflow-y-auto">
```

- `min-h-[120px]` solo establece un mínimo, no fuerza la altura
- Con 2 items (~100px), el contenedor era más pequeño que `min-h`
- Con 11 items, el contenedor alcanzaba `max-h-[250px]`
- **Diferencia de altura:** ~130px entre tabs

### Representación Visual del Problema
```
Tab "Vencidos" (11 items)         Tab "Próximos" (2 items)
┌─────────────────────────┐       ┌─────────────────────────┐
│ Item 1                  │       │ Item 1                  │
│ Item 2                  │       │ Item 2                  │
│ Item 3                  │       └─────────────────────────┘
│ Item 4                  │       ↑ SOLO ~100px
│ ... (scroll)            │       
│ Item 11                 │       Accesos Rápidos se mueven
└─────────────────────────┘       hacia arriba ~130px
↑ 250px (max)                     
                                  ⚠️ LAYOUT SHIFT
Accesos Rápidos aquí              
```

---

## ✅ Solución Implementada

### Altura Fija para Ambos Tabs

```tsx
// ✅ DESPUÉS: Altura fija
<div className="h-[200px] overflow-y-auto space-y-2">
```

### Código Corregido

```tsx
// Tab Vencidos
<TabsContent value="vencidos" className="mt-0">
  {equiposVencidos.length === 0 ? (
    <div className="text-center py-6 h-[200px] flex flex-col items-center justify-center">
      {/* Estado vacío centrado */}
    </div>
  ) : (
    <div className="space-y-2 h-[200px] overflow-y-auto">
      {/* Items con scroll */}
    </div>
  )}
</TabsContent>

// Tab Próximos - Idéntica estructura
<TabsContent value="proximos" className="mt-0">
  {equiposProximos.length === 0 ? (
    <div className="text-center py-6 h-[200px] flex flex-col items-center justify-center">
      {/* Estado vacío centrado */}
    </div>
  ) : (
    <div className="space-y-2 h-[200px] overflow-y-auto">
      {/* Items con scroll */}
    </div>
  )}
</TabsContent>
```

### Representación Visual de la Solución
```
Tab "Vencidos" (11 items)         Tab "Próximos" (2 items)
┌─────────────────────────┐       ┌─────────────────────────┐
│ Item 1                  │       │ Item 1                  │
│ Item 2                  │       │ Item 2                  │
│ Item 3                  │       │                         │
│ Item 4                  │       │     (espacio vacío)     │
│ ... (scroll interno)    │       │                         │
│                         │       │                         │
└─────────────────────────┘       └─────────────────────────┘
↑ 200px (fijo)                    ↑ 200px (fijo)

Accesos Rápidos                   Accesos Rápidos
(posición consistente)            (misma posición)

✅ SIN LAYOUT SHIFT
```

---

## 🎨 Normalización de Badges

### Antes (Tab Vencidos)

```tsx
<Badge
  variant="destructive"
  className="h-5 px-2 py-0.5 text-[10px] leading-none font-medium max-w-[110px] truncate tabular-nums"
>
```

### Después (Tab Vencidos - Normalizado)

```tsx
<Badge className="h-5 px-2 py-0.5 text-[10px] leading-none font-medium max-w-[110px] truncate tabular-nums bg-destructive/10 text-destructive border-destructive/20">
```

### Patrón Unificado

| Propiedad | Vencidos (destructive) | Próximos (amber) |
|-----------|------------------------|------------------|
| Background | `bg-destructive/10` | `bg-amber-500/10` |
| Text | `text-destructive` | `text-amber-600` |
| Border | `border-destructive/20` | `border-amber-500/20` |
| Container BG | `bg-destructive/5` | `bg-amber-500/5` |
| Container Border | `border-destructive/30` | `border-amber-500/30` |

---

## 📊 Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Altura Vencidos (11 items) | max-h-[250px] | h-[200px] |
| Altura Próximos (2 items) | ~100px | h-[200px] |
| Layout Shift | ⚠️ ~130px | ✅ 0px |
| Badge Vencidos | variant="destructive" | Clases inline |
| Consistencia | ❌ | ✅ |

---

## 🔑 Lecciones Aprendidas

1. **`min-h` no fuerza altura** - Solo establece mínimo, el contenedor puede ser más pequeño si el contenido es menor
2. **`h-[X]` es determinístico** - Siempre será exactamente X píxeles
3. **Estado vacío también necesita altura** - Usar `flex items-center justify-center` para centrar
4. **Consistencia > Variants** - Usar clases inline permite control preciso de opacidades

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/pages/mobile/SupervisorDashboard.tsx` | Badge normalizado + altura fija tabs |

---

## 🔗 Referencias

- [PLAN_NORMALIZACION_MOBILE.md](./PLAN_NORMALIZACION_MOBILE.md) - Plan completo de normalización
- [ANALISIS_TAB_PROXIMOS_SUPERVISOR.md](../ANALISIS_TAB_PROXIMOS_SUPERVISOR.md) - Análisis detallado del diseño
