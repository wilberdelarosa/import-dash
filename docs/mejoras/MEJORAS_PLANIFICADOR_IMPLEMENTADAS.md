# 🔧 Mejoras al Módulo de Planificador - Control de Mantenimiento

## ✅ Cambios Implementados

### 1. **Corrección de Rutas de Planificación**
**Problema:** Al seleccionar un equipo, se mostraban rutas de TODOS los equipos CAT
**Solución:** Modificada lógica de `planRuta` para mostrar solo el equipo seleccionado

```typescript
// Antes: Mostraba todos los equipos CAT
const planRuta = useMemo(() => {
  return data.mantenimientosProgramados.map(...)
}, [data.equipos, data.mantenimientosProgramados]);

// Ahora: Solo el equipo seleccionado en planFicha
const planRuta = useMemo(() => {
  if (!planFicha) return [];
  const mantenimiento = data.mantenimientosProgramados.find(m => m.ficha === planFicha);
  // ... retorna array con 1 elemento
}, [data.equipos, data.mantenimientosProgramados, planFicha]);
```

### 2. **Schema de Base de Datos - Planes Asignados**
Creada migración: `supabase/migrations/20241117000000_planes_asignados.sql`

**Tabla `planes_asignados`:**
- ✅ Relación con equipos (ficha)
- ✅ Relación con planes (plan_id)
- ✅ Asignación de técnico responsable
- ✅ Estados: `pendiente`, `en_proceso`, `completado`, `vencido`
- ✅ Configuración de alertas (horas_alerta, alerta_activada)
- ✅ Tracking de horas actuales y próximo mantenimiento
- ✅ Auditoría completa (fechas de asignación, inicio, completado, vencimiento)

**Características avanzadas:**
- 🔔 **Alertas automáticas:** Trigger que activa alertas cuando faltan <= horas_alerta
- 🔄 **Actualización automática de estados:** Cambia a `vencido` cuando se pasa el mantenimiento
- 📊 **Vista `planes_asignados_detallados`:** Join con equipos y planes para consultas rápidas
- ⚡ **Función `activar_alertas_mantenimiento()`:** Para ejecutar manualmente o con cron

**Índices optimizados:**
- Por equipo (equipo_ficha)
- Por plan (plan_id)
- Por técnico (tecnico_responsable)
- Por estado (estado)
- Por alertas (alerta_activada + estado)

### 3. **Selector de Equipos Mejorado**
Ya implementado en el código actual:
- ✅ Buscador rápido (ficha, nombre, modelo)
- ✅ Filtro por categoría con dropdown
- ✅ Cards compactas con preview
- ✅ Scroll independiente (max-height: 500px)
- ✅ Indicador visual del equipo seleccionado
- ✅ Badges con ficha y categoría
- ✅ Contador de equipos filtrados

---

## 🚀 Próximos Pasos Pendientes

### 4. **Apartado "Planes Asignados" - Nueva Sección**
**Ubicación sugerida:** Nueva pestaña en Tabs principal o panel flotante

**Funcionalidades requeridas:**
```typescript
interface PlanesAsignadosModule {
  // Vista principal
  listaActivos: {
    filtros: {
      estado: 'todos' | 'pendiente' | 'en_proceso' | 'completado' | 'vencido';
      tecnico: string;
      urgencia: 'critico' | 'alerta' | 'normal';
    };
    acciones: {
      editar: (id) => void;        // Cambiar técnico, horas_alerta
      completar: (id) => void;      // Marcar como completado
      eliminar: (id) => void;       // Eliminar asignación
      verHistorial: (id) => void;   // Ver mantenimientos pasados
    };
  };
  
  // Gestión de alertas
  configuracionAlertas: {
    umbrales: {
      critico: number;     // ej: 25 horas
      alerta: number;      // ej: 50 horas
      advertencia: number; // ej: 100 horas
    };
    notificaciones: {
      email: boolean;
      sms: boolean;
      navegador: boolean;
    };
  };
  
  // Dashboard de planes
  dashboard: {
    kpis: {
      totalAsignados: number;
      pendientes: number;
      vencidos: number;
      completadosHoy: number;
    };
    grafico: {
      tipo: 'timeline' | 'barras';
      datos: PlanAsignado[];
    };
  };
}
```

**Diseño propuesto:**
- Tabla con filtros avanzados
- Modal para edición rápida
- Badges de prioridad (🔴 Vencido, 🟡 Urgente, 🟢 Normal)
- Timeline de mantenimientos por técnico
- Exportar a PDF/Excel

---

### 5. **Módulo Kits - Segmentación por Equipo**
**Mejoras requeridas:**

