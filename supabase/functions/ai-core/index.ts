import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const app = new Hono();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ==================== AUTH HELPER ====================

async function authenticateAdmin(req: Request): Promise<{ userId: string; email: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: claimsData, error: claimsErr } = await userClient.auth.getUser(token);
  if (claimsErr || !claimsData?.user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const userId = claimsData.user.id;
  const email = claimsData.user.email || "unknown";

  // Check admin role
  const { data: hasAdmin } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();

  if (!hasAdmin) {
    return new Response(JSON.stringify({ error: "Se requiere rol admin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  return { userId, email };
}

// ==================== AUDIT HELPER ====================

async function audit(params: {
  userId: string;
  email: string;
  toolName: string;
  toolArgs: any;
  resultSummary: string;
  affectedTable?: string;
  affectedId?: string;
  success: boolean;
}) {
  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: params.userId,
    user_email: params.email,
    tool_name: params.toolName,
    tool_args: params.toolArgs,
    result_summary: params.resultSummary,
    affected_table: params.affectedTable || null,
    affected_id: params.affectedId || null,
    success: params.success,
  });
}

async function auditHistory(params: {
  tipoEvento: string;
  modulo: string;
  fichaEquipo?: string;
  nombreEquipo?: string;
  descripcion: string;
  datosAntes?: any;
  datosDespues?: any;
  email: string;
  partesConsumidas?: any;
}) {
  await supabaseAdmin.from("historial_eventos").insert({
    tipo_evento: params.tipoEvento,
    modulo: params.modulo,
    ficha_equipo: params.fichaEquipo || null,
    nombre_equipo: params.nombreEquipo || null,
    descripcion: params.descripcion,
    datos_antes: params.datosAntes || null,
    datos_despues: params.datosDespues || null,
    usuario_responsable: `AI Core (${params.email})`,
    nivel_importancia: "info",
    partes_consumidas: params.partesConsumidas || null,
  });
}

// Store auth context per request
let currentAuth: { userId: string; email: string } | null = null;

// ==================== MCP SERVER ====================

const mcpServer = new McpServer({
  name: "ai-core",
  version: "2.0.0",
});

// ==================== EQUIPOS ====================

mcpServer.tool("list_equipos", {
  description: "Lista equipos. Filtra por activo, categoría, marca, empresa, segmento",
  inputSchema: {
    type: "object" as const,
    properties: {
      activo: { type: "boolean" as const },
      categoria: { type: "string" as const },
      marca: { type: "string" as const },
      empresa: { type: "string" as const },
      segmento: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("equipos").select("*").order("ficha");
    if (args.activo !== undefined) q = q.eq("activo", args.activo);
    if (args.categoria) q = q.eq("categoria", args.categoria);
    if (args.marca) q = q.ilike("marca", `%${args.marca}%`);
    if (args.empresa) q = q.eq("empresa", args.empresa);
    if (args.segmento) q = q.eq("segmento", args.segmento);
    q = q.limit(args.limit || 100);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("get_equipo", {
  description: "Obtiene un equipo por ficha o ID",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const },
      id: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("equipos").select("*");
    if (args.ficha) q = q.eq("ficha", args.ficha);
    else if (args.id) q = q.eq("id", args.id);
    else return { content: [{ type: "text" as const, text: "Se requiere ficha o id" }] };
    const { data, error } = await q.single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("search_equipos", {
  description: "Busca equipos por texto en nombre, ficha, modelo, marca",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string" as const, description: "Texto de búsqueda" },
    },
    required: ["query"],
  },
  handler: async (args: any) => {
    const q = args.query;
    const { data, error } = await supabaseAdmin.from("equipos").select("*")
      .or(`nombre.ilike.%${q}%,ficha.ilike.%${q}%,modelo.ilike.%${q}%,marca.ilike.%${q}%`)
      .order("ficha").limit(50);
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("create_equipo", {
  description: "Crea un equipo nuevo. Campos requeridos: ficha, nombre, marca, modelo, categoria, numero_serie, placa",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const },
      nombre: { type: "string" as const },
      marca: { type: "string" as const },
      modelo: { type: "string" as const },
      categoria: { type: "string" as const },
      numero_serie: { type: "string" as const },
      placa: { type: "string" as const },
      empresa: { type: "string" as const },
      segmento: { type: "string" as const },
    },
    required: ["ficha", "nombre", "marca", "modelo", "categoria", "numero_serie", "placa"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("equipos").insert({
      ficha: args.ficha, nombre: args.nombre, marca: args.marca, modelo: args.modelo,
      categoria: args.categoria, numero_serie: args.numero_serie, placa: args.placa,
      empresa: args.empresa || "ALITO EIRL", segmento: args.segmento || null,
    }).select().single();
    if (error) {
      await audit({ ...auth, toolName: "create_equipo", toolArgs: args, resultSummary: error.message, affectedTable: "equipos", success: false });
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }
    await auditHistory({ tipoEvento: "equipo_creado", modulo: "equipos", fichaEquipo: args.ficha, nombreEquipo: args.nombre, descripcion: `Equipo ${args.ficha} creado por AI Core`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_equipo", toolArgs: args, resultSummary: `Equipo ${args.ficha} creado`, affectedTable: "equipos", affectedId: String(data.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_equipo", {
  description: "Actualiza campos de un equipo",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const },
      updates: { type: "object" as const, description: "Campos a actualizar" },
    },
    required: ["id", "updates"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: before } = await supabaseAdmin.from("equipos").select("*").eq("id", args.id).single();
    const { data, error } = await supabaseAdmin.from("equipos").update(args.updates).eq("id", args.id).select().single();
    if (error) {
      await audit({ ...auth, toolName: "update_equipo", toolArgs: args, resultSummary: error.message, affectedTable: "equipos", success: false });
      return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    }
    await auditHistory({ tipoEvento: "equipo_actualizado", modulo: "equipos", fichaEquipo: data.ficha, nombreEquipo: data.nombre, descripcion: `Equipo ${data.ficha} actualizado por AI Core`, datosAntes: before, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "update_equipo", toolArgs: args, resultSummary: `Equipo ${data.ficha} actualizado`, affectedTable: "equipos", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("deactivate_equipo", {
  description: "Desactiva un equipo (no lo elimina)",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const },
      motivo: { type: "string" as const },
    },
    required: ["id", "motivo"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("equipos").update({ activo: false, motivo_inactividad: args.motivo }).eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "equipo_desactivado", modulo: "equipos", fichaEquipo: data.ficha, nombreEquipo: data.nombre, descripcion: `Equipo ${data.ficha} desactivado: ${args.motivo}`, email: auth.email });
    await audit({ ...auth, toolName: "deactivate_equipo", toolArgs: args, resultSummary: `Desactivado: ${data.ficha}`, affectedTable: "equipos", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: `Equipo ${data.ficha} desactivado` }] };
  },
});

mcpServer.tool("cambiar_ficha", {
  description: "Cambia la ficha de un equipo en cascada (todas las tablas)",
  inputSchema: {
    type: "object" as const,
    properties: {
      old_ficha: { type: "string" as const },
      new_ficha: { type: "string" as const },
    },
    required: ["old_ficha", "new_ficha"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.rpc("cambiar_ficha_equipo", { p_old_ficha: args.old_ficha, p_new_ficha: args.new_ficha });
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await audit({ ...auth, toolName: "cambiar_ficha", toolArgs: args, resultSummary: JSON.stringify(data), affectedTable: "equipos", success: (data as any)?.success ?? true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== MANTENIMIENTOS ====================

mcpServer.tool("list_mantenimientos", {
  description: "Lista mantenimientos programados. Filtra por ficha, vencidos, próximos",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const },
      vencidos: { type: "boolean" as const },
      proximos: { type: "boolean" as const, description: "Solo los próximos (restante 0-50)" },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("mantenimientos_programados").select("*").eq("activo", true).order("horas_km_restante");
    if (args.ficha) q = q.eq("ficha", args.ficha);
    if (args.vencidos) q = q.lt("horas_km_restante", 0);
    if (args.proximos) q = q.gte("horas_km_restante", 0).lte("horas_km_restante", 50);
    q = q.limit(args.limit || 100);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_horas", {
  description: "Actualiza horas/km actuales de un mantenimiento y recalcula restantes",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const },
      horas_km_actuales: { type: "number" as const },
    },
    required: ["id", "horas_km_actuales"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: before } = await supabaseAdmin.from("mantenimientos_programados").select("*").eq("id", args.id).single();
    if (!before) return { content: [{ type: "text" as const, text: "No encontrado" }] };
    const restante = before.proximo_mantenimiento - args.horas_km_actuales;
    const { data, error } = await supabaseAdmin.from("mantenimientos_programados")
      .update({ horas_km_actuales: args.horas_km_actuales, horas_km_restante: restante, fecha_ultima_actualizacion: new Date().toISOString() })
      .eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "lectura_actualizada", modulo: "mantenimientos", fichaEquipo: before.ficha, nombreEquipo: before.nombre_equipo, descripcion: `Lectura actualizada: ${before.horas_km_actuales} → ${args.horas_km_actuales}. Restante: ${restante}`, datosAntes: { horas_km_actuales: before.horas_km_actuales }, datosDespues: { horas_km_actuales: args.horas_km_actuales, horas_km_restante: restante }, email: auth.email });
    await audit({ ...auth, toolName: "update_horas", toolArgs: args, resultSummary: `${before.ficha}: ${args.horas_km_actuales} hrs, restante: ${restante}`, affectedTable: "mantenimientos_programados", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: `${before.ficha}: ${args.horas_km_actuales} hrs. Restante: ${restante}` }] };
  },
});

mcpServer.tool("registrar_mantenimiento", {
  description: "Registra un mantenimiento realizado: actualiza horas, recalcula próximo, registra en historial",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const, description: "ID del mantenimiento programado" },
      horas_km_actuales: { type: "number" as const },
      descripcion: { type: "string" as const },
      partes_consumidas: { type: "array" as const, items: { type: "object" as const }, description: "Array de {numero_parte, descripcion, cantidad}" },
    },
    required: ["id", "horas_km_actuales"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: mant } = await supabaseAdmin.from("mantenimientos_programados").select("*").eq("id", args.id).single();
    if (!mant) return { content: [{ type: "text" as const, text: "Mantenimiento no encontrado" }] };
    const nuevoProximo = args.horas_km_actuales + mant.frecuencia;
    const partes = args.partes_consumidas || [];
    const { data, error } = await supabaseAdmin.from("mantenimientos_programados").update({
      horas_km_actuales: args.horas_km_actuales,
      horas_km_ultimo_mantenimiento: args.horas_km_actuales,
      fecha_ultimo_mantenimiento: new Date().toISOString(),
      fecha_ultima_actualizacion: new Date().toISOString(),
      proximo_mantenimiento: nuevoProximo,
      horas_km_restante: nuevoProximo - args.horas_km_actuales,
      partes_consumidas: partes,
    }).eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({
      tipoEvento: "mantenimiento_realizado", modulo: "mantenimientos",
      fichaEquipo: mant.ficha, nombreEquipo: mant.nombre_equipo,
      descripcion: args.descripcion || `Mantenimiento registrado por AI Core a ${args.horas_km_actuales} hrs`,
      datosAntes: { horas_km_actuales: mant.horas_km_actuales, proximo_mantenimiento: mant.proximo_mantenimiento },
      datosDespues: { horas_km_actuales: args.horas_km_actuales, proximo_mantenimiento: nuevoProximo },
      email: auth.email, partesConsumidas: partes,
    });
    await audit({ ...auth, toolName: "registrar_mantenimiento", toolArgs: args, resultSummary: `${mant.ficha}: mant registrado. Próximo: ${nuevoProximo}`, affectedTable: "mantenimientos_programados", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: `Mantenimiento registrado para ${mant.ficha}. Próximo: ${nuevoProximo} hrs` }] };
  },
});

mcpServer.tool("create_mantenimiento", {
  description: "Crea un mantenimiento programado nuevo",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const },
      nombre_equipo: { type: "string" as const },
      tipo_mantenimiento: { type: "string" as const },
      frecuencia: { type: "number" as const },
      horas_km_actuales: { type: "number" as const },
      proximo_mantenimiento: { type: "number" as const },
    },
    required: ["ficha", "nombre_equipo", "tipo_mantenimiento", "frecuencia", "horas_km_actuales", "proximo_mantenimiento"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const restante = args.proximo_mantenimiento - args.horas_km_actuales;
    const { data, error } = await supabaseAdmin.from("mantenimientos_programados").insert({
      ficha: args.ficha, nombre_equipo: args.nombre_equipo, tipo_mantenimiento: args.tipo_mantenimiento,
      frecuencia: args.frecuencia, horas_km_actuales: args.horas_km_actuales,
      proximo_mantenimiento: args.proximo_mantenimiento, horas_km_restante: restante,
    }).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "mantenimiento_creado", modulo: "mantenimientos", fichaEquipo: args.ficha, nombreEquipo: args.nombre_equipo, descripcion: `Mantenimiento programado creado por AI Core`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_mantenimiento", toolArgs: args, resultSummary: `Mantenimiento creado para ${args.ficha}`, affectedTable: "mantenimientos_programados", affectedId: String(data.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== INVENTARIO ====================

mcpServer.tool("list_inventario", {
  description: "Lista inventario. Filtra por stock_bajo, tipo, categoría",
  inputSchema: {
    type: "object" as const,
    properties: {
      stock_bajo: { type: "boolean" as const },
      tipo: { type: "string" as const },
      categoria_equipo: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("inventarios").select("*").eq("activo", true).order("nombre");
    if (args.tipo) q = q.eq("tipo", args.tipo);
    if (args.categoria_equipo) q = q.eq("categoria_equipo", args.categoria_equipo);
    q = q.limit(args.limit || 200);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    const result = args.stock_bajo ? data?.filter((i: any) => i.cantidad <= i.stock_minimo) : data;
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
});

mcpServer.tool("create_inventario", {
  description: "Crea un item de inventario",
  inputSchema: {
    type: "object" as const,
    properties: {
      nombre: { type: "string" as const },
      numero_parte: { type: "string" as const },
      tipo: { type: "string" as const },
      categoria_equipo: { type: "string" as const },
      empresa_suplidora: { type: "string" as const },
      codigo_identificacion: { type: "string" as const },
      cantidad: { type: "number" as const },
      stock_minimo: { type: "number" as const },
    },
    required: ["nombre", "tipo", "categoria_equipo", "empresa_suplidora", "codigo_identificacion"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("inventarios").insert({
      nombre: args.nombre, numero_parte: args.numero_parte || "", tipo: args.tipo,
      categoria_equipo: args.categoria_equipo, empresa_suplidora: args.empresa_suplidora,
      codigo_identificacion: args.codigo_identificacion,
      cantidad: args.cantidad ?? 0, stock_minimo: args.stock_minimo ?? 5,
    }).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "inventario_creado", modulo: "inventario", descripcion: `Item inventario creado: ${args.nombre}`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_inventario", toolArgs: args, resultSummary: `Inventario creado: ${args.nombre}`, affectedTable: "inventarios", affectedId: String(data.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_inventario", {
  description: "Actualiza un item de inventario",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const },
      updates: { type: "object" as const },
    },
    required: ["id", "updates"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: before } = await supabaseAdmin.from("inventarios").select("*").eq("id", args.id).single();
    const { data, error } = await supabaseAdmin.from("inventarios").update(args.updates).eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "inventario_actualizado", modulo: "inventario", descripcion: `Inventario actualizado: ${data.nombre}`, datosAntes: before, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "update_inventario", toolArgs: args, resultSummary: `Actualizado: ${data.nombre}`, affectedTable: "inventarios", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("mover_stock", {
  description: "Mueve stock: suma o resta cantidad de un item",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number" as const },
      cantidad: { type: "number" as const, description: "Positivo=entrada, negativo=salida" },
      motivo: { type: "string" as const },
    },
    required: ["id", "cantidad", "motivo"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: item } = await supabaseAdmin.from("inventarios").select("*").eq("id", args.id).single();
    if (!item) return { content: [{ type: "text" as const, text: "Item no encontrado" }] };
    const nuevaCantidad = Math.max(0, item.cantidad + args.cantidad);
    const { data, error } = await supabaseAdmin.from("inventarios").update({ cantidad: nuevaCantidad }).eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "movimiento_stock", modulo: "inventario", descripcion: `${args.motivo}: ${item.nombre} ${args.cantidad > 0 ? "+" : ""}${args.cantidad} (${item.cantidad}→${nuevaCantidad})`, datosAntes: { cantidad: item.cantidad }, datosDespues: { cantidad: nuevaCantidad }, email: auth.email });
    await audit({ ...auth, toolName: "mover_stock", toolArgs: args, resultSummary: `${item.nombre}: ${item.cantidad}→${nuevaCantidad}`, affectedTable: "inventarios", affectedId: String(args.id), success: true });
    return { content: [{ type: "text" as const, text: `${item.nombre}: ${item.cantidad} → ${nuevaCantidad}` }] };
  },
});

// ==================== TICKETS ====================

mcpServer.tool("list_tickets", {
  description: "Lista tickets. Filtra por status, prioridad, ficha",
  inputSchema: {
    type: "object" as const,
    properties: {
      status: { type: "string" as const },
      prioridad: { type: "string" as const },
      ficha: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("equipment_tickets").select("*").order("created_at", { ascending: false });
    if (args.status) q = q.eq("status", args.status);
    if (args.prioridad) q = q.eq("prioridad", args.prioridad);
    if (args.ficha) q = q.eq("ficha", args.ficha);
    q = q.limit(args.limit || 50);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("create_ticket", {
  description: "Crea un ticket de equipo",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha: { type: "string" as const },
      equipo_id: { type: "number" as const },
      titulo: { type: "string" as const },
      descripcion: { type: "string" as const },
      tipo_problema: { type: "string" as const },
      prioridad: { type: "string" as const },
    },
    required: ["ficha", "equipo_id", "titulo", "descripcion", "tipo_problema"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("equipment_tickets").insert({
      ficha: args.ficha, equipo_id: args.equipo_id, titulo: args.titulo,
      descripcion: args.descripcion, tipo_problema: args.tipo_problema,
      prioridad: args.prioridad || "media", created_by: auth.email,
    }).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "ticket_creado", modulo: "tickets", fichaEquipo: args.ficha, descripcion: `Ticket creado: ${args.titulo}`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_ticket", toolArgs: args, resultSummary: `Ticket creado: ${args.titulo}`, affectedTable: "equipment_tickets", affectedId: data.id, success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("update_ticket", {
  description: "Actualiza un ticket: status, asignar, notas, resolución",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string" as const },
      updates: { type: "object" as const },
    },
    required: ["id", "updates"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: before } = await supabaseAdmin.from("equipment_tickets").select("*").eq("id", args.id).single();
    const { data, error } = await supabaseAdmin.from("equipment_tickets").update(args.updates).eq("id", args.id).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "ticket_actualizado", modulo: "tickets", fichaEquipo: data.ficha, descripcion: `Ticket actualizado: ${data.titulo}`, datosAntes: before, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "update_ticket", toolArgs: args, resultSummary: `Ticket ${data.titulo} actualizado`, affectedTable: "equipment_tickets", affectedId: args.id, success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
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
  handler: async (args: any) => {
    let q = supabaseAdmin.from("notificaciones").select("*").order("created_at", { ascending: false });
    if (args.tipo) q = q.eq("tipo", args.tipo);
    if (args.nivel) q = q.eq("nivel", args.nivel);
    if (args.leida !== undefined) q = q.eq("leida", args.leida);
    q = q.limit(args.limit || 50);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("create_notificacion", {
  description: "Crea una notificación",
  inputSchema: {
    type: "object" as const,
    properties: {
      tipo: { type: "string" as const },
      titulo: { type: "string" as const },
      mensaje: { type: "string" as const },
      nivel: { type: "string" as const, description: "info, warning, critical" },
      ficha_equipo: { type: "string" as const },
      nombre_equipo: { type: "string" as const },
      accion_url: { type: "string" as const },
    },
    required: ["tipo", "titulo", "mensaje"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("notificaciones").insert({
      tipo: args.tipo, titulo: args.titulo, mensaje: args.mensaje,
      nivel: args.nivel || "info", ficha_equipo: args.ficha_equipo || null,
      nombre_equipo: args.nombre_equipo || null, accion_url: args.accion_url || null,
    }).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await audit({ ...auth, toolName: "create_notificacion", toolArgs: args, resultSummary: `Notificación: ${args.titulo}`, affectedTable: "notificaciones", affectedId: String(data.id), success: true });
    return { content: [{ type: "text" as const, text: `Notificación creada: ${args.titulo}` }] };
  },
});

mcpServer.tool("mark_notificacion_read", {
  description: "Marca notificaciones como leídas (una o todas)",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "number" as const } },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("notificaciones").update({ leida: true });
    if (args.id) q = q.eq("id", args.id);
    else q = q.eq("leida", false);
    const { error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: args.id ? `Notificación ${args.id} leída` : "Todas marcadas como leídas" }] };
  },
});

// ==================== HISTORIAL ====================

mcpServer.tool("list_historial", {
  description: "Historial de eventos. Filtra por ficha, tipo, módulo",
  inputSchema: {
    type: "object" as const,
    properties: {
      ficha_equipo: { type: "string" as const },
      tipo_evento: { type: "string" as const },
      modulo: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("historial_eventos").select("*").order("created_at", { ascending: false });
    if (args.ficha_equipo) q = q.eq("ficha_equipo", args.ficha_equipo);
    if (args.tipo_evento) q = q.eq("tipo_evento", args.tipo_evento);
    if (args.modulo) q = q.eq("modulo", args.modulo);
    q = q.limit(args.limit || 50);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== SUBMISSIONS ====================

mcpServer.tool("list_submissions", {
  description: "Reportes de mecánicos. Filtra por status",
  inputSchema: {
    type: "object" as const,
    properties: {
      status: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("maintenance_submissions").select("*").order("created_at", { ascending: false });
    if (args.status) q = q.eq("status", args.status);
    q = q.limit(args.limit || 50);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("approve_submission", {
  description: "Aprueba un reporte de mecánico e integra al sistema",
  inputSchema: {
    type: "object" as const,
    properties: {
      submission_id: { type: "string" as const },
      feedback: { type: "string" as const },
    },
    required: ["submission_id"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.rpc("approve_and_integrate_submission", {
      p_submission_id: args.submission_id, p_admin_feedback: args.feedback || "Aprobado por AI Core",
    });
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await audit({ ...auth, toolName: "approve_submission", toolArgs: args, resultSummary: JSON.stringify(data), affectedTable: "maintenance_submissions", affectedId: args.submission_id, success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("reject_submission", {
  description: "Rechaza un reporte de mecánico",
  inputSchema: {
    type: "object" as const,
    properties: {
      submission_id: { type: "string" as const },
      feedback: { type: "string" as const },
    },
    required: ["submission_id", "feedback"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.rpc("reject_submission", {
      p_submission_id: args.submission_id, p_feedback: args.feedback,
    });
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await audit({ ...auth, toolName: "reject_submission", toolArgs: args, resultSummary: JSON.stringify(data), affectedTable: "maintenance_submissions", affectedId: args.submission_id, success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== KITS ====================

mcpServer.tool("list_kits", {
  description: "Kits de mantenimiento con piezas",
  inputSchema: {
    type: "object" as const,
    properties: {
      modelo_aplicable: { type: "string" as const },
      activo: { type: "boolean" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("kits_mantenimiento").select("*, kit_piezas(*)").order("nombre");
    if (args.modelo_aplicable) q = q.eq("modelo_aplicable", args.modelo_aplicable);
    if (args.activo !== undefined) q = q.eq("activo", args.activo);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("create_kit", {
  description: "Crea un kit de mantenimiento",
  inputSchema: {
    type: "object" as const,
    properties: {
      nombre: { type: "string" as const },
      codigo: { type: "string" as const },
      marca: { type: "string" as const },
      modelo_aplicable: { type: "string" as const },
      categoria: { type: "string" as const },
      intervalo_horas: { type: "number" as const },
      descripcion: { type: "string" as const },
    },
    required: ["nombre", "codigo"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("kits_mantenimiento").insert(args).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "kit_creado", modulo: "kits", descripcion: `Kit creado: ${args.nombre}`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_kit", toolArgs: args, resultSummary: `Kit: ${args.nombre}`, affectedTable: "kits_mantenimiento", affectedId: String(data.id), success: true });
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
  handler: async (args: any) => {
    let q = supabaseAdmin.from("planes_mantenimiento").select("*, plan_intervalos(*, plan_intervalo_kits(kit_id))").order("nombre");
    if (args.marca) q = q.eq("marca", args.marca);
    if (args.categoria) q = q.eq("categoria", args.categoria);
    if (args.activo !== undefined) q = q.eq("activo", args.activo);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

mcpServer.tool("create_plan", {
  description: "Crea un plan de mantenimiento",
  inputSchema: {
    type: "object" as const,
    properties: {
      nombre: { type: "string" as const },
      marca: { type: "string" as const },
      categoria: { type: "string" as const },
      modelo: { type: "string" as const },
      descripcion: { type: "string" as const },
    },
    required: ["nombre", "marca", "categoria"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data, error } = await supabaseAdmin.from("planes_mantenimiento").insert(args).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "plan_creado", modulo: "planes", descripcion: `Plan creado: ${args.nombre}`, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "create_plan", toolArgs: args, resultSummary: `Plan: ${args.nombre}`, affectedTable: "planes_mantenimiento", affectedId: String(data.id), success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== USERS ====================

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
  description: "Cambia el rol de un usuario",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" as const },
      role: { type: "string" as const, description: "admin, supervisor, mechanic, user" },
    },
    required: ["user_id", "role"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: existing } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", args.user_id).single();
    const result = existing
      ? await supabaseAdmin.from("user_roles").update({ role: args.role }).eq("user_id", args.user_id).select().single()
      : await supabaseAdmin.from("user_roles").insert({ user_id: args.user_id, role: args.role }).select().single();
    if (result.error) return { content: [{ type: "text" as const, text: `Error: ${result.error.message}` }] };
    await audit({ ...auth, toolName: "update_user_role", toolArgs: args, resultSummary: `Rol → ${args.role}`, affectedTable: "user_roles", affectedId: args.user_id, success: true });
    return { content: [{ type: "text" as const, text: `Rol actualizado a '${args.role}'` }] };
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
    properties: { updates: { type: "object" as const } },
    required: ["updates"],
  },
  handler: async (args: any) => {
    const auth = currentAuth!;
    const { data: before } = await supabaseAdmin.from("configuraciones_sistema").select("*").eq("id", 1).single();
    const { data, error } = await supabaseAdmin.from("configuraciones_sistema").update(args.updates).eq("id", 1).select().single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    await auditHistory({ tipoEvento: "config_actualizada", modulo: "configuracion", descripcion: "Configuración del sistema actualizada por AI Core", datosAntes: before, datosDespues: data, email: auth.email });
    await audit({ ...auth, toolName: "update_config", toolArgs: args, resultSummary: "Config actualizada", affectedTable: "configuraciones_sistema", affectedId: "1", success: true });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== DASHBOARD ====================

mcpServer.tool("get_dashboard_summary", {
  description: "Resumen del sistema: equipos activos, mantenimientos vencidos/próximos, stock bajo, tickets, notificaciones",
  inputSchema: { type: "object" as const, properties: {} },
  handler: async () => {
    const [equipos, mantVencidos, mantProximos, stockBajo, ticketsAbiertos, notifPendientes, submissions] = await Promise.all([
      supabaseAdmin.from("equipos").select("id", { count: "exact", head: true }).eq("activo", true),
      supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).lt("horas_km_restante", 0),
      supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).gt("horas_km_restante", 0).lte("horas_km_restante", 50),
      supabaseAdmin.from("inventarios").select("id, cantidad, stock_minimo").eq("activo", true),
      supabaseAdmin.from("equipment_tickets").select("id", { count: "exact", head: true }).neq("status", "cerrado"),
      supabaseAdmin.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
      supabaseAdmin.from("maintenance_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
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
          submissions_pendientes: submissions.count || 0,
        }, null, 2),
      }],
    };
  },
});

// ==================== AUDIT LOG ====================

mcpServer.tool("list_audit_log", {
  description: "Lista el registro de auditoría de AI Core",
  inputSchema: {
    type: "object" as const,
    properties: {
      tool_name: { type: "string" as const },
      limit: { type: "number" as const },
    },
  },
  handler: async (args: any) => {
    let q = supabaseAdmin.from("ai_audit_log").select("*").order("created_at", { ascending: false });
    if (args.tool_name) q = q.eq("tool_name", args.tool_name);
    q = q.limit(args.limit || 50);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// ==================== API DOCS ====================

mcpServer.tool("get_api_docs", {
  description: "Documentación completa de todas las herramientas disponibles en AI Core",
  inputSchema: { type: "object" as const, properties: {} },
  handler: async () => {
    const docs = {
      name: "AI Core MCP Server",
      version: "2.0.0",
      description: "MCP autenticado y auditable para gestión completa de Import-Dash",
      auth: "Bearer JWT de usuario admin en header Authorization",
      modules: {
        equipos: {
          tools: ["list_equipos", "get_equipo", "search_equipos", "create_equipo", "update_equipo", "deactivate_equipo", "cambiar_ficha"],
          description: "CRUD completo de equipos con auditoría",
        },
        mantenimientos: {
          tools: ["list_mantenimientos", "update_horas", "registrar_mantenimiento", "create_mantenimiento"],
          description: "Gestión de mantenimientos programados con recálculo automático",
        },
        inventario: {
          tools: ["list_inventario", "create_inventario", "update_inventario", "mover_stock"],
          description: "Gestión de inventario con movimientos de stock",
        },
        tickets: {
          tools: ["list_tickets", "create_ticket", "update_ticket"],
          description: "Sistema de tickets de equipo",
        },
        notificaciones: {
          tools: ["list_notificaciones", "create_notificacion", "mark_notificacion_read"],
          description: "Centro de notificaciones",
        },
        historial: {
          tools: ["list_historial"],
          description: "Consulta de historial de eventos (solo lectura)",
        },
        submissions: {
          tools: ["list_submissions", "approve_submission", "reject_submission"],
          description: "Gestión de reportes de mecánicos",
        },
        kits: {
          tools: ["list_kits", "create_kit"],
          description: "Kits de mantenimiento con piezas",
        },
        planes: {
          tools: ["list_planes", "create_plan"],
          description: "Planes de mantenimiento con intervalos",
        },
        usuarios: {
          tools: ["list_users", "update_user_role"],
          description: "Gestión de usuarios y roles",
        },
        config: {
          tools: ["get_config", "update_config"],
          description: "Configuración del sistema",
        },
        dashboard: {
          tools: ["get_dashboard_summary"],
          description: "KPIs y resumen del sistema",
        },
        audit: {
          tools: ["list_audit_log"],
          description: "Registro de auditoría de AI Core",
        },
      },
      total_tools: 35,
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(docs, null, 2) }] };
  },
});

// ==================== TRANSPORT ====================

const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcpServer);

app.all("/*", async (c) => {
  // Authenticate on every request
  const authResult = await authenticateAdmin(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  currentAuth = authResult;

  return await httpHandler(c.req.raw);
});

Deno.serve(app.fetch);
