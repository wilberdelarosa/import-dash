# 🚀 Rediseño Completo del Planificador - Especificación Técnica

**Fecha**: 18 de Noviembre, 2025  
**Módulo**: Sistema de Planificación Inteligente de Mantenimientos  
**Objetivo**: Hub central que cruza equipos + planes + kits + historial de MP

---

## 📋 Resumen Ejecutivo

El planificador debe transformarse en el **hub inteligente** que:
- **Sugiere automáticamente** los próximos 8 ciclos de mantenimiento
- **Asocia planes** basándose en modelo/marca/categoría
- **Calcula MPs inteligentemente** según historial y lecturas
- **Permite overrides manuales** cuando la asociación falla
- **Guarda rutas** con persistencia en Supabase

---

## 🎯 Objetivos Principales

### 1. Sugerencias Inteligentes de MPs
**Lógica de Cálculo**:
```typescript
// Si última lectura: 1,700h y próximo objetivo: 2,000h
// → Sugerir MP4 si no hay MP4 reciente

// Si última lectura: 1,900h y ya hubo MP4
// → Reiniciar ciclo con MP1

// Generar 8 próximas rutas:
// - MP1 @ 500h
// - MP2 @ 1,000h
// - MP3 @ 1,500h
// - MP4 @ 2,000h
// - MP1 @ 2,500h (nuevo ciclo)
// - MP2 @ 3,000h
// - MP3 @ 3,500h
// - MP4 @ 4,000h
```

### 2. Asociación Automática de Planes
- **Match por modelo exacto**: CAT 320 → Plan "Excavadora CAT 320"
- **Match por marca + categoría**: Caterpillar Excavadora → Plan genérico
- **Match por similitud**: Score 70%, 85%, 95%
- **Override manual**: Usuario puede forzar plan diferente

### 3. Persistencia de Rutas
- Guardar en `planificaciones_mantenimiento`
- Incluir: equipo, MP, horas objetivo, técnico, estado
- Metadata de overrides: motivo, usuario, fecha

---

## 🏗️ Arquitectura Propuesta

### Nuevos Hooks

#### `useSugerenciaMantenimiento.ts` ✅ (Ya existe)
```typescript
export function useSugerenciaMantenimiento(ficha: string) {
  // Calcula el próximo MP basado en:
  // - Última lectura del equipo
  // - Historial de mantenimientos
  // - Plan asignado
  
  return {
    proximoMP: 'MP4',
    horasObjetivo: 2000,
    horasRestantes: 300,
    ciclosCompletos: 2,
    siguientes8Rutas: [...],
  };
}
```

#### `useRutasPredictivas.ts` (Nuevo)
```typescript
export function useRutasPredictivas(ficha: string, planId: number) {
  // Genera 8 próximas rutas
  const generarRutas = (lecturaActual: number, plan: PlanConIntervalos) => {
    const rutas = [];
    let horasAcumuladas = lecturaActual;
    let ciclo = 0;
    
    for (let i = 0; i < 8; i++) {
      const intervalo = plan.intervalos[i % plan.intervalos.length];
      horasAcumuladas += intervalo.horas_intervalo;
      
      rutas.push({
        orden: i + 1,
        mp: intervalo.codigo,
        horasObjetivo: horasAcumuladas,
        kit: intervalo.kits[0]?.kit.nombre,
        ciclo: Math.floor(i / plan.intervalos.length) + 1,
      });
    }
    
    return rutas;
  };
  
  const guardarRutas = async (rutas) => {
    // Guardar en planificaciones_mantenimiento
    for (const ruta of rutas) {
      await crearPlanificacion({
        fichaEquipo: ficha,
        proximoMP: ruta.mp,
        horasKmProximoMP: ruta.horasObjetivo,
        // ... demás campos
      });
    }
  };
  
  return { generarRutas, guardarRutas };
}
```

#### `useOverridesPlanes.ts` (Nuevo)
```typescript
export function useOverridesPlanes() {
  const [overrides, setOverrides] = useState<OverrideManual[]>([]);
  
  const crearOverride = async (data: {
    fichaEquipo: string;
    planOriginal: number | null;
    planForzado: number;
    motivo: string;
  }) => {
    // Guardar en tabla overrides_planes (nueva)
    await supabase.from('overrides_planes').insert(data);
  };
  
  const verificarOverride = (ficha: string) => {
    return overrides.find(o => o.fichaEquipo === ficha);
  };
  
  return { overrides, crearOverride, verificarOverride };
}
```

