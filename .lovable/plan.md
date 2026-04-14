

# Plan: Actualización por Voz Multi-Ficha, Filtros en Reportes, Cambio de Ficha con Historial, y Ocultar Inactivos

## Resumen

Cuatro mejoras principales para el sistema de Control de Mantenimiento:

1. **Entrada por voz multi-ficha** en el panel flotante
2. **Filtros en la sección de reportes** (actualizados/pendientes)
3. **Cambio de ficha de equipos** preservando todo el historial
4. **Ocultar equipos inactivos** de comboboxes y formularios de actualización

---

## 1. Actualización por Voz Multi-Ficha

### Cómo funciona
- Nuevo botón "🎤 Dictado por Voz" en el panel flotante, junto a la actualización rápida actual
- Al presionar, se inicia grabación de audio usando la Web Speech API (reconocimiento de voz nativo del navegador) o ElevenLabs STT si se necesita mayor precisión
- El usuario dicta: *"Ficha AC-003, 1250 horas. Ficha AC-007, 3400 horas..."* durante hasta 10 minutos
- Al finalizar, el sistema:
  1. Parsea el texto transcrito extrayendo pares (ficha, lectura)
  2. Valida cada ficha contra equipos activos en la base de datos
  3. **Detecta anomalías**: calcula el incremento vs. tiempo transcurrido desde la última actualización. Si un equipo solo puede trabajar ~9 hrs/día y el incremento excede eso, marca como "sospechoso"
  4. Muestra un **resumen de validación** en tabla: ficha, equipo, lectura anterior, nueva lectura, incremento, estado (OK / ⚠️ Sospechoso)
  5. El usuario puede corregir valores individuales o marcar "importar de todos modos"
  6. Al confirmar, se ejecutan todas las actualizaciones en lote usando `updateHorasActuales` existente, disparando todos los triggers normales (historial, notificaciones, etc.)

### Implementación técnica
- **Nueva Edge Function `voice-parse-updates`**: Recibe el texto transcrito, usa Lovable AI (Gemini) para extraer las fichas y horas de forma inteligente (maneja variaciones como "ficha alfa charlie cero tres" → "AC-003"), valida contra la DB, calcula anomalías
- **Componente `VoiceMultiUpdate`**: UI de grabación, transcripción en vivo, tabla de validación, botones de confirmar/corregir
- Se integra como nueva pestaña/sección en el panel flotante existente

### Detección de anomalías
- Se calcula: `días_transcurridos = (hoy - fecha_ultima_actualizacion)` y `max_horas_posibles = días * 9`
- Si `incremento > max_horas_posibles * 1.2`, se marca como sospechoso con badge amarillo
- Si `incremento < 0`, se marca como error (lectura menor a la actual)

---

## 2. Filtros en Sección de Reportes

### Cambios
- Agregar barra de búsqueda y filtros encima de las tablas de "Equipos con lectura registrada" y "Equipos pendientes" en el panel flotante
- Filtros: búsqueda por texto (ficha/nombre), filtro por categoría (dropdown), ordenamiento (por ficha, por nombre, por fecha)
- Aplicar los mismos filtros a ambas tablas simultáneamente

### Implementación
- Estados de filtro locales en `ControlMantenimientoProfesional.tsx`
- `useMemo` para filtrar `resumenActualizaciones.actualizados` y `resumenActualizaciones.pendientes`
- Componentes `Input` + `Select` compactos sobre las tablas

---

## 3. Cambio de Ficha con Preservación de Historial

### Cómo funciona
- Nuevo botón "Cambiar Ficha" en el diálogo de edición de equipo (`EquipoDialog`)
- Al cambiar la ficha:
  1. Se registra en `historial_eventos` el cambio (ficha anterior → ficha nueva)
  2. Se actualiza la ficha en **todas las tablas referenciadas**:
     - `equipos.ficha`
     - `mantenimientos_programados.ficha`
     - `historial_eventos.ficha_equipo`
     - `equipment_tickets.ficha`
     - `notificaciones.ficha_equipo`
     - `overrides_planes.ficha_equipo`
  3. Todo ocurre en una sola migración SQL con una función `cambiar_ficha_equipo(old_ficha, new_ficha)`

### Implementación
- **Migración SQL**: Crear función `cambiar_ficha_equipo(p_old_ficha text, p_new_ficha text)` que actualiza todas las tablas en una transacción
- **UI**: Campo especial en `EquipoDialog` que muestra la ficha actual y permite cambiarla, con confirmación
- **Hook**: Nuevo método `cambiarFichaEquipo` en `useSupabaseData` que llama al RPC

---

## 4. Ocultar Equipos Inactivos

### Cambios
- Revisar todos los comboboxes/selectores de equipos y filtrar solo `activo = true`:
  - `EquipoSelectorDialog` (ya usa `activeEquipos` en algunos lugares)
  - Panel flotante: la búsqueda rápida por ficha debe ignorar inactivos
  - Selectores en formularios de mantenimiento
  - Selectores en tickets
- En `ControlMantenimientoProfesional`, el `useEffect` que busca por `fichaRapida` ya filtra por `data.mantenimientosProgramados` pero necesita verificar `activo`
- Asegurar consistencia en toda la app

### Archivos afectados
- `src/pages/ControlMantenimientoProfesional.tsx` (búsqueda rápida)
- `src/components/EquipoSelectorDialog.tsx`
- `src/pages/Mantenimiento.tsx` (formularios)
- `src/pages/GestorTickets.tsx` (selector de equipos)

---

## Orden de implementación

1. Ocultar equipos inactivos (más simple, impacto inmediato)
2. Filtros en reportes del panel flotante
3. Cambio de ficha con historial (migración SQL + UI)
4. Actualización por voz multi-ficha (más complejo, Edge Function + STT + UI)

## Archivos principales a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/voice-parse-updates/index.ts` | Crear - parseo de voz con AI |
| `src/components/VoiceMultiUpdate.tsx` | Crear - UI de grabación y validación |
| `src/pages/ControlMantenimientoProfesional.tsx` | Modificar - integrar voz + filtros |
| `src/components/equipos/EquipoDialog.tsx` | Modificar - cambio de ficha |
| `src/hooks/useSupabaseData.ts` | Modificar - método cambiarFicha |
| Migración SQL | Crear - función `cambiar_ficha_equipo` |
| Varios selectores | Modificar - filtrar inactivos |

