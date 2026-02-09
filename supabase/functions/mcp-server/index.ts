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

mcpServer.tool("list_equipos", {
  description: "Lista todos los equipos registrados con su información completa",
  inputSchema: {
    type: "object" as const,
    properties: {
      activo: { type: "boolean" as const, description: "Filtrar por activos/inactivos" },
      categoria: { type: "string" as const, description: "Filtrar por categoría" },
      limit: { type: "number" as const, description: "Límite de resultados" },
    },
  },
  handler: async ({ activo, categoria, limit }: any) => {
    let query = supabaseAdmin.from("equipos").select("*").order("ficha");
    if (activo !== undefined) query = query.eq("activo", activo);
    if (categoria) query = query.eq("categoria", categoria);
    query = query.limit(limit || 100);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("get_equipo", {
  description: "Obtiene un equipo específico por ficha o ID",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const, description: "Ficha del equipo" },
      id: { type: "number" as const, description: "ID numérico" },
    },
  },
  handler: async ({ ficha, id }: any) => {
    let query = supabaseAdmin.from("equipos").select("*");
    if (ficha) query = query.eq("ficha", ficha);
    else if (id) query = query.eq("id", id);
    else return { content: [{ type: "text" as const, text: "Se requiere ficha o id" }] };
    const { data, error } = await query.single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_equipo", {
  description: "Actualiza campos de un equipo existente",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const, description: "ID del equipo" },
      updates: { type: "object" as const, description: "Campos a actualizar" },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }: any) => {
    const { data, error } = await supabaseAdmin.from("equipos").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: `Equipo actualizado: ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== MANTENIMIENTOS ====================

mcpServer.tool("list_mantenimientos", {
  description: "Lista mantenimientos programados con horas restantes, próximo servicio",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const, description: "Filtrar por ficha" },
      vencidos: { type: "boolean" as const, description: "Solo vencidos (restante < 0)" },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ ficha, vencidos, limit }: any) => {
    let query = supabaseAdmin.from("mantenimientos_programados").select("*").eq("activo", true).order("horas_km_restante");
    if (ficha) query = query.eq("ficha", ficha);
    if (vencidos) query = query.lt("horas_km_restante", 0);
    query = query.limit(limit || 100);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_mantenimiento", {
  description: "Actualiza horas/km actuales y recalcula restantes",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const, description: "ID del mantenimiento" },
      horas_km_actuales: { type: "number" as const, description: "Nuevas horas/km" },
    },
    required: ["id", "horas_km_actuales"],
  },
  handler: async ({ id, horas_km_actuales }: any) => {
    const { data: mant } = await supabaseAdmin.from("mantenimientos_programados").select("proximo_mantenimiento").eq("id", id).single();
    if (!mant) return { content: [{ type: "text" as const, text: "No encontrado" }] };
    const restante = mant.proximo_mantenimiento - horas_km_actuales;
    const { data, error } = await supabaseAdmin
      .from("mantenimientos_programados")
      .update({ horas_km_actuales, horas_km_restante: restante, fecha_ultima_actualizacion: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: `Restante: ${restante} hrs. ${JSON.stringify(data, null, 2)}` }] };
  },
});

// ==================== INVENTARIO ====================

mcpServer.tool("list_inventario", {
  description: "Lista inventario de piezas. Filtra por stock bajo, tipo, categoría",
  inputSchema: {
    type: "object" as const,
    properties: {
      stock_bajo: { type: "boolean" as const, description: "Solo items bajo stock mínimo" },
      tipo: { type: "string" as const },
      categoria_equipo: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ stock_bajo, tipo, categoria_equipo, limit }: any) => {
    let query = supabaseAdmin.from("inventarios").select("*").eq("activo", true).order("nombre");
    if (tipo) query = query.eq("tipo", tipo);
    if (categoria_equipo) query = query.eq("categoria_equipo", categoria_equipo);
    query = query.limit(limit || 200);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    const result = stock_bajo ? data?.filter((i: any) => i.cantidad <= i.stock_minimo) : data;
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
});

mcpServer.tool("update_inventario", {
  description: "Actualiza cantidad u otros campos de un item de inventario",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const, description: "ID del item" },
      updates: { type: "object" as const, description: "Campos a actualizar" },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }: any) => {
    const { data, error } = await supabaseAdmin.from("inventarios").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== TICKETS ====================

mcpServer.tool("list_tickets", {
  description: "Lista tickets de equipo. Filtra por status, prioridad, ficha",
  inputSchema: {
    type: "object" as const,
    properties: {
      status: { type: "string" as const },
      prioridad: { type: "string" as const },
      ficha: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ status, prioridad, ficha, limit }: any) => {
    let query = supabaseAdmin.from("equipment_tickets").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (prioridad) query = query.eq("prioridad", prioridad);
    if (ficha) query = query.eq("ficha", ficha);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_ticket", {
  description: "Actualiza un ticket: status, asignar, notas admin, resolución",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string" as const, description: "UUID del ticket" },
      updates: { type: "object" as const },
    },
    required: ["id", "updates"],
  },
  handler: async ({ id, updates }: any) => {
    const { data, error } = await supabaseAdmin.from("equipment_tickets").update(updates).eq("id", id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== USUARIOS Y ROLES ====================

mcpServer.tool("list_users", {
  description: "Lista usuarios con emails y roles",
  inputSchema: { type: "object" as const, properties: {} },
  handler: async () => {
    const { data: users, error } = await supabaseAdmin.rpc("get_users_with_emails");
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const result = (users || []).map((u: any) => ({ ...u, role: roleMap.get(u.id) || "user" }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
});

mcpServer.tool("update_user_role", {
  description: "Cambia el rol de un usuario: admin, supervisor, mechanic, user",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const, description: "UUID del usuario" },
      role: { type: "string" as const, description: "admin, supervisor, mechanic, user" },
    },
    required: ["user_id", "role"],
  },
  handler: async ({ user_id, role }: any) => {
    const { data: existing } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", user_id).single();
    const result = existing
      ? await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", user_id).select().single()
      : await supabaseAdmin.from("user_roles").insert({ user_id, role }).select().single();
    if (result.error) return { content: [{ type: "text" as const, text: `Error: ${result.error.message}` }] };
    return { content: [{ type: "text" as const, text: `Rol actualizado a '${role}' para ${user_id}` }] };
  },
});

// ==================== NOTIFICACIONES ====================

mcpServer.tool("list_notificaciones", {
  description: "Lista notificaciones. Filtra por tipo, nivel, leídas",
  inputSchema: {
    type: "object" as const,
    properties: {
      tipo: { type: "string" as const },
      nivel: { type: "string" as const },
      leida: { type: "boolean" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ tipo, nivel, leida, limit }: any) => {
    let query = supabaseAdmin.from("notificaciones").select("*").order("created_at", { ascending: false });
    if (tipo) query = query.eq("tipo", tipo);
    if (nivel) query = query.eq("nivel", nivel);
    if (leida !== undefined) query = query.eq("leida", leida);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("mark_notificacion_read", {
  description: "Marca notificaciones como leídas (una o todas)",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const, description: "ID específico o vacío para todas" },
    },
  },
  handler: async ({ id }: any) => {
    let query = supabaseAdmin.from("notificaciones").update({ leida: true });
    if (id) query = query.eq("id", id);
    else query = query.eq("leida", false);
    const { error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: id ? `Notificación ${id} leída` : `Todas marcadas como leídas` }] };
  },
});

// ==================== HISTORIAL ====================

mcpServer.tool("list_historial", {
  description: "Historial de eventos del sistema. Filtra por ficha, tipo, módulo",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha_equipo: { type: "string" as const },
      tipo_evento: { type: "string" as const },
      modulo: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ ficha_equipo, tipo_evento, modulo, limit }: any) => {
    let query = supabaseAdmin.from("historial_eventos").select("*").order("created_at", { ascending: false });
    if (ficha_equipo) query = query.eq("ficha_equipo", ficha_equipo);
    if (tipo_evento) query = query.eq("tipo_evento", tipo_evento);
    if (modulo) query = query.eq("modulo", modulo);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== SUBMISSIONS ====================

mcpServer.tool("list_submissions", {
  description: "Reportes de mecánicos. Filtra por status: pending, approved, rejected",
  inputSchema: {
    type: "object" as const,
    properties: {
      status: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async ({ status, limit }: any) => {
    let query = supabaseAdmin.from("maintenance_submissions").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    query = query.limit(limit || 50);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== KITS ====================

mcpServer.tool("list_kits", {
  description: "Kits de mantenimiento con piezas asociadas",
  inputSchema: {
    type: "object" as const,
    properties: {
      modelo_aplicable: { type: "string" as const },
      activo: { type: "boolean" as const },
    },
  },
  handler: async ({ modelo_aplicable, activo }: any) => {
    let query = supabaseAdmin.from("kits_mantenimiento").select("*, kit_piezas(*)").order("nombre");
    if (modelo_aplicable) query = query.eq("modelo_aplicable", modelo_aplicable);
    if (activo !== undefined) query = query.eq("activo", activo);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== PLANES ====================

mcpServer.tool("list_planes", {
  description: "Planes de mantenimiento con intervalos y kits",
  inputSchema: {
    type: "object" as const,
    properties: {
      marca: { type: "string" as const },
      categoria: { type: "string" as const },
      activo: { type: "boolean" as const },
    },
  },
  handler: async ({ marca, categoria, activo }: any) => {
    let query = supabaseAdmin.from("planes_mantenimiento").select("*, plan_intervalos(*, plan_intervalo_kits(kit_id))").order("nombre");
    if (marca) query = query.eq("marca", marca);
    if (categoria) query = query.eq("categoria", categoria);
    if (activo !== undefined) query = query.eq("activo", activo);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== DASHBOARD ====================

mcpServer.tool("get_dashboard_summary", {
  description: "Resumen: equipos activos, mantenimientos vencidos, stock bajo, tickets abiertos, notificaciones",
  inputSchema: { type: "object" as const, properties: {} },
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
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          equipos_activos: equipos.count || 0,
          mantenimientos_vencidos: mantVencidos.count || 0,
          mantenimientos_proximos: mantProximos.count || 0,
          items_stock_bajo: lowStock,
          tickets_abiertos: ticketsAbiertos.count || 0,
          notificaciones_pendientes: notifPendientes.count || 0,
        }, null, 2),
      }],
    };
  },
});

// ==================== CONFIG ====================

mcpServer.tool("get_config", {
  description: "Configuración actual del sistema",
  inputSchema: { type: "object" as const, properties: {} },
  handler: async () => {
    const { data, error } = await supabaseAdmin.from("configuraciones_sistema").select("*").single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_config", {
  description: "Actualiza configuración del sistema",
  inputSchema: {
    type: "object" as const,
    properties: {
      updates: { type: "object" as const, description: "Campos a actualizar" },
    },
    required: ["updates"],
  },
  handler: async ({ updates }: any) => {
    const { data, error } = await supabaseAdmin.from("configuraciones_sistema").update(updates).eq("id", 1).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== TRANSPORT ====================

const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcpServer);

app.all("/*", async (c) => {
  return await httpHandler(c.req.raw);
});

Deno.serve(app.fetch);
