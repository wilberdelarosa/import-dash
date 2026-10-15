# Plan de estabilización y refactor por módulos (v2)

Objetivo: corregir fallos, quitar duplicidades, igualar móvil y web, dejar el código ordenado y preparado para crecer con agentes locales. Se trabaja por fases; cada fase deja la app funcionando y se verifica en móvil y escritorio antes de pasar a la siguiente.

## Hallazgos principales

**Duplicidades**
- Panel principal: la tarjeta "Alertas de Mantenimiento" (AlertasProximidad) repite los Próximos/Vencidos que ya están arriba.
- Notificaciones: 3 sistemas en paralelo (useNotificaciones, useNotifications, useUnifiedNotifications) y 3 centros (NotificacionesCentro, NotificationCenter, UnifiedNotificationCenter). Por eso aparecen avisos repetidos, conteos distintos y "leídas" que no se sincronizan.
- Dos planificadores (Planificador sin ruta, PlanificadorInteligente con ruta).
- Código muerto: KitsMantenimientoMobile (nunca se usa), useInventario, useMantenimientosPaginados, PaginationControls.

**Funciones de la web que faltan en el celular**
- Planes de mantenimiento y Kits muestran la versión de escritorio en el celular.
- Control de mantenimiento: no se puede "descartar" un pendiente.
- Reportes: no hay exportación a PDF.
- Planes asignados: el botón Editar solo muestra un aviso, no deja editar.

**Filtros que fallan en el celular**
- Equipos, Inventario, Historial y Tickets: los números de arriba no cambian al filtrar (se calculan con todos los datos y no con la lista filtrada).

**Ventanas y menús en el celular**
- Ventanas sin límite de altura ni desplazamiento (Planes asignados, confirmaciones).
- Altura de las hojas inferiores distinta en cada módulo (60 %, 70 %, 80 %, 85 %, 90 %).
- Capas al mismo nivel que la barra inferior.

**Diseño**
- Colores fijos (verde/ámbar/rojo) en vez de los colores del tema en unas 15 pantallas, lo que rompe el modo oscuro y la consistencia.
- Cada pantalla arma su propia hoja inferior, con bordes y fondos distintos.

**Lógica y sincronización (por confirmar pieza a pieza)**
- Cálculos de horas restantes hechos en pantalla que pueden diferir de la regla oficial de la base (próximo = último + frecuencia).
- Umbrales de "próximo" distintos entre panel, mantenimiento, reportes y notificaciones.
- Listas que cortan en 1000 registros, y cambios que no refrescan otras pantallas.

## Fases

1. **Limpieza** — quitar la tarjeta duplicada de alertas en el panel (web y móvil), borrar el código muerto y el planificador sin uso.
2. **Notificaciones unificadas** — un solo sistema y un solo centro para la campana, la página y el celular, con un conteo y un estado de "leída" comunes.
3. **Reglas de mantenimiento centralizadas** — un único módulo para estado, umbral y horas restantes (nunca negativas), alineado con la base. Lo usan panel, mantenimiento, reportes, control, WhatsApp y notificaciones.
4. **Datos y sincronización** — una sola fuente por tabla, paginación completa, refresco en tiempo real tras cada cambio y errores visibles (no silenciados).
5. **Filtros en el celular** — los números de cada pantalla salen de la lista filtrada. Revisión de cada filtro y de su botón para limpiarlo.
6. **Ventanas y hojas en el celular** — un componente común de hoja y ventana: altura fija estándar, desplazamiento interno, por encima de la barra inferior y sin desbordes.
7. **Paridad móvil** — Planes y Kits con versión para celular, descartar pendiente, PDF en Reportes y edición real en Planes asignados.
8. **Diseño normalizado** — colores de estado como colores del tema (éxito, aviso, peligro) y cabeceras y tarjetas consistentes.
9. **Revisión final por módulo** — recorrido completo con sesión de administrador en móvil y escritorio, y lista de comprobación por módulo.

## Plan de escalamiento (agentes locales)

- Cada módulo con su archivo de reglas (AGENTS.md por carpeta): qué tablas usa, qué reglas cumple y cómo probarlo.
- Pruebas automáticas de las reglas de cálculo, los filtros y los ordenamientos, para que un agente pueda cambiar algo y verificarlo solo.
- Lista de tareas (roadmap) con una fase por módulo para delegar a agentes en paralelo sin pisarse.
- El MCP ALITO AI Core se mantiene como la única vía para que los agentes lean y escriban datos, con auditoría.

## Detalles técnicos

- Fase 1: eliminar AlertasProximidad del Dashboard/DashboardMobile; rm KitsMantenimientoMobile (se recrea en la fase 7 conectado), useInventario, useMantenimientosPaginados, PaginationControls, Planificador.tsx.
- Fase 2: conservar useUnifiedNotifications + UnifiedNotificationCenter como única implementación; migrar BottomNav, MobileLayout, Index, Notificaciones, NotificacionesMobile y Configuraciones; borrar el resto.
- Fase 3: src/lib/maintenance-status.ts (getEstado, restante clamp ≥ 0, umbral de configuraciones_sistema.alerta_preventiva/critica) con tests en vitest.
- Fase 4: helper fetchAll paginado; invalidar tras mutaciones; revisar SupabaseDataContext y hooks duplicados.
- Fase 6: src/components/mobile/MobileSheet.tsx y un ajuste base en DialogContent (max-w-[95vw], max-h-[90svh], overflow-y-auto, capa sobre la barra inferior).
- Fase 8: tokens success/warning en index.css y tailwind.config.ts; reemplazar emerald/amber/rose.
- Cada fase: build, tests y Playwright (1280x1800 y 390x844) con sesión.
