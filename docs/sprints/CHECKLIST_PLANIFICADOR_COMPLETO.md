# 📋 CHECKLIST COMPLETO - MEJORAS MÓDULO PLANIFICADOR

## 🎯 ANÁLISIS DEL ESTADO ACTUAL

### ✅ Lo que YA funciona bien:
- [x] Selector de equipos con búsqueda y filtros
- [x] Visualización de un solo equipo a la vez (corregido)
- [x] Sistema de similitud inteligente para planes
- [x] Integración con datos de Supabase (planes, kits)
- [x] Fallback a catálogo Caterpillar
- [x] Selector de intervalos con información
- [x] Vista de tareas, kit y rutas en tabs
- [x] Asignación básica de planes (localStorage)
- [x] Guía de ciclo de 8 mantenimientos

### ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS:

#### 1. **NO SE GUARDAN LOS DATOS** 🔴
- Los planes asignados solo están en `useState` (localStorage temporal)
- Al refrescar la página, se pierden todas las asignaciones
- No hay persistencia en Supabase

#### 2. **RUTAS MUESTRA OTROS EQUIPOS** 🔴  
- ✅ **RESUELTO**: Ahora solo muestra el equipo seleccionado

#### 3. **FALTA ASOCIACIÓN REAL CON KITS Y PLANES** 🟡
- Kits se muestran pero no se pueden editar
- No hay visualización de qué equipos usan cada plan
- No hay gestión de piezas por kit

#### 4. **FALTA APARTADO DE GESTIÓN** 🔴
- No existe sección para ver todos los planes asignados
- No se pueden editar técnicos/alertas después de asignar
- No hay historial de mantenimientos ejecutados

#### 5. **DISEÑO CONFUSO** 🟡
- Combobox de plan manual override es muy grande
- Demasiada información en panel de debug
- Falta organización en apartados

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### 🔥 FASE 1: PERSISTENCIA Y DATOS (CRÍTICA - 1-2 días)

#### A. Hooks de Supabase para Planes Asignados
- [ ] **Crear `src/hooks/usePlanesAsignados.ts`**
  - [ ] Hook `usePlanesAsignados()` para obtener todos los planes
  - [ ] Hook `useCrearPlanAsignado()` para crear nuevos
  - [ ] Hook `useActualizarPlanAsignado()` para editar
  - [ ] Hook `useEliminarPlanAsignado()` para borrar
  - [ ] Hook `useActivarAlertas()` para sistema de alertas
  - [ ] Queries con filtros: por equipo, por técnico, por estado
  - [ ] Subscripciones real-time para cambios

**Tareas específicas:**
```typescript
// src/hooks/usePlanesAsignados.ts
export function usePlanesAsignados(filtros?: {
  equipo_ficha?: string;
  tecnico?: string;
  estado?: string;
}) {
  // SELECT * FROM planes_asignados_detallados WHERE ...
}

export function useCrearPlanAsignado() {
  // INSERT INTO planes_asignados
  // Retornar mutación con optimistic updates
}

export function useActualizarPlanAsignado() {
  // UPDATE planes_asignados WHERE id = ...
}
```

#### B. Migrar Lógica de Asignación a Supabase
- [ ] **Reemplazar `planesAsignados` useState con hook de Supabase**
  - [ ] Modificar `handleAsignarPlan()` para llamar a hook
  - [ ] Modificar `handleAsignarRutaMasiva()` para insertar en BD
  - [ ] Modificar `handleEditarPlan()` para actualizar BD
  - [ ] Modificar `handleEliminarPlan()` para borrar en BD
  - [ ] Agregar loading states durante mutaciones
  - [ ] Agregar error handling con toasts

#### C. Auto-actualización de Estados
- [ ] **Crear trigger o función edge para actualizar estados**
  - [ ] Función que se ejecute cada hora
  - [ ] Actualiza `horas_actuales` desde tabla `mantenimientos_programados`
  - [ ] Cambia estado a `vencido` si `horas_actuales >= proximo_mantenimiento`
  - [ ] Activa `alerta_activada` si faltan <= `horas_alerta`
  - [ ] Registra en `fecha_ultima_alerta`

