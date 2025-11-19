# 📱 Guía Completa de Testing - Versión Móvil

## 🎯 Objetivo
Verificar que todos los módulos móviles funcionen correctamente en diferentes dispositivos y tamaños de pantalla.

---

## 🛠️ Preparación del Entorno

### 1. Iniciar la Aplicación
```powershell
npm run dev
```
La aplicación estará disponible en: `http://localhost:5173`

### 2. Abrir Chrome DevTools
- Presiona **F12** o **Ctrl+Shift+I**
- Presiona **Ctrl+Shift+M** para activar el modo dispositivo

### 3. Dispositivos de Prueba
Probar en los siguientes tamaños:

| Dispositivo | Resolución | Categoría |
|------------|-----------|-----------|
| iPhone SE | 375x667 | Mobile pequeño |
| iPhone 12 Pro | 390x844 | Mobile estándar |
| iPhone 14 Pro Max | 430x932 | Mobile grande |
| iPad Mini | 768x1024 | Tablet |
| iPad Pro | 1024x1366 | Tablet grande |

---

## ✅ Checklist de Testing por Módulo

### 📊 **Dashboard Móvil**

**Ruta**: `/` (página principal)

#### Elementos a Verificar:
- [ ] **Header compacto**
  - Logo visible
  - Botón de perfil/logout funcional
  
- [ ] **Métricas Grid 2x2**
  - Total equipos se muestra
  - Equipos activos con color correcto
  - Mantenimientos pendientes destacados
  - Alertas críticas con color rojo

- [ ] **Acciones Rápidas (4 botones)**
  - Botón "Equipos" navega a `/equipos`
  - Botón "Mantenimiento" navega a `/mantenimiento`
  - Botón "Inventario" navega a `/inventario`
  - Botón "Planificador" navega a `/planificador`

- [ ] **Lista de Equipos Críticos**
  - Muestra equipos con mantenimiento vencido
  - Badges de alerta visibles
  - Tap en card abre detalle

- [ ] **Bottom Navigation**
  - 5 iconos visibles (Dashboard, Equipos, Mantenimiento, Inventario, Planificador)
  - Icono activo resaltado
  - Navegación funcional

---

### 🔧 **Equipos Móvil**

**Ruta**: `/equipos`

#### Elementos a Verificar:
- [ ] **Búsqueda**
  - Input responde al typing
  - Filtrado en tiempo real
  - Icono de lupa visible

- [ ] **Estadísticas 3 columnas**
  - Total equipos
  - Activos (color verde)
  - Inactivos (color gris)

- [ ] **Filtros Chip**
  - Chip "Todos" seleccionable
  - Chip "Activos" filtra correctamente
  - Chip "Inactivos" filtra correctamente

- [ ] **Bottom Sheet de Filtros**
  - Se abre al tap en icono Filter
  - Lista de categorías visible
  - Filtros aplicables
  - Cierre con swipe down

- [ ] **Lista Vertical de Equipos**
  - Cards con MobileListCard
  - Información: Ficha, Nombre, Marca, Modelo
  - Badge de estado (Activo/Inactivo)
  - Scroll fluido

- [ ] **Dropdown Actions por Equipo**
  - Botón ⋮ (tres puntos)
  - Opción "Ver detalle"
  - Opción "Editar"
  - Opción "Eliminar" (roja)

- [ ] **FAB (Floating Action Button)**
  - Botón + visible en esquina inferior derecha
  - Sobre bottom nav (z-index correcto)
  - Abre diálogo de agregar equipo

- [ ] **Diálogos Compartidos**
  - `EquipoDetalleUnificado` se abre en modal
  - `EquipoDialog` para agregar/editar
  - `ConfirmDialog` para eliminar

---

### 🛠️ **Mantenimiento Móvil**

**Ruta**: `/mantenimiento` (Control de Mantenimiento)

#### Elementos a Verificar:
- [ ] **Estadísticas 4 columnas**
  - Total mantenimientos
  - Vencidos (rojo)
  - Próximos (amarillo)
  - Al día (verde)

- [ ] **Filtros Chip**
  - Todos, Vencidos, Próximos, Al día
  - Selección visual clara
  - Filtrado funcional

- [ ] **Bottom Sheet de Filtros**
  - 4 botones grandes con iconos
  - Contador por categoría
  - Filtro "Stock Bajo" destacado

