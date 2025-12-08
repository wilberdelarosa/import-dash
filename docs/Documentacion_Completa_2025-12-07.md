Documentación completa del proyecto import-dash
Fecha: 2025-12-07

Resumen ejecutivo
-----------------
Este documento describe en detalle la arquitectura, módulos, flujos de datos, dependencias, scripts y procedimientos operativos del proyecto `import-dash` (aplicación React + Vite con capacidades móviles via Capacitor/Electron y backend en Supabase). Incluye una descripción por módulos, lista de archivos, cómo ejecutar y construir el proyecto, cómo regenerar diagramas, detalles de datos y recomendaciones de mantenimiento.

Objetivo de la aplicación
-------------------------
Import-dash es una plataforma de gestión de mantenimiento para flota de equipos (equipos pesados), que centraliza:
- Inventario de equipos
- Planes de mantenimiento y planificador inteligente
- Historial de mantenimientos y lecturas de horas/km
- Importación y consumo de datos de catálogo Caterpillar
- Módulos móviles para mecánicos y operarios (Capacitor/Electron)
- Integración con Supabase para persistencia y autenticación

Estructura general del repositorio
----------------------------------
- `src/`: Código fuente frontend (React + TypeScript). Contiene `pages/`, `components/`, `hooks/`, `context/`, `lib/`, `types/`, `integrations/`.
- `android/`: Proyecto Android (Capacitor) para generar APKs.
- `scripts/`: Scripts auxiliares (generación de diagramas PlantUML, etc.).
- `diagrams/`: PlantUML y diagramas generados (.puml, .png, .pdf).
- `docs/`: (este archivo) documentación del proyecto.
- `supabase/`: configuración y funciones relacionadas con Supabase.

Cómo funciona (visión de alto nivel)
-----------------------------------
1. La UI (React) consume datos a través del `SupabaseDataContext` (contexto global que mantiene caches de tablas importantes).
2. Los `hooks/*` encapsulan la lógica de fetch y cálculo (por ejemplo `useSugerenciaMantenimiento`, `useCaterpillarData`), ofreciendo datos limpios a los componentes.
3. Los `pages/*` representan vistas principales (Equipos, Mantenimiento, Planificador, Dashboard, etc.).
4. El `PlanificadorInteligente` combina datos de planes y sugerencias para generar intervenciones programadas.
5. Importaciones de catálogo Caterpillar se realizan desde `integrations/` y se usan para sugerir piezas y tareas por intervalo.
6. Módulos móviles usan layouts específicos (`components/mobile/*`) y se empaqueta con Capacitor/Electron para mobile/desktop.

Módulos y responsabilidades (por área)
--------------------------------------
- Pages (src/pages): Entradas principales de la app (rutas). Ejemplos: `Equipos.tsx`, `Planificador.tsx`, `Mantenimiento.tsx`, `ImportarDatosCaterpillar.tsx`, `Reportes.tsx`, `Dashboard.tsx`.
- Components (src/components): UI reutilizable y componentes específicos (EquipoDetalleUnificado, EquiposTable, CaterpillarDataCard, NotificationCenter, Layout, Navigation, etc.). Subcarpetas: `ui/` (componentes base), `mobile/`, `equipos/`, `admin/`, `responsive/`.
- Hooks (src/hooks): Lógica reutilizable: `useHistorial`, `useCaterpillarData`, `useSugerenciaMantenimiento`, `usePlanes`, `useSupabaseData`, `useUserRoles`, `useMechanicSubmissions`, entre otros.
- Context (src/context): Contextos React: `SupabaseDataContext` (fuente principal de datos), `AuthContext`, `SystemConfigContext`.
- Types (src/types): Definiciones TypeScript (equipment, maintenance-plans, historial, caterpillar, planificacion, config, chat, etc.).
- Lib (src/lib): Utilidades y funciones de negocio reutilizables: `maintenanceUtils.ts`, `utils.ts`, `logger.ts`, `constants.ts`.
- Integrations (src/integrations): Clientes para servicios externos: `supabase/client.ts`, `groq/client.ts`, `supabase/types.ts`.