**Archivo a crear:**
```sql
-- supabase/functions/actualizar-estados-planes/index.ts
```

---

### 🎨 FASE 2: APARTADO "PLANES ASIGNADOS" (ALTA - 2-3 días)

#### A. Crear Componente Principal
- [ ] **Crear `src/components/PlanesAsignados/PlanesAsignadosTable.tsx`**
  - [ ] Tabla con columnas: Equipo, Intervalo, Técnico, Estado, Horas restantes, Alerta, Acciones
  - [ ] Filtros avanzados:
    - [ ] Por estado (pendiente, en_proceso, completado, vencido)
    - [ ] Por técnico (dropdown con lista de técnicos)
    - [ ] Por urgencia (crítico <=25h, alerta <=50h, normal >50h)
    - [ ] Por rango de fechas de asignación
  - [ ] Búsqueda por equipo/ficha
  - [ ] Ordenamiento por columnas
  - [ ] Paginación (20 items por página)
  - [ ] Badges de colores según estado y urgencia
  - [ ] Acciones: Editar, Completar, Eliminar, Ver historial

**Diseño sugerido:**
```tsx
// Tabla compacta con badges de color
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Buscar...] [Estado ▼] [Técnico ▼] [Urgencia ▼]           │
├─────────────────────────────────────────────────────────────────┤
│ Equipo         │ MP  │ Técnico  │ Estado    │ Restante │ Acciones│
│ AC-005 320D    │ PM1 │ Juan P.  │ 🟢 Normal │ 209h     │ [⚙️][✓]│
│ AC-008 966H    │ PM2 │ María G. │ 🟡 Alerta │ 45h      │ [⚙️][✓]│
│ AC-012 140M    │ PM4 │ Carlos R.│ 🔴 Vencido│ -15h     │ [⚙️][✓]│
└─────────────────────────────────────────────────────────────────┘
```

#### B. Modal de Edición
- [ ] **Crear `src/components/PlanesAsignados/EditarPlanDialog.tsx`**
  - [ ] Form con campos:
    - [ ] Técnico responsable (input con autocomplete)
    - [ ] Horas de alerta (number input)
    - [ ] Estado (select: pendiente, en_proceso, completado)
    - [ ] Notas/Observaciones (textarea)
  - [ ] Validación de campos
  - [ ] Botones: Guardar, Cancelar
  - [ ] Loading state durante guardado

#### C. Dashboard de KPIs
- [ ] **Crear sección de métricas en la parte superior**
  - [ ] Total de planes asignados
  - [ ] Pendientes (estado = pendiente)
  - [ ] En proceso (estado = en_proceso)
  - [ ] Vencidos (estado = vencido)
  - [ ] Completados esta semana
  - [ ] Alertas activas (alerta_activada = true)
  - [ ] Por técnico (gráfico de barras)

