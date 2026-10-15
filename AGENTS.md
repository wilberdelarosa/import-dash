
- mantenimientos_programados: proximo/restante are enforced by DB trigger normalizar_calculo_mantenimiento (proximo = ultimo + frecuencia, restante = proximo - actuales); why: every writer (app, AI agents, RPCs) stays consistent.
- Report WhatsApp exports consume the displayed pending list rather than independently inferring a period; why: filters and period-scoped archive exclusions stay consistent across report and export.
- Floating report and WhatsApp windows share FloatingReportPanel with portal rendering and bounded drag/resize; why: viewport constraints, fullscreen restoration and scroll behavior remain consistent.
- List sections (equipment, maintenance, dashboard, history, reports) share src/lib/list-fields.ts and FieldFilterControls for field search and sorting; why: ficha numeric order with EIRL-before-GROUP grouping stays consistent everywhere.