---

## 🎨 Diseño UI/UX

### Vista Principal: Índice Interactivo

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Planificador Inteligente                                │
│  ─────────────────────────────────────────────────────────  │
│  [Filtros] ▼ Modelo: Todos | Categoría: Excavadora | ...   │
│  [Limpiar filtros] [Ver solo MP4] [Solo sin kit]            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│  📋 Equipos (15)         │  🛣️ Ruta Planificada            │
│  ────────────────────    │  ───────────────────────────     │
│  ✓ CAT 320 - DEMO-001   │  Equipo: CAT 320 - DEMO-001     │
│    📊 1,700h / 2,000h   │  Plan: Excavadora CAT 320        │
│    🔧 MP4 siguiente     │  Match: 95% ✅                   │
│    ⏰ 300h restantes    │                                  │
│                          │  📍 Próximos 8 Mantenimientos:  │
│  □ JD 410 - DEMO-002    │  ┌─────────────────────────┐    │
│    📊 850h / 1,000h     │  │ 1. MP4 @ 2,000h         │    │
│    🔧 MP2 siguiente     │  │ 2. MP1 @ 2,500h (ciclo 2)│   │
│    ⏰ 150h restantes    │  │ 3. MP2 @ 3,000h         │    │
│                          │  │ 4. MP3 @ 3,500h         │    │
│  □ KMT D475 - DEMO-003  │  │ 5. MP4 @ 4,000h         │    │
│    📊 3,200h / 4,000h   │  │ 6. MP1 @ 4,500h (ciclo 3)│   │
│    🔧 MP4 siguiente     │  │ 7. MP2 @ 5,000h         │    │
│    🚨 Override manual   │  │ 8. MP3 @ 5,500h         │    │
│                          │  └─────────────────────────┘    │
│  [Ver 12 más...]         │                                  │
│                          │  [Guardar Ruta] [Editar Plan]   │
└──────────────────────────┴──────────────────────────────────┘
```

### Panel de Sugerencias Inteligentes

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Planes Recomendados para CAT 320 - DEMO-001            │
│  ─────────────────────────────────────────────────────────  │
│  [95% match] Excavadora CAT 320                   [Usar] ✓ │
│  ├─ Modelo exacto coincide                                 │
│  ├─ 4 intervalos configurados                              │
│  └─ 12 equipos usan este plan                              │
│                                                             │
│  [85% match] Plan Genérico Caterpillar            [Usar]   │
│  ├─ Marca coincide                                         │
│  ├─ Categoría: Excavadora                                  │
│  └─ 3 equipos usan este plan                               │
│                                                             │
│  [70% match] Plan Universal Equipos Pesados       [Usar]   │
│  ├─ Categoría coincide                                     │
│  ├─ Sin modelo específico                                  │
│  └─ 45 equipos usan este plan                              │
│                                                             │
│  🔧 [Asignar Plan Manualmente]                             │
└─────────────────────────────────────────────────────────────┘
```

### Sistema de Overrides

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Override Manual Detectado                              │
│  ─────────────────────────────────────────────────────────  │
│  Equipo: KMT D475 - DEMO-003                               │
│  Plan Sugerido: Plan Genérico Komatsu (85% match)         │
│  Plan Forzado: Plan Custom KMT-D475-HEAVY                  │
│                                                             │
│  Motivo: "Equipo opera en condiciones extremas,            │
│           requiere mantenimientos más frecuentes"          │
│                                                             │
│  Usuario: admin@alitogroup.com                             │
│  Fecha: 15/11/2025 10:30                                   │
│                                                             │
│  [Revertir a Automático] [Editar Motivo]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Módulo de Planes Mejorado

### Vista: Equipos Asociados

```
┌─────────────────────────────────────────────────────────────┐
│  Plan: Excavadora CAT 320                                  │
│  ─────────────────────────────────────────────────────────  │
│  📊 15 equipos usan este plan                              │
│                                                             │
│  [Buscar equipo...] [Filtrar por estado]                   │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │ ✓ CAT 320 - DEMO-001    Automático  [Cambiar] │     │
│  │ ✓ CAT 320 - DEMO-005    Automático  [Cambiar] │     │
│  │ ⚠️ CAT 320 - DEMO-007    Override    [Ver]     │     │
│  │ ✓ CAT 320D - DEMO-012   Automático  [Cambiar] │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  [Asociar Más Equipos] [Reasignar Plan Masivo]             │
└─────────────────────────────────────────────────────────────┘
```