**Diseño de KPIs:**
```tsx
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Total      │  Pendientes  │  En Proceso  │   Vencidos   │
│     45       │      12      │       8      │      3       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### D. Timeline de Mantenimientos
- [ ] **Vista de línea de tiempo por técnico**
  - [ ] Agrupación por técnico responsable
  - [ ] Ordenado por fecha de próximo mantenimiento
  - [ ] Indicadores visuales de urgencia
  - [ ] Drag & drop para reasignar (opcional)

#### E. Integrar en Planificador
- [ ] **Agregar tab "Planes Asignados" al Tabs principal**
  - [ ] Ubicar después de tab "Planificador"
  - [ ] Badge con contador de planes activos
  - [ ] Ruta: `/mantenimiento?tab=planes-asignados`

---

### 🔧 FASE 3: MÓDULO KITS MEJORADO (MEDIA - 2 días)

#### A. Página Kits Refactorizada
- [ ] **Modificar `src/pages/Kits.tsx`**
  
  **Sección 1: Filtros y Búsqueda**
  - [ ] Buscador por nombre de kit o número de parte
  - [ ] Filtro por categoría de equipo (Excavadoras, Cargadores, etc.)
  - [ ] Filtro por modelo de equipo (320D, 966H, etc.)
  - [ ] Filtro por disponibilidad de stock (todos, en_stock, bajo, agotado)
  - [ ] Vista: Lista compacta / Grid de tarjetas / Agrupado por categoría

  **Sección 2: Lista de Kits**
  - [ ] Tabla/Grid mostrando:
    - [ ] Nombre del kit
    - [ ] Categoría/Modelo asociado
    - [ ] Número de piezas
    - [ ] Estado de stock (badge de color)
    - [ ] Última actualización
    - [ ] Acciones: Editar, Duplicar, Eliminar, Ver equipos usando
  
  **Sección 3: Panel lateral "Equipos Asociados"**
  - [ ] Mostrar qué equipos usan cada kit
  - [ ] Contador de uso
  - [ ] Última fecha de uso
  - [ ] Frecuencia de uso (veces por mes)

#### B. Editor de Kits
- [ ] **Crear `src/components/Kits/KitEditor.tsx`**
  - [ ] Modal/Drawer para crear/editar kit
  - [ ] Campos:
    - [ ] Nombre del kit
    - [ ] Categoría de equipo (select con opciones)
    - [ ] Modelos compatibles (multi-select)
  - [ ] Sección de piezas:
    - [ ] Autocomplete para buscar piezas
    - [ ] Agregar/quitar piezas dinámicamente
    - [ ] Modificar cantidad por pieza
    - [ ] Drag & drop para reordenar
  - [ ] Botón "Duplicar kit" para crear uno similar
  - [ ] Validación: Al menos 1 pieza requerida

#### C. Selector de Piezas
- [ ] **Crear `src/components/Kits/PiezaSelector.tsx`**
  - [ ] Input con autocomplete
  - [ ] Búsqueda por número de parte o descripción
  - [ ] Sugerencias mientras escribe
  - [ ] Vista previa de pieza seleccionada
  - [ ] Indicador de stock disponible

#### D. Gestión de Stock
- [ ] **Agregar tabla `kit_stock` en Supabase**
  ```sql
  CREATE TABLE kit_stock (
    id UUID PRIMARY KEY,
    pieza_id UUID REFERENCES piezas(id),
    cantidad_disponible INTEGER,
    cantidad_minima INTEGER,
    ubicacion TEXT,
    ultima_actualizacion TIMESTAMPTZ
  );
  ```
- [ ] Indicadores visuales:
  - [ ] 🟢 En stock (cantidad > mínima)
  - [ ] 🟡 Stock bajo (cantidad <= mínima)
  - [ ] 🔴 Agotado (cantidad = 0)

---

### 📊 FASE 4: MÓDULO PLANES MEJORADO (MEDIA - 2 días)

#### A. Vista de Equipos Asociados
- [ ] **Modificar `src/pages/MaintenancePlans.tsx`**
  
  **Sección 1: Lista de Planes**
  - [ ] Tabla/Grid de planes con:
    - [ ] Nombre del plan
    - [ ] Marca y modelo
    - [ ] Número de intervalos
    - [ ] Contador de equipos usando el plan
    - [ ] Badge de estado (activo/inactivo)
    - [ ] Acciones: Ver equipos, Editar, Duplicar, Eliminar

#### B. Panel Expandible de Equipos
- [ ] **Por cada plan, mostrar lista de equipos asociados**
  - [ ] Expandir/colapsar con animación
  - [ ] Lista de equipos con:
    - [ ] Ficha y nombre
    - [ ] Intervalo actual asignado (PM1, PM2, PM3, PM4)
    - [ ] Estado (pendiente, en_proceso, completado)
    - [ ] Horas restantes
    - [ ] Fecha de próximo mantenimiento
  - [ ] Filtros por intervalo (solo PM1, solo PM2, etc.)
  - [ ] Exportar lista a Excel/PDF

**Diseño propuesto:**
```tsx
┌─────────────────────────────────────────────────────────────┐
│ 📋 Plan: Excavadora 320D                                    │
│ Marca: Caterpillar | Modelo: 320D | 4 intervalos | 12 equipos │
├─────────────────────────────────────────────────────────────┤
│ ▼ Equipos usando este plan (12)                            │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ AC-005 320D - PM1 - 209h restantes - 🟢 Normal    │  │
│   │ AC-008 320DL - PM2 - 45h restantes - 🟡 Alerta    │  │
│   │ AC-012 320D2 - PM4 - -15h vencido - 🔴 Crítico    │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### C. Visualización de Intervalos por Plan
- [ ] **Tabs para ver cada intervalo del plan**
  - [ ] Tab PM1, PM2, PM3, PM4
  - [ ] Mostrar tareas del intervalo
  - [ ] Mostrar kits asociados con piezas
  - [ ] Mostrar equipos en ese intervalo
  - [ ] Duración estimada
  - [ ] Frecuencia (cada X horas)

