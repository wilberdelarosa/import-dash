---
name: AI Core MCP Server
description: Authenticated, auditable MCP server (ai-core) with 35 tools covering full CRUD across all modules
type: feature
---
AI Core is the authenticated MCP server replacing the old `mcp-server`. Edge function: `supabase/functions/ai-core/index.ts`.

**Authentication:** Validates JWT + admin role via `has_role()`. Rejects non-admin with 403.

**Audit:** Every write operation logs to both `historial_eventos` (business audit) and `ai_audit_log` (technical audit).

**35 Tools across all modules:**
- Equipos: list, get, search, create, update, deactivate, cambiar_ficha
- Mantenimientos: list, update_horas, registrar_mantenimiento, create
- Inventario: list, create, update, mover_stock
- Tickets: list, create, update
- Notificaciones: list, create, mark_read
- Historial: list (read-only)
- Submissions: list, approve, reject
- Kits: list, create
- Planes: list, create
- Users: list, update_role
- Config: get, update
- Dashboard: summary
- Audit: list_audit_log
- Docs: get_api_docs

**Config:** `supabase/config.toml` has `[functions.ai-core] verify_jwt = false` (validated in-code).

**ai_audit_log table:** Tracks user_id, user_email, tool_name, tool_args, result_summary, affected_table, affected_id, success. RLS: admin read, service_role + admin insert.