### Vista: Intervalos con Kits

```
┌─────────────────────────────────────────────────────────────┐
│  Intervalos del Plan: Excavadora CAT 320                   │
│  ─────────────────────────────────────────────────────────  │
│  ┌─ MP1 @ 500h ────────────────────────────────────┐      │
│  │  Kit: Filtros Básicos CAT 320                    │      │
│  │  Usado en: 12 planificaciones activas            │      │
│  │  Última actualización: 10/11/2025                │      │
│  │  [Ver Piezas ▼] [Cambiar Kit] [Editar]          │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ MP2 @ 1,000h ──────────────────────────────────┐      │
│  │  Kit: Mantenimiento Intermedio CAT 320           │      │
│  │  Usado en: 8 planificaciones activas             │      │
│  │  [Ver Piezas ▼] [Cambiar Kit] [Editar]          │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ MP3 @ 1,500h ──────────────────────────────────┐      │
│  ┌─ MP4 @ 2,000h ──────────────────────────────────┐      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Módulo de Kits Mejorado

### Agrupación por Categoría

```
┌─────────────────────────────────────────────────────────────┐
│  Kits de Mantenimiento                                     │
│  ─────────────────────────────────────────────────────────  │
│  [Buscar kit/pieza...] [Filtrar: Todos ▼]                 │
│                                                             │
│  📦 Filtros (8 kits)                                       │
│  ├─ Kit Filtros CAT 320      [12 equipos] [Ver piezas ▼] │
│  ├─ Kit Filtros Universal    [45 equipos] [Ver piezas ▼] │
│  └─ ...                                                     │
│                                                             │
│  🛢️ Lubricantes (5 kits)                                   │
│  ├─ Kit Aceites Motor CAT    [20 equipos] [Ver piezas ▼] │
│  ├─ Kit Hidráulico Pesado    [15 equipos] [Ver piezas ▼] │
│  └─ ...                                                     │
│                                                             │
│  🔧 Repuestos Críticos (3 kits)                            │
│  └─ ...                                                     │
│                                                             │
│  [Crear Nuevo Kit] [Importar desde Catálogo]              │
└─────────────────────────────────────────────────────────────┘
```

### Búsqueda Inteligente

```
┌─────────────────────────────────────────────────────────────┐
│  [Buscar: "filtro aceite"] 🔍                              │
│  ─────────────────────────────────────────────────────────  │
│  Resultados en Kits (3):                                   │
│  ✓ Kit Filtros CAT 320 → Contiene "1R-0750 Filtro Aceite" │
│  ✓ Kit Mantenimiento Mayor → Contiene "1R-0750..."        │
│  ✓ Kit Universal Filtros → Contiene "Filtro Aceite Equiv."│
│                                                             │
│  Resultados en Piezas (12):                                │
│  ✓ 1R-0750 - Filtro de Aceite Motor                       │
│  ✓ 1R-0751 - Filtro de Aceite Hidráulico                  │
│  └─ ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Datos

### Nueva Tabla: `overrides_planes`

```sql
CREATE TABLE overrides_planes (
  id BIGSERIAL PRIMARY KEY,
  ficha_equipo VARCHAR NOT NULL REFERENCES equipos(ficha),
  plan_original_id BIGINT REFERENCES planes_mantenimiento(id),
  plan_forzado_id BIGINT NOT NULL REFERENCES planes_mantenimiento(id),
  motivo TEXT NOT NULL,
  usuario_email VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_overrides_ficha ON overrides_planes(ficha_equipo);
```

### Mejoras a `planificaciones_mantenimiento`

```sql
ALTER TABLE planificaciones_mantenimiento
ADD COLUMN numero_ruta INTEGER, -- 1-8
ADD COLUMN ciclo_numero INTEGER, -- Ciclo 1, 2, 3...
ADD COLUMN es_override BOOLEAN DEFAULT false,
ADD COLUMN plan_id BIGINT REFERENCES planes_mantenimiento(id);

CREATE INDEX idx_plan_ruta ON planificaciones_mantenimiento(ficha_equipo, numero_ruta);
```

---

## 🔄 Flujo de Usuario