```typescript
// src/pages/Kits.tsx - Mejoras propuestas

interface KitsModule {
  // Filtros avanzados
  filtros: {
    categoria: string[];        // Excavadoras, Cargadores, etc.
    modelo: string[];           // 320D, 966H, etc.
    busqueda: string;           // Búsqueda por nombre/parte
    disponibilidad: 'todos' | 'en_stock' | 'bajo' | 'agotado';
  };
  
  // Acoplamiento dinámico
  gestionPiezas: {
    agregar: (pieza) => void;
    quitar: (piezaId) => void;
    modificarCantidad: (piezaId, cantidad) => void;
    duplicar: (kitId) => void;  // Crear kit similar
  };
  
  // Visualización mejorada
  vistas: {
    lista: boolean;             // Vista lista compacta
    grid: boolean;              // Vista tarjetas
    agrupado: boolean;          // Agrupar por categoría
  };
  
  // Asignación a equipos
  asignaciones: {
    equiposUsando: Equipo[];    // Qué equipos usan este kit
    ultimoUso: Date;
    frecuenciaUso: number;
  };
}
```

**Componentes a crear:**
- `KitCard`: Tarjeta con piezas, equipos asociados, stock
- `KitEditor`: Modal para editar/crear kits
- `PiezaSelector`: Autocomplete con búsqueda de piezas
- `StockIndicator`: Badge con estado de stock

---

### 6. **Módulo Planes - Visualización de Equipos Asociados**
**Mejoras requeridas:**

```typescript
// src/pages/maintenance-plans.ts - Extensiones

interface PlanesModule {
  // Mostrar equipos asociados
  equiposAsociados: {
    total: number;
    porIntervalo: {
      PM1: Equipo[];
      PM2: Equipo[];
      PM3: Equipo[];
      PM4: Equipo[];
    };
    sinAsignar: Equipo[];
  };
  
  // Visualización de tareas y kits
  detalles: {
    verTareas: (intervaloId) => Tarea[];
    verKits: (intervaloId) => Kit[];
    verHistorial: (planId) => Mantenimiento[];
  };
  
  // Estadísticas
  estadisticas: {
    mantenimientosCompletados: number;
    horasPromedio: number;
    costosAcumulados: number;
    proximosVencimientos: Equipo[];
  };
}
```

**Diseño propuesto:**
- Card de plan con badge de contador de equipos
- Expandible para ver lista de equipos
- Filtros: Por intervalo (PM1-4), Por estado
- Timeline de próximos mantenimientos del plan
- Gráfico de uso del plan por mes

---

### 7. **Sistema de Alertas Automáticas**
**Configuración requerida:**

```typescript
interface AlertasSystem {
  // Configuración de umbrales
  umbrales: {
    critico: number;      // 25 horas o menos
    urgente: number;      // 50 horas o menos
    alerta: number;       // 100 horas o menos
  };
  
  // Canales de notificación
  notificaciones: {
    email: {
      habilitado: boolean;
      destinatarios: string[];
      plantilla: string;
    };
    sms: {
      habilitado: boolean;
      numeros: string[];
      proveedor: 'twilio' | 'vonage';
    };
    navegador: {
      habilitado: boolean;
      sonido: boolean;
    };
    whatsapp: {
      habilitado: boolean;
      numeros: string[];
    };
  };
  
  // Frecuencia de chequeo
  cron: {
    intervalo: '1h' | '3h' | '6h' | '12h' | '24h';
    horasLaborales: { inicio: string; fin: string };
    diasLaborales: number[]; // 1-7 (lunes-domingo)
  };
  
  // Escalamiento
  escalamiento: {
    nivel1: { horas: number; destinatarios: string[] };
    nivel2: { horas: number; destinatarios: string[] };
    nivel3: { horas: number; destinatarios: string[] };
  };
}
```

**Implementación sugerida:**
1. Supabase Edge Function para chequeo periódico
2. Integración con Resend (email) o SendGrid
3. Integración con Twilio (SMS)
4. Notificaciones del navegador ya implementadas
5. Dashboard de alertas activas/históricas

---

### 8. **Auto-asignación Inteligente de Equipos a Planes**
**Lógica de asignación:**