Flujos de datos clave
---------------------
- Carga inicial: `SupabaseDataContext` solicita datasets principales (equipos, mantenimientosProgramados, mantenimientosRealizados, actualizacionesHorasKm, inventarios) y los mantiene en memoria como cache para que componentes y hooks los consuman.
- Detalle de un equipo: al abrir `EquipoDetalleUnificado`, se consultan hooks (`useHistorial`, `useCaterpillarData`) y se filtran/ordenan datos (mantenimientos próximos, últimos, lecturas) para presentar métricas y timeline unificado.
- Planificador: calcula intervenciones a partir de planes activos (`usePlanes`) y sugiere intervalos. El Planificador inteligente usa reglas y `useRutasPredictivas` para optimizar asignación.
- Importación Caterpillar: `ImportarDatosCaterpillar.tsx` / `integrations/` consumen datos del catálogo Caterpillar y los guardan o usan para sugerencias de piezas/tareas.

Persistencia y esquema (Supabase)
---------------------------------
Tablas y colecciones más relevantes (nombres aproximados en DB):
- `equipos`: ficha, numeroSerie, marca, modelo, empresa, categoria, horas/km actuales
- `mantenimientos_programados`: ficha, tipoMantenimiento, frecuencia, horasKmRestante, fechaUltimaActualizacion
- `mantenimientos_realizados`: ficha, fechaMantenimiento, horasKmAlMomento, observaciones
- `actualizaciones_horas_km`: ficha, fecha, horasKm, incremento
- `inventarios`: categoriaEquipo, repuestos, cantidades
- `usuarios`, `roles`, `permisos` (para panel admin y controles de acceso)

(Detalles concretos del esquema están en la configuración de Supabase y en `supabase/`.)

Scripts y utilidades importantes
-------------------------------
- `scripts/render_plantuml.cjs` y `scripts/render_any_plantuml.cjs`: descargas de diagramas desde plantuml.com para generar PNG/PDF.
- `scripts/render_plantuml_pdf.cjs`, `scripts/render_plantuml_expanded_png.cjs` existentes para producir artefactos en `diagrams/`.
- `scripts/*` pueden ejecutarse con Node: `node scripts/render_any_plantuml.cjs diagrams/pages.puml`.

Cómo ejecutar y construir
-------------------------
Requisitos locales:
- Node.js (versión compatible; el repo usa `type: module` en package.json)
- npm
- Para builds móviles: Android SDK (si generas APKs), Capacitor, Java JDK

Comandos usuales (PowerShell en Windows):

- Desarrollo (dev):
```powershell
cd c:\Users\wilbe\Proyectos\import-dash
npm run dev
```
- Build para producción:
```powershell
npm run build
```
- Ejecutar el script PlantUML (ejemplo):
```powershell
node scripts/render_any_plantuml.cjs diagrams/pages.puml
```

Mobile / Android (Guía rápida):
- Abrir `android/` con Android Studio y construir el APK; seguir `GUIA_GENERAR_APK.md` en repositorio.

Testing y verificaciones
------------------------
- No hay tests unitarios globales en el repo por defecto. Recomendación: agregar tests a `src/hooks` y `src/lib` (jest + vitest).

Seguridad y buenas prácticas
---------------------------
- No exponer keys; utilizar variables de entorno y el fichero `local.properties` para Android.
- Validar inputs en el backend (Supabase functions) y en el frontend.
- Autorización: revisar `useUserRoles` y componentes `RoleGuard` / `PermissionGuard`.

Diagramas
---------
- PlantUML generados: `diagrams/architecture.puml`, `architecture.png`, `architecture_expanded.puml`, `architecture_expanded.png` y PDFs.
- Scripts de render en `scripts/`.

Cambio y despliegue
-------------------
- Branching: usar `feature/*` para cambios, PRs a `main`.
- CI/CD: configurar job de build en GitHub Actions que haga `npm ci`, `npm run build` y despliegue artefactos estáticos.

Lista completa de archivos (índice)
-----------------------------------
Ver `docs/file_index.txt` para la lista completa de archivos y rutas del repositorio (incluye `src/`, `android/`, `scripts/`, `diagrams/`, `supabase/` y más).

Notas finales y recomendaciones
-------------------------------
- Para una documentación aún más técnica, puedo generar: (1) diagramas UML por subsistema, (2) documentación de APIs Supabase (OpenAPI si aplica), (3) un diagrama de entidades/relaciones a partir de la base de datos.
- Dime si deseas que haga commit automático de estos archivos `docs/*` y `scripts/*` (actualmente no están versionados por este script).

Contacto técnico
-----------------
Si necesitas aclaraciones puntuales sobre cualquier fichero (por ejemplo `EquipoDetalleUnificado.tsx`, `useSugerenciaMantenimiento.ts` o la sincronización con Supabase), indícame el fichero y generaré un resumen técnico específico con diagramas de flujo y secuencia.

---
Fin de la documentación (v2025-12-07)