#### D. Estadísticas del Plan
- [ ] **Dashboard por plan**
  - [ ] Mantenimientos completados (total histórico)
  - [ ] Horas promedio de ejecución
  - [ ] Costos acumulados (si hay integración de costos)
  - [ ] Próximos vencimientos (equipos que pronto necesitan este plan)
  - [ ] Gráfico de uso por mes
  - [ ] Técnicos más frecuentes

---

### 🔔 FASE 5: SISTEMA DE ALERTAS AUTOMÁTICAS (ALTA - 2-3 días)

#### A. Configuración de Alertas
- [ ] **Crear `src/components/Alertas/ConfiguracionAlertas.tsx`**
  - [ ] Interfaz para configurar umbrales:
    - [ ] Crítico: X horas antes (default: 25h)
    - [ ] Urgente: X horas antes (default: 50h)
    - [ ] Alerta: X horas antes (default: 100h)
  - [ ] Canales de notificación:
    - [ ] ✅ Notificaciones del navegador (ya implementado)
    - [ ] 📧 Email (Resend/SendGrid)
    - [ ] 📱 SMS (Twilio)
    - [ ] 💬 WhatsApp (Twilio API)
  - [ ] Frecuencia de chequeo:
    - [ ] Cada 1h, 3h, 6h, 12h, 24h
    - [ ] Solo en horas laborales (8am-6pm)
    - [ ] Solo días laborales (Lun-Vie)

#### B. Supabase Edge Function para Chequeo
- [ ] **Crear `supabase/functions/check-alertas-mantenimiento/index.ts`**
  - [ ] Función que se ejecuta periódicamente (cron)
  - [ ] Query a `planes_asignados_detallados`
  - [ ] Filtra planes con `horas_restantes <= horas_alerta`
  - [ ] Actualiza `alerta_activada = true`
  - [ ] Envía notificaciones según canales configurados
  - [ ] Registra en tabla `alertas_enviadas` para no duplicar

**Tabla de registro:**
```sql
CREATE TABLE alertas_enviadas (
  id UUID PRIMARY KEY,
  plan_asignado_id UUID REFERENCES planes_asignados(id),
  canal TEXT, -- 'email', 'sms', 'whatsapp', 'navegador'
  destinatario TEXT,
  fecha_envio TIMESTAMPTZ,
  estado TEXT -- 'enviado', 'fallido'
);
```

#### C. Integración con Proveedores
- [ ] **Email con Resend**
  - [ ] Plantilla HTML profesional
  - [ ] Variables: nombre_equipo, intervalo, horas_restantes, técnico
  - [ ] Link directo al plan en la app
  - [ ] Footer con instrucciones

- [ ] **SMS con Twilio**
  - [ ] Mensaje corto: "⚠️ MP1 AC-005 en 45h - Juan Pérez"
  - [ ] Link corto a la app