- [ ] **Tabla Horizontal Scrollable**
  - Scroll horizontal con indicadores
  - Columnas: Estado, Equipo, Tipo, Restante, Próximo
  - Columna "Tipo" oculta en mobile (mobileHidden)
  
- [ ] **Badges de Estado**
  - Vencido: Badge rojo
  - Próximo (≤50hrs): Badge amarillo
  - Al día (>50hrs): Badge verde/outline

- [ ] **Dropdown Actions**
  - "Registrar mantenimiento"
  - "Ver detalle equipo"

- [ ] **Tap en Fila**
  - Abre detalle del equipo

---

### 📦 **Inventario Móvil**

**Ruta**: `/inventario`

#### Elementos a Verificar:
- [ ] **Alerta de Stock Bajo**
  - Banner rojo en top (si hay items con stock bajo)
  - Contador de items afectados
  - Tap navega a filtro "low-stock"

- [ ] **Búsqueda**
  - Busca por nombre, número de parte, código
  - Filtrado instantáneo

- [ ] **Filtros Chip**
  - Todos, Filtros, Aceites, Repuestos, Herramientas
  - Scroll horizontal si no caben

- [ ] **Bottom Sheet de Filtros**
  - Todos, Filtros, Aceites, Repuestos, Herramientas, Stock Bajo
  - Iconos descriptivos
  - Contador entre paréntesis

- [ ] **Grid 2 Columnas**
  - Cards compactos
  - Información: Nombre, Número parte, Tipo, Stock, Mínimo
  - Badge de tipo (outline)

- [ ] **Indicador Stock Bajo**
  - Borde rojo en card
  - Icono ⚠️ + texto "Stock bajo"
  - Números en rojo

- [ ] **Dropdown Actions**
  - Botón ⋮ en esquina superior derecha
  - "Editar" con icono lápiz
  - "Eliminar" con icono papelera (roja)

- [ ] **FAB**
  - Botón + para agregar item
  - Abre diálogo de formulario

- [ ] **Diálogos**
  - Formulario agregar/editar con scroll
  - Campos: Nombre*, Código*, Número parte, Tipo, Cantidad, Stock mín, etc.
  - Validación de campos requeridos
  - Confirmación de eliminación

---

### 📅 **Planes Asignados Móvil**

**Ruta**: `/mantenimiento` → Tab "Planes Asignados"

#### Elementos a Verificar:
- [ ] **Estadísticas 4 columnas**
  - Total, Pendiente, En Curso, Hecho
  - Colores por estado

- [ ] **Búsqueda**
  - Por equipo o intervalo (PM1, PM2, etc.)

- [ ] **Bottom Sheet de Filtros**
  - Select de Estado (5 opciones)
  - Select de Técnico (dinámico)
  - Select de Prioridad (Alta/Media/Baja)
  - Botón "Limpiar filtros"

- [ ] **Lista de Planes**
  - MobileListCard con icono de prioridad
  - Badge de estado
  - Ficha + intervalo en título
  - Nombre equipo en subtítulo
  - Técnico con icono 👤
  - Fecha con icono 📅
  - Notas (truncadas)

- [ ] **Iconos de Prioridad**
  - Alta (1): ⚠️ rojo
  - Media (2): 🕐 amarillo
  - Baja (3): ✅ verde

- [ ] **Badges de Estado**
  - Pendiente: outline amarillo
  - En Proceso: azul
  - Completado: verde
  - Vencido: rojo

- [ ] **Dropdown Actions**
  - "Marcar en proceso"
  - "Marcar completado"
  - "Editar" (abre diálogo)
  - "Eliminar" (roja)

- [ ] **Diálogo de Edición**
  - Muestra ficha e intervalo
  - Texto "Edición completa en desktop"
  - Botón cerrar

---

## 🎨 Elementos Comunes a Verificar

### Bottom Navigation (en todos los módulos)
- [ ] Fija en parte inferior
- [ ] 5 items con iconos + texto
- [ ] Item activo resaltado (color primario)
- [ ] Safe area respetada (iOS)
- [ ] No se solapa con contenido

### MobileLayout
- [ ] Header compacto con título
- [ ] Header actions (botones de acción)
- [ ] ScrollArea funcional
- [ ] Padding adecuado (no corta contenido)

### Touch Interactions
- [ ] Botones tienen área táctil ≥44x44px
- [ ] Feedback visual al tap (active state)
- [ ] Scroll suave y natural
- [ ] Swipe down cierra bottom sheets