```typescript
interface AutoAssignment {
  // Reglas de asignación
  reglas: {
    porModelo: {
      modelo: string;           // "320D"
      planId: number;
      intervaloInicial: 'PM1';  // Siempre empiezan en PM1
    };
    porCategoria: {
      categoria: string;        // "Excavadoras"
      planId: number;
      condicional: (equipo) => boolean;
    };
    porMarca: {
      marca: string;            // "Caterpillar"
      planGenericoId: number;
    };
  };
  
  // Proceso de asignación
  asignacion: {
    automatica: boolean;        // Auto-asignar al crear equipo
    sobreescribir: boolean;     // Sobreescribir asignaciones manuales
    notificar: boolean;         // Notificar técnico al asignar
  };
  
  // Gestión de intervalos
  progresion: {
    autoIncrement: boolean;     // PM1 → PM2 → PM3 → PM4 al completar
    umbralPM2: number;          // 500 horas desde último MP
    umbralPM3: number;          // 1000 horas
    umbralPM4: number;          // 2000 horas
    resetDespuesPM4: boolean;   // Volver a PM1 después de PM4
  };
}
```

**Implementación sugerida:**
1. Tabla `reglas_asignacion` en Supabase
2. Trigger en `equipos` que ejecuta asignación al INSERT
3. Función `asignar_plan_automatico(equipo_ficha)` 
4. UI para gestionar reglas (admin only)
5. Log de asignaciones automáticas

**Ejemplo de flujo:**
```typescript
// Al crear excavadora 320D:
1. Sistema busca plan para "320D" → Encuentra plan_id=5
2. Crea registro en planes_asignados:
   - equipo_ficha: "AC-005"
   - plan_id: 5
   - intervalo_codigo: "PM1" (siempre empieza en PM1)
   - tecnico_responsable: "Sin asignar" (hasta asignación manual)
   - estado: "pendiente"
   - horas_alerta: 50 (default)
3. Al completar PM1 (250h):
   - Si han pasado >= 500h desde último MP mayor → Cambia a PM2
   - Si han pasado >= 1000h → Cambia a PM3
   - Si han pasado >= 2000h → Cambia a PM4
4. Notifica al técnico cuando falten <= 50 horas
```

---

## 📋 Resumen de Tareas

### ✅ Completado
- [x] Corregir visualización de rutas (solo equipo seleccionado)
- [x] Crear schema de Supabase para planes asignados
- [x] Mejorar selector de equipos en planificador

### 🚧 En Progreso
- [ ] Crear apartado "Planes Asignados" con gestión completa
- [ ] Mejorar módulo Kits (segmentación, filtros, acoplamiento)
- [ ] Mejorar módulo Planes (equipos asociados, estadísticas)

### ⏳ Pendiente
- [ ] Implementar sistema de alertas automáticas
- [ ] Implementar auto-asignación inteligente de equipos
- [ ] Crear hooks de Supabase para planes asignados
- [ ] Integrar notificaciones (email, SMS, WhatsApp)
- [ ] Dashboard de KPIs de mantenimiento

---

## 🎯 Prioridad de Implementación

**Fase 1 (Crítica):**
1. Hooks para planes asignados (`usePlanesAsignados`)
2. Apartado "Planes Asignados" (CRUD básico)
3. Sistema de alertas básico (navegador)

**Fase 2 (Alta):**
4. Auto-asignación de equipos a planes
5. Mejoras en Kits (filtros, segmentación)
6. Mejoras en Planes (equipos asociados)

**Fase 3 (Media):**
7. Notificaciones avanzadas (email, SMS)
8. Dashboard y reportes
9. Exportación de datos

---

## 💾 Comandos para Aplicar Migración

```bash
# Aplicar migración en Supabase
cd "c:\Users\wilbe\OneDrive\Documentos\ALITO MANTENIMIENTO APP\V01 APP WEB\import-dash"

# Opción 1: Con Supabase CLI (recomendado)
supabase db reset

# Opción 2: Ejecutar directamente en Supabase Studio
# 1. Ir a SQL Editor en Supabase Dashboard
# 2. Copiar contenido de supabase/migrations/20241117000000_planes_asignados.sql
# 3. Ejecutar

# Verificar que se creó correctamente
# SELECT * FROM public.planes_asignados LIMIT 1;
# SELECT * FROM public.planes_asignados_detallados LIMIT 5;
```

---

## 🔗 Archivos Modificados

- ✅ `src/pages/ControlMantenimientoProfesional.tsx` - Corrección de planRuta
- ✅ `supabase/migrations/20241117000000_planes_asignados.sql` - Nueva tabla

## 📝 Próximos Archivos a Crear

- `src/hooks/usePlanesAsignados.ts` - Hook para gestión de planes asignados
- `src/components/PlanesAsignados/PlanesAsignadosTable.tsx` - Tabla principal
- `src/components/PlanesAsignados/EditarPlanDialog.tsx` - Modal de edición
- `src/components/PlanesAsignados/ConfiguracionAlertas.tsx` - Config de alertas
- `src/pages/Kits.tsx` - Refactorizar con mejoras
- `src/pages/MaintenancePlans.tsx` - Refactorizar con mejoras

