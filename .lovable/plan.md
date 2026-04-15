

# Plan: AI Core — MCP Autenticado con Auditoría Completa

## Resumen

Crear un nuevo MCP server **"AI Core"** (`ai-core`) que reemplaza el MCP actual (`mcp-server`). A diferencia del actual que usa `service_role_key` sin auditoría, AI Core:

1. **Autentica** cada request con JWT de usuario admin
2. **Registra todo** en `historial_eventos` — cada insert, update, delete queda trazado
3. **Cubre todos los módulos** con operaciones CRUD completas (no solo lectura + updates parciales)
4. **Genera documentación** de uso integrada como tool

## Problema actual

El MCP existente (`mcp-server`) y el `ai-agent`:
- Usan `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS — sin auditoría
- Las escrituras (updates a equipos, mantenimientos) **no generan entradas en historial_eventos** porque se hacen vía service role sin triggers de auditoría
- Faltan operaciones: crear equipos, crear mantenimientos, crear tickets, gestionar inventario, crear notificaciones, CRUD de kits/planes
- No hay trazabilidad de quién (IA vs usuario) ejecutó cada acción

## Solución

### 1. Nueva Edge Function: `supabase/functions/ai-core/index.ts`

**Autenticación:**
- Valida JWT del header `Authorization`
- Verifica que el usuario tenga rol `admin` via `has_role()`
- Rechaza con 403 si no es admin

**Auditoría integrada — cada tool de escritura:**
- Inserta en `historial_eventos` antes o después de la operación
- Registra: `usuario_responsable` = email del admin, `tipo_evento` = acción, `datos_antes`/`datos_despues`
- Esto dispara los triggers existentes (notificaciones, inventario post-mantenimiento)

**Tools completos (~35 herramientas):**

| Módulo | Read | Create | Update | Delete |
|--------|------|--------|--------|--------|
| Equipos | list, get, search | create | update, cambiar_ficha | deactivate |
| Mantenimientos | list, get | create | update_horas, registrar_mant | deactivate |
| Inventario | list, get, stock_bajo | create | update, mover_stock | deactivate |
| Tickets | list, get | create | update_status, assign | close |
| Notificaciones | list, pendientes | create | mark_read, mark_all_read | delete |
| Historial | list, search | — | — | — |
| Kits | list, get | create | update | deactivate |
| Planes | list, get | create | update | deactivate |
| Submissions | list, get | — | approve, reject | — |
| Config | get | — | update | — |
| Dashboard | summary, kpis | — | — | — |
| Users | list | — | update_role | — |
| Docs | get_api_docs | — | — | — |

**Ejemplo de tool con auditoría:**
```
create_equipo → INSERT equipo → INSERT historial_eventos (tipo='equipo_creado')
update_horas → UPDATE mantenimiento → INSERT historial_eventos (tipo='lectura_actualizada')
registrar_mantenimiento → UPDATE mantenimiento + INSERT historial (tipo='mantenimiento_realizado')
```

### 2. Migración SQL: Tabla `ai_audit_log`

Nueva tabla dedicada para auditoría de acciones de IA:

```
ai_audit_log:
  id, created_at, user_id, user_email, tool_name, 
  tool_args (jsonb), result_summary (text), 
  affected_table, affected_id, success (boolean)
```

Esto complementa `historial_eventos` (que es la auditoría de negocio) con una auditoría técnica de cada llamada de tool.

### 3. Actualizar `ai-agent` para usar AI Core tools

- Ampliar la lista de `tools` en el ai-agent para incluir las nuevas operaciones de creación
- Las operaciones de escritura usarán la misma lógica de auditoría
- El agente podrá: crear equipos, registrar mantenimientos, gestionar tickets completos, mover inventario

### 4. Tool de documentación

Un tool `get_api_docs` que retorna la documentación completa de todas las herramientas disponibles, sus parámetros y ejemplos de uso. Esto permite que cualquier cliente MCP externo (n8n, WhatsApp bot, etc.) sepa qué puede hacer.

### 5. Config en `supabase/config.toml`

```toml
[functions.ai-core]
verify_jwt = false  # validación in-code
```

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/ai-core/index.ts` | Crear — MCP server completo con auditoría |
| `supabase/functions/ai-core/deno.json` | Crear — imports mcp-lite + hono |
| `supabase/functions/ai-agent/index.ts` | Modificar — ampliar tools con CRUD completo + auditoría |
| `supabase/config.toml` | Modificar — agregar `[functions.ai-core]` |
| Migración SQL | Crear — tabla `ai_audit_log` con RLS |

## Orden de implementación

1. Migración SQL: crear `ai_audit_log`
2. Edge Function `ai-core`: MCP autenticado con 35+ tools
3. Actualizar `ai-agent`: expandir tools con auditoría
4. Documentación integrada como tool