- [ ] **WhatsApp con Twilio API**
  - [ ] Mensaje con formato
  - [ ] Botones de acción (Confirmar, Posponer)

#### D. Dashboard de Alertas
- [ ] **Vista de alertas activas**
  - [ ] Lista de alertas pendientes
  - [ ] Historial de alertas enviadas
  - [ ] Filtros por canal, fecha, técnico
  - [ ] Estadísticas: tasa de apertura, respuesta

---

### 🤖 FASE 6: AUTO-ASIGNACIÓN INTELIGENTE (MEDIA - 2 días)

#### A. Tabla de Reglas de Asignación
- [ ] **Crear tabla `reglas_asignacion` en Supabase**
  ```sql
  CREATE TABLE reglas_asignacion (
    id UUID PRIMARY KEY,
    tipo TEXT, -- 'modelo', 'categoria', 'marca'
    valor TEXT, -- '320D', 'Excavadoras', 'Caterpillar'
    plan_id UUID REFERENCES maintenance_plans(id),
    intervalo_inicial TEXT DEFAULT 'PM1',
    activa BOOLEAN DEFAULT true,
    prioridad INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

**Ejemplos de reglas:**
- Tipo: `modelo`, Valor: `320D`, Plan: ID del plan 320D → PM1
- Tipo: `categoria`, Valor: `Excavadoras`, Plan: ID plan genérico → PM1
- Tipo: `marca`, Valor: `Caterpillar`, Plan: ID plan CAT genérico → PM1

#### B. Trigger en Tabla Equipos
- [ ] **Crear trigger `assign_plan_on_equipment_insert`**
  - [ ] Se ejecuta cuando se inserta un nuevo equipo
  - [ ] Busca reglas aplicables (por modelo → categoría → marca)
  - [ ] Crea registro en `planes_asignados`:
    - [ ] equipo_ficha: nuevo equipo
    - [ ] plan_id: según regla
    - [ ] intervalo_codigo: 'PM1' (siempre inicial)
    - [ ] tecnico_responsable: 'Sin asignar'
    - [ ] estado: 'pendiente'
    - [ ] horas_alerta: 50 (default)
  - [ ] Registra en log de asignaciones automáticas

#### C. Función Manual de Asignación Masiva
- [ ] **Crear `asignar_plan_automatico(equipo_ficha TEXT)`**
  - [ ] Puede ejecutarse manualmente
  - [ ] Útil para re-asignar equipos existentes
  - [ ] Botón en UI: "Auto-asignar equipos sin plan"

#### D. UI para Gestionar Reglas
- [ ] **Página admin `/settings/reglas-asignacion`**
  - [ ] Tabla de reglas existentes
  - [ ] Botones: Agregar, Editar, Eliminar, Activar/Desactivar
  - [ ] Form para crear regla:
    - [ ] Tipo (radio: Modelo, Categoría, Marca)
    - [ ] Valor (input con autocomplete según tipo)
    - [ ] Plan asociado (select de planes)
    - [ ] Intervalo inicial (select PM1-PM4)
    - [ ] Prioridad (number, mayor = más prioritaria)
  - [ ] Previsualización: "12 equipos serán afectados"
  - [ ] Botón "Aplicar regla a equipos existentes"

#### E. Progresión Automática de Intervalos
- [ ] **Lógica de promoción de intervalo**
  - [ ] Al completar mantenimiento (cambiar estado a `completado`):
    - [ ] Calcular horas desde último MP mayor
    - [ ] Si >= 2000h → Crear nuevo plan asignado con PM4
    - [ ] Si >= 1000h → Crear nuevo plan asignado con PM3
    - [ ] Si >= 500h → Crear nuevo plan asignado con PM2
    - [ ] Si < 500h → Crear nuevo plan asignado con PM1
  - [ ] Resetear después de PM4 (opcional, configurable)

---

### 🎨 FASE 7: MEJORAS DE DISEÑO Y UX (BAJA - 1 día)

#### A. Combobox de Plan Manual Override
- [ ] **Reducir tamaño del selector de planes sugeridos**
  - [ ] Cambiar a dropdown compacto con badges
  - [ ] Solo mostrar top 3 sugerencias
  - [ ] Mover a tooltip o popover en hover
  - [ ] Agregar botón "Ver más planes" que abra modal

#### B. Panel de Debug de Planes
- [ ] **Hacer colapsable por defecto**
  - [ ] Cambiar `<details>` con mejor estilo
  - [ ] Solo mostrar badge "🔍 Info búsqueda"
  - [ ] Expandir solo si usuario hace clic
  - [ ] Considerar moverlo a un botón "ℹ️" que abra modal

#### C. Reorganización de Tabs
- [ ] **Orden sugerido:**
  1. Tareas (principal)
  2. Kit (importante)
  3. Asignados (gestión)
  4. Ciclo (planificación)
  5. Ruta (avanzado)

#### D. Iconografía y Colores
- [ ] **Estandarizar badges de estado:**
  - 🟢 Verde: Normal (>100h)
  - 🟡 Amarillo: Alerta (50-100h)
  - 🟠 Naranja: Urgente (25-50h)
  - 🔴 Rojo: Crítico/Vencido (<=25h o negativo)
  
- [ ] **Iconos por tipo de mantenimiento:**
  - 🔧 PM1 (mantenimiento básico)
  - 🛠️ PM2 (servicio intermedio)
  - ⚙️ PM3 (mantenimiento mayor)
  - 🏭 PM4 (overhaul completo)

#### E. Responsive Design
- [ ] **Optimizar para tablet y móvil**
  - [ ] Selector de equipos: drawer en móvil
  - [ ] Tabs: scroll horizontal en móvil
  - [ ] Tablas: modo cards en pantallas pequeñas
  - [ ] KPIs: stack vertical en móvil

---

### 📦 FASE 8: EXPORTACIÓN Y REPORTES (BAJA - 1 día)

#### A. Exportar Planes Asignados
- [ ] **Botón "Exportar" en tabla de planes asignados**
  - [ ] Formato Excel (.xlsx)
  - [ ] Formato PDF con tabla
  - [ ] Formato CSV
  - [ ] Incluir filtros aplicados
  - [ ] Agregar fecha de generación

#### B. Reporte de Mantenimientos por Período
- [ ] **Página `/reportes/mantenimientos`**
  - [ ] Selector de rango de fechas
  - [ ] Filtros: por técnico, por equipo, por intervalo
  - [ ] Gráficos:
    - [ ] Mantenimientos completados por mes
    - [ ] Distribución por tipo (PM1-PM4)
    - [ ] Tiempo promedio de ejecución
    - [ ] Top equipos con más mantenimientos
  - [ ] Tabla con detalles
  - [ ] Exportar a PDF/Excel

#### C. Dashboard Ejecutivo
- [ ] **Vista general para gerencia**
  - [ ] KPIs principales: completados, pendientes, vencidos
  - [ ] Gráfico de tendencia mensual
  - [ ] Costos acumulados
  - [ ] Eficiencia por técnico
  - [ ] Predicción de próximos mantenimientos (30/60/90 días)

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### **Sprint 1 (5 días):** Persistencia y Planes Asignados
1. ✅ Fase 1A: Hooks de Supabase
2. ✅ Fase 1B: Migrar lógica a BD
3. ✅ Fase 2A-B: Componente de Planes Asignados + Modal
4. ✅ Fase 2C: Dashboard de KPIs

**Objetivo:** Sistema funcional con guardado en BD y gestión básica

### **Sprint 2 (4 días):** Alertas y Auto-asignación
1. ✅ Fase 5A-B: Sistema de alertas (config + edge function)
2. ✅ Fase 5C: Integración email/SMS
3. ✅ Fase 6A-C: Reglas de auto-asignación + triggers
4. ✅ Fase 1C: Auto-actualización de estados

**Objetivo:** Sistema inteligente y automatizado

### **Sprint 3 (4 días):** Módulos Kits y Planes
1. ✅ Fase 3A-D: Refactor completo de Kits
2. ✅ Fase 4A-D: Refactor completo de Planes
3. ✅ Fase 2D: Timeline de mantenimientos

**Objetivo:** Módulos completos y profesionales

### **Sprint 4 (2 días):** Diseño y Reportes
1. ✅ Fase 7A-E: Mejoras de UX y diseño
2. ✅ Fase 8A-C: Sistema de reportes
3. ✅ Testing integral
4. ✅ Documentación

**Objetivo:** Sistema pulido y listo para producción

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] 0 datos perdidos al refrescar página
- [ ] Tiempo de asignación de plan < 5 segundos
- [ ] 100% de equipos con plan asignado automáticamente
- [ ] Alertas enviadas dentro de 1 hora del umbral
- [ ] UI responsive en todos los dispositivos
- [ ] Exportación de reportes funcional
- [ ] 0 errores en consola
- [ ] Build exitoso sin warnings

---

## 🔗 ARCHIVOS A CREAR/MODIFICAR

### Nuevos archivos:
```
src/
  hooks/
    usePlanesAsignados.ts ⭐ CRÍTICO
  components/
    PlanesAsignados/
      PlanesAsignadosTable.tsx ⭐ CRÍTICO
      EditarPlanDialog.tsx
      ConfiguracionAlertas.tsx
      AlertasDashboard.tsx
    Kits/
      KitEditor.tsx
      PiezaSelector.tsx
      StockIndicator.tsx
    Planes/
      PlanEquiposAsociados.tsx
      PlanEstadisticas.tsx
  pages/
    Settings/
      ReglasAsignacion.tsx

