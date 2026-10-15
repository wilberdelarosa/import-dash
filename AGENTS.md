
- mantenimientos_programados: proximo/restante are enforced by DB trigger normalizar_calculo_mantenimiento (proximo = ultimo + frecuencia, restante = proximo - actuales); why: every writer (app, AI agents, RPCs) stays consistent.
- Report WhatsApp exports consume the displayed pending list rather than independently inferring a period; why: filters and period-scoped archive exclusions stay consistent across report and export.
- Floating report and WhatsApp windows share FloatingReportPanel with portal rendering and bounded drag/resize; why: viewport constraints, fullscreen restoration and scroll behavior remain consistent.
- List sections (equipment, maintenance, dashboard, history, reports) share src/lib/list-fields.ts and FieldFilterControls for field search and sorting; why: ficha numeric order with EIRL-before-GROUP grouping stays consistent everywhere.
- Maintenance status (restante, proximo, vencido/proximo/ok, display clamp ≥0) comes only from src/lib/maintenance-status.ts using the configured alerta_preventiva threshold; why: dashboard, lists, reports and notifications must classify identically and match the DB trigger.
- Table reads that can exceed 1000 rows go through src/lib/fetch-all.ts; why: PostgREST silently caps responses.
- Notifications use only useUnifiedNotifications + UnifiedNotificationCenter; why: a single source keeps badge counts and read state consistent.
- Mobile overlays use the shared dialog/sheet primitives (layered above the bottom nav, max 90svh with internal scroll) and MobileSheet; status colors use success/warning/destructive tokens; why: consistent responsive behavior and theming.