### Caso 1: Asignación Automática Exitosa

1. Usuario abre Planificador
2. Selecciona equipo "CAT 320 - DEMO-001"
3. Sistema muestra:
   - Plan sugerido: "Excavadora CAT 320" (95% match)
   - Próximo MP: MP4 @ 2,000h
   - 8 rutas calculadas automáticamente
4. Usuario hace clic en **[Guardar Ruta]**
5. Sistema guarda 8 planificaciones en BD
6. Toast: "✅ Ruta guardada para CAT 320 - DEMO-001"

### Caso 2: Override Manual Requerido

1. Usuario selecciona equipo "KMT D475 - DEMO-003"
2. Sistema muestra:
   - Plan sugerido: "Plan Genérico Komatsu" (70% match)
   - ⚠️ "Match bajo, revisa si es correcto"
3. Usuario hace clic en **[Asignar Plan Manualmente]**
4. Dialog muestra lista de todos los planes
5. Usuario elige "Plan Custom KMT-D475-HEAVY"
6. Sistema pide motivo: "Opera en condiciones extremas"
7. Guarda override en `overrides_planes`
8. Badge "🚨 Override manual" aparece en el equipo
9. Ruta se genera con el plan forzado

### Caso 3: Reasignación Masiva

1. Usuario va a **Planes** → "Excavadora CAT 320"
2. Clic en tab **Equipos Asociados**
3. Ve 15 equipos usando este plan
4. Clic en **[Reasignar Plan Masivo]**
5. Elige nuevo plan: "Excavadora CAT 320 V2"
6. Confirma: "¿Reasignar 15 equipos?"
7. Sistema actualiza `overrides_planes` (si existían)
8. Toast: "✅ 15 equipos reasignados"

---

## ✅ Checklist de Implementación

### Fase 1: Infraestructura (2-3 horas)
- [ ] Crear migración SQL para `overrides_planes`
- [ ] Agregar campos a `planificaciones_mantenimiento`
- [ ] Crear hook `useRutasPredictivas.ts`
- [ ] Crear hook `useOverridesPlanes.ts`
- [ ] Actualizar tipos TypeScript

### Fase 2: Lógica de Negocio (3-4 horas)
- [ ] Implementar algoritmo de 8 rutas
- [ ] Sistema de matching de planes (score)
- [ ] Cálculo inteligente de próximo MP
- [ ] Detección de ciclos completos

### Fase 3: UI del Planificador (4-5 horas)
- [ ] Vista índice interactivo
- [ ] Panel de sugerencias inteligentes
- [ ] Tabla de 8 rutas
- [ ] Dialog de override manual
- [ ] Filtros plegables avanzados

### Fase 4: Módulo Planes (2-3 horas)
- [ ] Tab "Equipos Asociados"
- [ ] Vista de intervalos con kits
- [ ] Reasignación masiva
- [ ] Búsqueda segmentada

### Fase 5: Módulo Kits (2-3 horas)
- [ ] Agrupación por categoría
- [ ] Búsqueda inteligente (autocomplete)
- [ ] Badges de uso
- [ ] Vista colapsable de piezas

### Fase 6: Alertas e Integración (2-3 horas)
- [ ] Panel de alertas inteligentes
- [ ] Integración con NotificacionesCentro
- [ ] Alertas de proximidad (50h restantes)
- [ ] Notificaciones push

### Fase 7: Testing y Documentación (2-3 horas)
- [ ] Probar flujo completo
- [ ] Validar persistencia
- [ ] Crear documentación de usuario
- [ ] Guía de overrides

---

## 📈 Estimación Total

**Tiempo estimado**: 17-24 horas de desarrollo  
**Complejidad**: Alta  
**Prioridad**: Crítica

**Entregables**:
1. Sistema de planificación inteligente completo
2. Módulos mejorados de Planes y Kits
3. Sistema de overrides con auditoría
4. Documentación técnica y de usuario

---

## 🚀 Próximos Pasos Inmediatos

1. **Aplicar migración de planificaciones** (ya existe)
2. **Crear migración de overrides**
3. **Implementar hooks base**
4. **Construir UI del planificador nuevo**
5. **Integrar con módulos existentes**

---

**Estado**: Especificación completa ✅  
**Última actualización**: 18 de Noviembre, 2025  
**Responsable**: GitHub Copilot con Claude Sonnet 4.5
