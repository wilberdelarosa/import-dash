import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const app = new Hono();

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const mcpServer = new McpServer({
  name: "import-dash-mcp",
  version: "1.0.0",
});

// ==================== EQUIPOS ====================

mcpServer.tool({
  name: "list_equipos",
  description: "Lista todos los equipos registrados con su información completa (ficha, modelo, marca, categoría, estado activo)",
  inputSchema: {
    type: "object",
    properties: {
      activo: { type: "boolean", description: "Filtrar por equipos activos/inactivos" },
      categoria: { type: "string", description: "Filtrar por categoría (e.g. Excavadora, Cargador)" },
      limit: { type: "number", description: "Límite de resultados (default 100)" },
    },
  },
  handler: async ({ activo, categoria, limit }) => {
    let query = supabaseAdmin.from("equipos").select("*").order("ficha");
    if (activo !== undefined) query = query.eq("activo", activo);
    if (categoria) query = query.eq("categoria", categoria);
    query = query.limit(limit || 100);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "get_equipo",
  description: "Obtiene un equipo específico por su ficha o ID",
  inputSchema: {
    type: "object",
    properties: {
      ficha: { type: "string", description: "Ficha del equipo" },
      id: { type: "number", description: "ID numérico del equipo" },
    },
  },
  handler: async ({ ficha, id }) => {
    let query = supabaseAdmin.from("equipos").select("*");
    if (ficha) query = query.eq("ficha", ficha);
    else if (id) query = query.eq("id", id);
    else return { content: [{ type: "text", text: "Error: se requiere ficha o id" }] };
    const { data, error } = await query.single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_equipo",
  description: "Actualiza campos de un equipo existente (horas, estado activo, motivo inactividad, etc)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID del equipo a actualizar" },
      updates: {
        type: "object",
        description: "Campos a actualizar: activo, motivo_inactividad, nombre, marca, modelo, etc",
      },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }) => {
    const { data, error } = await supabaseAdmin.from("equipos").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Equipo actualizado: ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== MANTENIMIENTOS ====================

mcpServer.tool({
  name: "list_mantenimientos",
  description: "Lista mantenimientos programados. Incluye horas restantes, próximo servicio, estado. Filtra por ficha o estado",
  inputSchema: {
    type: "object",
    properties: {
      ficha: { type: "string", description: "Filtrar por ficha de equipo" },
      vencidos: { type: "boolean", description: "true = solo vencidos (horas_km_restante < 0)" },
      limit: { type: "number" },
    },
  },
  handler: async ({ ficha, vencidos, limit }) => {
    let query = supabaseAdmin.from("mantenimientos_programados").select("*").eq("activo", true).order("horas_km_restante");
    if (ficha) query = query.eq("ficha", ficha);
    if (vencidos) query = query.lt("horas_km_restante", 0);
    query = query.limit(limit || 100);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_mantenimiento",
  description: "Actualiza horas/km actuales de un mantenimiento programado y recalcula horas restantes",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID del mantenimiento" },
      horas_km_actuales: { type: "number", description: "Nuevas horas/km actuales del equipo" },
    },
    required: ["id", "horas_km_actuales"],
  },
  handler: async ({ id, horas_km_actuales }) => {
    const { data: mant } = await supabaseAdmin.from("mantenimientos_programados").select("proximo_mantenimiento").eq("id", id).single();
    if (!mant) return { content: [{ type: "text", text: "Mantenimiento no encontrado" }] };
    const restante = mant.proximo_mantenimiento - horas_km_actuales;
    const { data, error } = await supabaseAdmin
      .from("mantenimientos_programados")
      .update({ horas_km_actuales, horas_km_restante: restante, fecha_ultima_actualizacion: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Actualizado. Restante: ${restante} hrs. ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== INVENTARIO ====================

mcpServer.tool({
  name: "list_inventario",
  description: "Lista items de inventario (piezas, filtros, aceites). Filtra por stock bajo, tipo, categoría",
  inputSchema: {
    type: "object",
    properties: {
      stock_bajo: { type: "boolean", description: "true = solo items con cantidad <= stock_minimo" },
      tipo: { type: "string", description: "Filtrar por tipo de item" },
      categoria_equipo: { type: "string", description: "Filtrar por categoría de equipo" },
      limit: { type: "number" },
    },
  },
  handler: async ({ stock_bajo, tipo, categoria_equipo, limit }) => {
    let query = supabaseAdmin.from("inventarios").select("*").eq("activo", true).order("nombre");
    if (tipo) query = query.eq("tipo", tipo);
    if (categoria_equipo) query = query.eq("categoria_equipo", categoria_equipo);
    query = query.limit(limit || 200);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    const result = stock_bajo ? data?.filter((i: any) => i.cantidad <= i.stock_minimo) : data;
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_inventario",
  description: "Actualiza cantidad u otros campos de un item de inventario",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID del item" },
      updates: { type: "object", description: "Campos: cantidad, stock_minimo, ubicacion, nombre, etc" },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }) => {
    const { data, error } = await supabaseAdmin.from("inventarios").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Inventario actualizado: ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== TICKETS ====================

mcpServer.tool({
  name: "list_tickets",
  description: "Lista tickets de equipo (reportes de problemas). Filtra por status, prioridad, equipo",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", description: "Filtrar: abierto, en_progreso, cerrado, etc" },
      prioridad: { type: "string", description: "alta, media, baja" },
      ficha: { type: "string", description: "Filtrar por ficha de equipo" },
      limit: { type: "number" },
    },
  },
  handler: async ({ status, prioridad, ficha, limit }) => {
    let query = supabaseAdmin.from("equipment_tickets").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (prioridad) query = query.eq("prioridad", prioridad);
    if (ficha) query = query.eq("ficha", ficha);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_ticket",
  description: "Actualiza un ticket: cambiar status, asignar, agregar notas admin, resolución, etc",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "UUID del ticket" },
      updates: { type: "object", description: "Campos: status, assigned_to, notas_admin, prioridad, resolucion, etc" },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }) => {
    const { data, error } = await supabaseAdmin.from("equipment_tickets").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Ticket actualizado: ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== USUARIOS Y ROLES ====================

mcpServer.tool({
  name: "list_users",
  description: "Lista todos los usuarios del sistema con sus emails y roles",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data: users, error: usersErr } = await supabaseAdmin.rpc("get_users_with_emails");
    if (usersErr) return { content: [{ type: "text", text: `Error: ${usersErr.message}` }] };
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const result = (users || []).map((u: any) => ({ ...u, role: roleMap.get(u.id) || "user" }));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_user_role",
  description: "Cambia el rol de un usuario: admin, supervisor, mechanic, user",
  inputSchema: {
    type: "object",
    properties: {
      user_id: { type: "string", description: "UUID del usuario" },
      role: { type: "string", enum: ["admin", "supervisor", "mechanic", "user"], description: "Nuevo rol" },
    },
    required: ["user_id", "role"],
  },
  handler: async ({ user_id, role }) => {
    const { data: existing } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", user_id).single();
    let result;
    if (existing) {
      result = await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", user_id).select().single();
    } else {
      result = await supabaseAdmin.from("user_roles").insert({ user_id, role }).select().single();
    }
    if (result.error) return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    return { content: [{ type: "text", text: `Rol actualizado a '${role}' para ${user_id}` }] };
  },
});

// ==================== NOTIFICACIONES ====================

mcpServer.tool({
  name: "list_notificaciones",
  description: "Lista notificaciones del sistema. Filtra por tipo, nivel, leídas/no leídas",
  inputSchema: {
    type: "object",
    properties: {
      tipo: { type: "string", description: "mantenimiento_vencido, mantenimiento_proximo, stock_bajo, etc" },
      nivel: { type: "string", description: "critical, warning, info" },
      leida: { type: "boolean" },
      limit: { type: "number" },
    },
  },
  handler: async ({ tipo, nivel, leida, limit }) => {
    let query = supabaseAdmin.from("notificaciones").select("*").order("created_at", { ascending: false });
    if (tipo) query = query.eq("tipo", tipo);
    if (nivel) query = query.eq("nivel", nivel);
    if (leida !== undefined) query = query.eq("leida", leida);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "mark_notificacion_read",
  description: "Marca una o todas las notificaciones como leídas",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "ID de la notificación (omitir para marcar todas)" },
    },
  },
  handler: async ({ id }) => {
    let query = supabaseAdmin.from("notificaciones").update({ leida: true });
    if (id) query = query.eq("id", id);
    else query = query.eq("leida", false);
    const { error, count } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: id ? `Notificación ${id} marcada como leída` : `Todas las notificaciones marcadas como leídas` }] };
  },
});

// ==================== HISTORIAL ====================

mcpServer.tool({
  name: "list_historial",
  description: "Lista el historial de eventos (mantenimientos realizados, cambios, etc). Filtra por ficha, tipo, módulo",
  inputSchema: {
    type: "object",
    properties: {
      ficha_equipo: { type: "string" },
      tipo_evento: { type: "string" },
      modulo: { type: "string" },
      limit: { type: "number" },
    },
  },
  handler: async ({ ficha_equipo, tipo_evento, modulo, limit }) => {
    let query = supabaseAdmin.from("historial_eventos").select("*").order("created_at", { ascending: false });
    if (ficha_equipo) query = query.eq("ficha_equipo", ficha_equipo);
    if (tipo_evento) query = query.eq("tipo_evento", tipo_evento);
    if (modulo) query = query.eq("modulo", modulo);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== SUBMISSIONS (Reportes de Mecánicos) ====================

mcpServer.tool({
  name: "list_submissions",
  description: "Lista reportes de mantenimiento enviados por mecánicos. Filtra por status: pending, approved, rejected",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", description: "pending, approved, rejected" },
      limit: { type: "number" },
    },
  },
  handler: async ({ status, limit }) => {
    let query = supabaseAdmin.from("maintenance_submissions").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== KITS DE MANTENIMIENTO ====================

mcpServer.tool({
  name: "list_kits",
  description: "Lista kits de mantenimiento con sus piezas asociadas",
  inputSchema: {
    type: "object",
    properties: {
      modelo_aplicable: { type: "string" },
      activo: { type: "boolean" },
    },
  },
  handler: async ({ modelo_aplicable, activo }) => {
    let query = supabaseAdmin.from("kits_mantenimiento").select("*, kit_piezas(*)").order("nombre");
    if (modelo_aplicable) query = query.eq("modelo_aplicable", modelo_aplicable);
    if (activo !== undefined) query = query.eq("activo", activo);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== PLANES DE MANTENIMIENTO ====================

mcpServer.tool({
  name: "list_planes",
  description: "Lista planes de mantenimiento con sus intervalos y kits asociados",
  inputSchema: {
    type: "object",
    properties: {
      marca: { type: "string" },
      categoria: { type: "string" },
      activo: { type: "boolean" },
    },
  },
  handler: async ({ marca, categoria, activo }) => {
    let query = supabaseAdmin.from("planes_mantenimiento").select("*, plan_intervalos(*, plan_intervalo_kits(kit_id))").order("nombre");
    if (marca) query = query.eq("marca", marca);
    if (categoria) query = query.eq("categoria", categoria);
    if (activo !== undefined) query = query.eq("activo", activo);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== DASHBOARD / RESUMEN ====================

mcpServer.tool({
  name: "get_dashboard_summary",
  description: "Obtiene un resumen completo del sistema: total equipos, mantenimientos vencidos, stock bajo, tickets abiertos, notificaciones pendientes",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const [equipos, mantVencidos, mantProximos, stockBajo, ticketsAbiertos, notifPendientes] = await Promise.all([
      supabaseAdmin.from("equipos").select("id", { count: "exact", head: true }).eq("activo", true),
      supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).lt("horas_km_restante", 0),
      supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).gt("horas_km_restante", 0).lte("horas_km_restante", 50),
      supabaseAdmin.from("inventarios").select("id, cantidad, stock_minimo").eq("activo", true),
      supabaseAdmin.from("equipment_tickets").select("id", { count: "exact", head: true }).neq("status", "cerrado"),
      supabaseAdmin.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
    ]);
    const lowStock = (stockBajo.data || []).filter((i: any) => i.cantidad <= i.stock_minimo).length;
    const summary = {
      equipos_activos: equipos.count || 0,
      mantenimientos_vencidos: mantVencidos.count || 0,
      mantenimientos_proximos: mantProximos.count || 0,
      items_stock_bajo: lowStock,
      tickets_abiertos: ticketsAbiertos.count || 0,
      notificaciones_pendientes: notifPendientes.count || 0,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  },
});

// ==================== CONFIGURACIÓN DEL SISTEMA ====================

mcpServer.tool({
  name: "get_config",
  description: "Obtiene la configuración actual del sistema (alertas, notificaciones, etc)",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await supabaseAdmin.from("configuraciones_sistema").select("*").single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool({
  name: "update_config",
  description: "Actualiza configuración del sistema: umbrales de alertas, notificaciones, etc",
  inputSchema: {
    type: "object",
    properties: {
      updates: {
        type: "object",
        description: "Campos: alerta_critica, alerta_preventiva, notificar_email, notificar_whatsapp, correo_soporte, etc",
      },
    },
    required: ["updates"],
  },
  handler: async ({ updates }) => {
    const { data, error } = await supabaseAdmin.from("configuraciones_sistema").update(updates).eq("id", 1).select().single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Config actualizada: ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== TRANSPORT ====================

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