### Responsive Breakpoints
- [ ] Mobile (<640px): Renderiza versión móvil
- [ ] Tablet (640-1024px): Renderiza versión móvil o tablet
- [ ] Desktop (>1024px): Renderiza versión desktop

---

## 🐛 Casos de Prueba de Error

### Datos Vacíos
- [ ] Dashboard sin equipos muestra empty state
- [ ] Equipos sin resultados muestra mensaje
- [ ] Mantenimiento sin programados muestra alerta
- [ ] Inventario vacío muestra icono + mensaje
- [ ] Planes sin asignar muestra empty state

### Búsquedas
- [ ] Búsqueda sin resultados muestra "Intenta con otros filtros"
- [ ] Búsqueda con texto largo no rompe layout
- [ ] Clear de búsqueda restaura lista completa

### Filtros
- [ ] Filtros sin resultados muestran mensaje apropiado
- [ ] Limpiar filtros restaura vista original
- [ ] Múltiples filtros aplicados funcionan correctamente

### Acciones
- [ ] Eliminar sin confirmación no ejecuta
- [ ] Guardar sin datos requeridos muestra validación
- [ ] Toast/notificaciones aparecen correctamente

---

## 📸 Screenshots Esperados

Tomar screenshots en cada dispositivo:

1. **Dashboard completo** (con datos)
2. **Equipos - lista** (con scroll parcial)
3. **Equipos - bottom sheet filtros** (abierto)
4. **Mantenimiento - tabla scroll** (mostrando indicadores)
5. **Inventario - grid** (con alerta stock bajo)
6. **Planes Asignados - lista** (mostrando estados diferentes)
7. **Bottom navigation** (resaltando item activo)

---

## ⚡ Testing de Performance

### Carga Inicial
- [ ] Dashboard carga en <2 segundos
- [ ] Skeleton loaders se muestran durante carga
- [ ] Transiciones suaves entre pantallas

### Scroll Performance
- [ ] Lista de 50+ items scroll fluido (60fps)
- [ ] Imágenes/iconos no causan lag
- [ ] Tabla horizontal scroll sin judder

### Interacciones
- [ ] Tap response inmediato (<100ms)
- [ ] Bottom sheet animación suave
- [ ] Diálogos abren/cierran sin delay

---

## 🔧 Debugging Tools

### React DevTools
```bash
# Instalar extensión Chrome
```
- Inspeccionar componentes
- Ver props y state
- Profiler para performance

### Network Tab
- Verificar llamadas a Supabase
- Tiempos de respuesta
- Errores de API

### Console
- No debe haber errores en consola
- Warnings aceptables (solo development)

---

## ✅ Criterios de Aceptación

### Funcionalidad
- ✅ Todas las funciones principales operativas
- ✅ Navegación entre módulos funcional
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Filtros y búsquedas precisos

### UX/UI
- ✅ Diseño coherente en todos los módulos
- ✅ Feedback visual en todas las acciones
- ✅ Textos legibles (min 12px)
- ✅ Áreas táctiles adecuadas (44x44px)

### Performance
- ✅ Carga <3 segundos
- ✅ Scroll fluido (60fps)
- ✅ Sin memory leaks

### Accesibilidad
- ✅ Contraste adecuado (WCAG AA)
- ✅ Focus visible en elementos interactivos
- ✅ Textos descriptivos en iconos

---

## 📋 Reporte de Bugs

Al encontrar un bug, documentar:

```markdown
### [MÓDULO] Descripción breve

**Dispositivo**: iPhone 12 Pro (390x844)
**Navegador**: Chrome 120
**Pasos para reproducir**:
1. Ir a /equipos
2. Tap en filtro "Activos"
3. Observar...

**Resultado esperado**: ...
**Resultado actual**: ...
**Screenshot**: [adjuntar]
**Prioridad**: Alta/Media/Baja
```

---

## 🎯 Testing Completado

Una vez verificados todos los items:

- [ ] Todos los módulos probados en mobile (375px)
- [ ] Todos los módulos probados en tablet (768px)
- [ ] No hay errores críticos
- [ ] Performance aceptable
- [ ] UX satisfactoria
- [ ] Documentación actualizada

---

## 🚀 Siguiente Paso

Después del testing exitoso:
1. Testing en dispositivos reales (iOS/Android)
2. Pruebas con usuarios beta
3. Optimizaciones basadas en feedback
4. Deploy a producción

---

**Fecha de última actualización**: 19 de noviembre, 2025
**Versión de testing**: v1.0 Mobile Adaptation