supabase/
  migrations/
    20241117000000_planes_asignados.sql ✅ YA EXISTE
    20241117000001_reglas_asignacion.sql
    20241117000002_alertas_enviadas.sql
    20241117000003_kit_stock.sql
  functions/
    check-alertas-mantenimiento/ ⭐ CRÍTICO
    actualizar-estados-planes/
```

### Archivos a modificar:
```
src/pages/
  ControlMantenimientoProfesional.tsx ⭐ CRÍTICO
  Kits.tsx
  MaintenancePlans.tsx
```

---

## 💡 NOTAS IMPORTANTES

1. **Priorizar Fase 1 y 2** - Sin persistencia, todo es temporal
2. **Aplicar migración primero** - La tabla `planes_asignados` ya está lista
3. **Testing incremental** - Probar cada fase antes de continuar
4. **Documentar APIs** - Especialmente hooks y edge functions
5. **Considerar performance** - Índices en BD, paginación en tablas
6. **Accesibilidad** - ARIA labels, keyboard navigation
7. **Seguridad** - RLS policies en todas las tablas nuevas

---

## ✅ CHECKLIST RÁPIDO DE INICIO

Para empezar HOY:

- [ ] 1. Aplicar migración de planes_asignados en Supabase
- [ ] 2. Crear archivo `src/hooks/usePlanesAsignados.ts`
- [ ] 3. Implementar hook básico de fetch
- [ ] 4. Modificar `handleAsignarPlan()` para usar hook
- [ ] 5. Probar que se guarde en BD
- [ ] 6. Crear componente `PlanesAsignadosTable.tsx` básico
- [ ] 7. Agregar tab en Planificador
- [ ] 8. Probar flujo completo: asignar → ver en tabla → editar → eliminar

**Tiempo estimado para checklist de inicio:** 3-4 horas

---

📅 **Fecha de creación:** 17 de noviembre, 2025
👨‍💻 **Desarrollado por:** Wilber De La Rosa
🎯 **Objetivo:** Sistema profesional de planificación de mantenimiento con persistencia, alertas automáticas y gestión inteligente
