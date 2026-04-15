import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ==================== AUDIT HELPERS ====================

async function auditLog(email: string, toolName: string, toolArgs: any, result: string, table?: string, id?: string, success = true) {
  await supabaseAdmin.from("ai_audit_log").insert({
    user_email: email, tool_name: toolName, tool_args: toolArgs,
    result_summary: result.slice(0, 500), affected_table: table, affected_id: id, success,
  });
}

async function auditHistory(p: { tipo: string; modulo: string; ficha?: string; nombre?: string; desc: string; antes?: any; despues?: any; email: string; partes?: any }) {
  await supabaseAdmin.from("historial_eventos").insert({
    tipo_evento: p.tipo, modulo: p.modulo, ficha_equipo: p.ficha || null, nombre_equipo: p.nombre || null,
    descripcion: p.desc, datos_antes: p.antes || null, datos_despues: p.despues || null,
    usuario_responsable: `ALITO BOT (${p.email})`, nivel_importancia: "info", partes_consumidas: p.partes || null,
  });
}

// ==================== TOOL DEFINITIONS ====================

const tools = [
  // READ tools
  { type: "function", function: { name: "list_equipos", description: "Lista equipos. Filtra por activo, categoría, marca, empresa, segmento.", parameters: { type: "object", properties: { activo: { type: "boolean" }, categoria: { type: "string" }, marca: { type: "string" }, empresa: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_equipo", description: "Obtiene un equipo por ficha o ID.", parameters: { type: "object", properties: { ficha: { type: "string" }, id: { type: "number" } } } } },
  { type: "function", function: { name: "search_equipos", description: "Busca equipos por texto en nombre, ficha, modelo, marca.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "list_mantenimientos", description: "Lista mantenimientos programados. Filtra por ficha, vencidos, próximos.", parameters: { type: "object", properties: { ficha: { type: "string" }, vencidos: { type: "boolean" }, proximos: { type: "boolean" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_inventario", description: "Lista inventario. Filtra por stock_bajo, tipo, categoría.", parameters: { type: "object", properties: { stock_bajo: { type: "boolean" }, tipo: { type: "string" }, categoria_equipo: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_tickets", description: "Lista tickets. Filtra por status, prioridad, ficha.", parameters: { type: "object", properties: { status: { type: "string" }, prioridad: { type: "string" }, ficha: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_notificaciones", description: "Lista notificaciones. Filtra por tipo, nivel, leída.", parameters: { type: "object", properties: { tipo: { type: "string" }, nivel: { type: "string" }, leida: { type: "boolean" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_dashboard_summary", description: "Resumen: equipos activos, mantenimientos vencidos/próximos, stock bajo, tickets, notificaciones, submissions pendientes.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_historial", description: "Historial de eventos. Filtra por ficha, tipo_evento, módulo.", parameters: { type: "object", properties: { ficha_equipo: { type: "string" }, tipo_evento: { type: "string" }, modulo: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_submissions", description: "Reportes de mecánicos. Filtra por status.", parameters: { type: "object", properties: { status: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_kits", description: "Kits de mantenimiento con piezas.", parameters: { type: "object", properties: { modelo_aplicable: { type: "string" }, activo: { type: "boolean" } } } } },
  { type: "function", function: { name: "list_planes", description: "Planes de mantenimiento con intervalos.", parameters: { type: "object", properties: { marca: { type: "string" }, categoria: { type: "string" }, activo: { type: "boolean" } } } } },
  { type: "function", function: { name: "get_config", description: "Configuración del sistema.", parameters: { type: "object", properties: {} } } },
  // WRITE tools
  { type: "function", function: { name: "create_equipo", description: "Crea un equipo nuevo.", parameters: { type: "object", properties: { ficha: { type: "string" }, nombre: { type: "string" }, marca: { type: "string" }, modelo: { type: "string" }, categoria: { type: "string" }, numero_serie: { type: "string" }, placa: { type: "string" }, empresa: { type: "string" }, segmento: { type: "string" } }, required: ["ficha", "nombre", "marca", "modelo", "categoria", "numero_serie", "placa"] } } },
  { type: "function", function: { name: "update_equipo", description: "Actualiza campos de un equipo.", parameters: { type: "object", properties: { id: { type: "number" }, updates: { type: "object" } }, required: ["id", "updates"] } } },
  { type: "function", function: { name: "deactivate_equipo", description: "Desactiva un equipo.", parameters: { type: "object", properties: { id: { type: "number" }, motivo: { type: "string" } }, required: ["id", "motivo"] } } },
  { type: "function", function: { name: "update_horas", description: "Actualiza horas/km actuales y recalcula restantes.", parameters: { type: "object", properties: { id: { type: "number" }, horas_km_actuales: { type: "number" } }, required: ["id", "horas_km_actuales"] } } },
  { type: "function", function: { name: "registrar_mantenimiento", description: "Registra mantenimiento realizado: recalcula próximo, guarda en historial.", parameters: { type: "object", properties: { id: { type: "number" }, horas_km_actuales: { type: "number" }, descripcion: { type: "string" }, partes_consumidas: { type: "array", items: { type: "object" } } }, required: ["id", "horas_km_actuales"] } } },
  { type: "function", function: { name: "create_ticket", description: "Crea un ticket de equipo.", parameters: { type: "object", properties: { ficha: { type: "string" }, equipo_id: { type: "number" }, titulo: { type: "string" }, descripcion: { type: "string" }, tipo_problema: { type: "string" }, prioridad: { type: "string" } }, required: ["ficha", "equipo_id", "titulo", "descripcion", "tipo_problema"] } } },
  { type: "function", function: { name: "update_ticket", description: "Actualiza un ticket.", parameters: { type: "object", properties: { id: { type: "string" }, updates: { type: "object" } }, required: ["id", "updates"] } } },
  { type: "function", function: { name: "create_notificacion", description: "Crea una notificación.", parameters: { type: "object", properties: { tipo: { type: "string" }, titulo: { type: "string" }, mensaje: { type: "string" }, nivel: { type: "string" }, ficha_equipo: { type: "string" } }, required: ["tipo", "titulo", "mensaje"] } } },
  { type: "function", function: { name: "mark_notificacion_read", description: "Marca notificaciones como leídas.", parameters: { type: "object", properties: { id: { type: "number" } } } } },
  { type: "function", function: { name: "mover_stock", description: "Mueve stock: +entrada, -salida.", parameters: { type: "object", properties: { id: { type: "number" }, cantidad: { type: "number" }, motivo: { type: "string" } }, required: ["id", "cantidad", "motivo"] } } },
  { type: "function", function: { name: "approve_submission", description: "Aprueba un reporte de mecánico.", parameters: { type: "object", properties: { submission_id: { type: "string" }, feedback: { type: "string" } }, required: ["submission_id"] } } },
  { type: "function", function: { name: "reject_submission", description: "Rechaza un reporte de mecánico.", parameters: { type: "object", properties: { submission_id: { type: "string" }, feedback: { type: "string" } }, required: ["submission_id", "feedback"] } } },
  { type: "function", function: { name: "update_config", description: "Actualiza configuración del sistema.", parameters: { type: "object", properties: { updates: { type: "object" } }, required: ["updates"] } } },
];

// ==================== TOOL HANDLERS ====================

async function executeTool(name: string, args: any, userEmail: string): Promise<string> {
  try {
    switch (name) {
      // ---- READ ----
      case "list_equipos": {
        let q = supabaseAdmin.from("equipos").select("*").order("ficha");
        if (args.activo !== undefined) q = q.eq("activo", args.activo);
        if (args.categoria) q = q.eq("categoria", args.categoria);
        if (args.marca) q = q.ilike("marca", `%${args.marca}%`);
        if (args.empresa) q = q.eq("empresa", args.empresa);
        q = q.limit(args.limit || 100);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "get_equipo": {
        let q = supabaseAdmin.from("equipos").select("*");
        if (args.ficha) q = q.eq("ficha", args.ficha);
        else if (args.id) q = q.eq("id", args.id);
        else return "Se requiere ficha o id";
        const { data, error } = await q.single();
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "search_equipos": {
        const { data, error } = await supabaseAdmin.from("equipos").select("*")
          .or(`nombre.ilike.%${args.query}%,ficha.ilike.%${args.query}%,modelo.ilike.%${args.query}%,marca.ilike.%${args.query}%`)
          .order("ficha").limit(50);
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_mantenimientos": {
        let q = supabaseAdmin.from("mantenimientos_programados").select("*").eq("activo", true).order("horas_km_restante");
        if (args.ficha) q = q.eq("ficha", args.ficha);
        if (args.vencidos) q = q.lt("horas_km_restante", 0);
        if (args.proximos) q = q.gte("horas_km_restante", 0).lte("horas_km_restante", 50);
        q = q.limit(args.limit || 100);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_inventario": {
        let q = supabaseAdmin.from("inventarios").select("*").eq("activo", true).order("nombre");
        if (args.tipo) q = q.eq("tipo", args.tipo);
        if (args.categoria_equipo) q = q.eq("categoria_equipo", args.categoria_equipo);
        q = q.limit(args.limit || 200);
        const { data, error } = await q;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(args.stock_bajo ? data?.filter((i: any) => i.cantidad <= i.stock_minimo) : data, null, 2);
      }
      case "list_tickets": {
        let q = supabaseAdmin.from("equipment_tickets").select("*").order("created_at", { ascending: false });
        if (args.status) q = q.eq("status", args.status);
        if (args.prioridad) q = q.eq("prioridad", args.prioridad);
        if (args.ficha) q = q.eq("ficha", args.ficha);
        q = q.limit(args.limit || 50);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_notificaciones": {
        let q = supabaseAdmin.from("notificaciones").select("*").order("created_at", { ascending: false });
        if (args.tipo) q = q.eq("tipo", args.tipo);
        if (args.nivel) q = q.eq("nivel", args.nivel);
        if (args.leida !== undefined) q = q.eq("leida", args.leida);
        q = q.limit(args.limit || 50);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "get_dashboard_summary": {
        const [equipos, mantV, mantP, stockData, tickets, notif, subs] = await Promise.all([
          supabaseAdmin.from("equipos").select("id", { count: "exact", head: true }).eq("activo", true),
          supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).lt("horas_km_restante", 0),
          supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).gt("horas_km_restante", 0).lte("horas_km_restante", 50),
          supabaseAdmin.from("inventarios").select("id, cantidad, stock_minimo").eq("activo", true),
          supabaseAdmin.from("equipment_tickets").select("id", { count: "exact", head: true }).neq("status", "cerrado"),
          supabaseAdmin.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
          supabaseAdmin.from("maintenance_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);
        return JSON.stringify({
          equipos_activos: equipos.count || 0, mantenimientos_vencidos: mantV.count || 0,
          mantenimientos_proximos: mantP.count || 0, items_stock_bajo: (stockData.data || []).filter((i: any) => i.cantidad <= i.stock_minimo).length,
          tickets_abiertos: tickets.count || 0, notificaciones_pendientes: notif.count || 0, submissions_pendientes: subs.count || 0,
        }, null, 2);
      }
      case "list_historial": {
        let q = supabaseAdmin.from("historial_eventos").select("*").order("created_at", { ascending: false });
        if (args.ficha_equipo) q = q.eq("ficha_equipo", args.ficha_equipo);
        if (args.tipo_evento) q = q.eq("tipo_evento", args.tipo_evento);
        if (args.modulo) q = q.eq("modulo", args.modulo);
        q = q.limit(args.limit || 50);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_submissions": {
        let q = supabaseAdmin.from("maintenance_submissions").select("*").order("created_at", { ascending: false });
        if (args.status) q = q.eq("status", args.status);
        q = q.limit(args.limit || 50);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_kits": {
        let q = supabaseAdmin.from("kits_mantenimiento").select("*, kit_piezas(*)").order("nombre");
        if (args.modelo_aplicable) q = q.eq("modelo_aplicable", args.modelo_aplicable);
        if (args.activo !== undefined) q = q.eq("activo", args.activo);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "list_planes": {
        let q = supabaseAdmin.from("planes_mantenimiento").select("*, plan_intervalos(*, plan_intervalo_kits(kit_id))").order("nombre");
        if (args.marca) q = q.eq("marca", args.marca);
        if (args.categoria) q = q.eq("categoria", args.categoria);
        if (args.activo !== undefined) q = q.eq("activo", args.activo);
        const { data, error } = await q;
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }
      case "get_config": {
        const { data, error } = await supabaseAdmin.from("configuraciones_sistema").select("*").single();
        return error ? `Error: ${error.message}` : JSON.stringify(data, null, 2);
      }

      // ---- WRITE (with audit) ----
      case "create_equipo": {
        const { data, error } = await supabaseAdmin.from("equipos").insert({
          ficha: args.ficha, nombre: args.nombre, marca: args.marca, modelo: args.modelo,
          categoria: args.categoria, numero_serie: args.numero_serie, placa: args.placa,
          empresa: args.empresa || "ALITO EIRL", segmento: args.segmento || null,
        }).select().single();
        if (error) { await auditLog(userEmail, name, args, error.message, "equipos", undefined, false); return `Error: ${error.message}`; }
        await auditHistory({ tipo: "equipo_creado", modulo: "equipos", ficha: args.ficha, nombre: args.nombre, desc: `Equipo ${args.ficha} creado por ALITO BOT`, despues: data, email: userEmail });
        await auditLog(userEmail, name, args, `Creado: ${args.ficha}`, "equipos", String(data.id));
        return `Equipo creado: ${JSON.stringify(data, null, 2)}`;
      }
      case "update_equipo": {
        const { data: before } = await supabaseAdmin.from("equipos").select("*").eq("id", args.id).single();
        const { data, error } = await supabaseAdmin.from("equipos").update(args.updates).eq("id", args.id).select().single();
        if (error) { await auditLog(userEmail, name, args, error.message, "equipos", undefined, false); return `Error: ${error.message}`; }
        await auditHistory({ tipo: "equipo_actualizado", modulo: "equipos", ficha: data.ficha, nombre: data.nombre, desc: `Equipo ${data.ficha} actualizado por ALITO BOT`, antes: before, despues: data, email: userEmail });
        await auditLog(userEmail, name, args, `Actualizado: ${data.ficha}`, "equipos", String(args.id));
        return `Equipo actualizado: ${JSON.stringify(data, null, 2)}`;
      }
      case "deactivate_equipo": {
        const { data, error } = await supabaseAdmin.from("equipos").update({ activo: false, motivo_inactividad: args.motivo }).eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "equipo_desactivado", modulo: "equipos", ficha: data.ficha, nombre: data.nombre, desc: `Desactivado: ${args.motivo}`, email: userEmail });
        await auditLog(userEmail, name, args, `Desactivado: ${data.ficha}`, "equipos", String(args.id));
        return `Equipo ${data.ficha} desactivado`;
      }
      case "update_horas": {
        const { data: before } = await supabaseAdmin.from("mantenimientos_programados").select("*").eq("id", args.id).single();
        if (!before) return "Mantenimiento no encontrado";
        const restante = before.proximo_mantenimiento - args.horas_km_actuales;
        const { data, error } = await supabaseAdmin.from("mantenimientos_programados")
          .update({ horas_km_actuales: args.horas_km_actuales, horas_km_restante: restante, fecha_ultima_actualizacion: new Date().toISOString() })
          .eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "lectura_actualizada", modulo: "mantenimientos", ficha: before.ficha, nombre: before.nombre_equipo, desc: `Lectura: ${before.horas_km_actuales}→${args.horas_km_actuales}. Restante: ${restante}`, antes: { horas_km_actuales: before.horas_km_actuales }, despues: { horas_km_actuales: args.horas_km_actuales, restante }, email: userEmail });
        await auditLog(userEmail, name, args, `${before.ficha}: ${args.horas_km_actuales}hrs, rest:${restante}`, "mantenimientos_programados", String(args.id));
        return `${before.ficha}: ${args.horas_km_actuales} hrs. Restante: ${restante}`;
      }
      case "registrar_mantenimiento": {
        const { data: mant } = await supabaseAdmin.from("mantenimientos_programados").select("*").eq("id", args.id).single();
        if (!mant) return "No encontrado";
        const nuevoProximo = args.horas_km_actuales + mant.frecuencia;
        const partes = args.partes_consumidas || [];
        const { error } = await supabaseAdmin.from("mantenimientos_programados").update({
          horas_km_actuales: args.horas_km_actuales, horas_km_ultimo_mantenimiento: args.horas_km_actuales,
          fecha_ultimo_mantenimiento: new Date().toISOString(), fecha_ultima_actualizacion: new Date().toISOString(),
          proximo_mantenimiento: nuevoProximo, horas_km_restante: nuevoProximo - args.horas_km_actuales, partes_consumidas: partes,
        }).eq("id", args.id);
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "mantenimiento_realizado", modulo: "mantenimientos", ficha: mant.ficha, nombre: mant.nombre_equipo, desc: args.descripcion || `Mantenimiento registrado por ALITO BOT`, antes: { horas: mant.horas_km_actuales, proximo: mant.proximo_mantenimiento }, despues: { horas: args.horas_km_actuales, proximo: nuevoProximo }, email: userEmail, partes });
        await auditLog(userEmail, name, args, `${mant.ficha}: mant a ${args.horas_km_actuales}hrs, prox:${nuevoProximo}`, "mantenimientos_programados", String(args.id));
        return `Mantenimiento registrado para ${mant.ficha}. Próximo: ${nuevoProximo} hrs`;
      }
      case "create_ticket": {
        const { data, error } = await supabaseAdmin.from("equipment_tickets").insert({
          ficha: args.ficha, equipo_id: args.equipo_id, titulo: args.titulo,
          descripcion: args.descripcion, tipo_problema: args.tipo_problema,
          prioridad: args.prioridad || "media", created_by: userEmail,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "ticket_creado", modulo: "tickets", ficha: args.ficha, desc: `Ticket: ${args.titulo}`, despues: data, email: userEmail });
        await auditLog(userEmail, name, args, `Ticket: ${args.titulo}`, "equipment_tickets", data.id);
        return `Ticket creado: ${JSON.stringify(data, null, 2)}`;
      }
      case "update_ticket": {
        const { data: before } = await supabaseAdmin.from("equipment_tickets").select("*").eq("id", args.id).single();
        const { data, error } = await supabaseAdmin.from("equipment_tickets").update(args.updates).eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "ticket_actualizado", modulo: "tickets", ficha: data.ficha, desc: `Ticket actualizado: ${data.titulo}`, antes: before, despues: data, email: userEmail });
        await auditLog(userEmail, name, args, `Ticket ${data.titulo}`, "equipment_tickets", args.id);
        return JSON.stringify(data, null, 2);
      }
      case "create_notificacion": {
        const { data, error } = await supabaseAdmin.from("notificaciones").insert({
          tipo: args.tipo, titulo: args.titulo, mensaje: args.mensaje,
          nivel: args.nivel || "info", ficha_equipo: args.ficha_equipo || null,
        }).select().single();
        if (error) return `Error: ${error.message}`;
        await auditLog(userEmail, name, args, `Notif: ${args.titulo}`, "notificaciones", String(data.id));
        return `Notificación creada: ${args.titulo}`;
      }
      case "mark_notificacion_read": {
        let q = supabaseAdmin.from("notificaciones").update({ leida: true });
        if (args.id) q = q.eq("id", args.id); else q = q.eq("leida", false);
        const { error } = await q;
        if (error) return `Error: ${error.message}`;
        return args.id ? `Notificación ${args.id} leída` : "Todas marcadas como leídas";
      }
      case "mover_stock": {
        const { data: item } = await supabaseAdmin.from("inventarios").select("*").eq("id", args.id).single();
        if (!item) return "Item no encontrado";
        const nueva = Math.max(0, item.cantidad + args.cantidad);
        const { error } = await supabaseAdmin.from("inventarios").update({ cantidad: nueva }).eq("id", args.id);
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "movimiento_stock", modulo: "inventario", desc: `${args.motivo}: ${item.nombre} ${args.cantidad > 0 ? "+" : ""}${args.cantidad} (${item.cantidad}→${nueva})`, antes: { cantidad: item.cantidad }, despues: { cantidad: nueva }, email: userEmail });
        await auditLog(userEmail, name, args, `${item.nombre}: ${item.cantidad}→${nueva}`, "inventarios", String(args.id));
        return `${item.nombre}: ${item.cantidad} → ${nueva}`;
      }
      case "approve_submission": {
        const { data, error } = await supabaseAdmin.rpc("approve_and_integrate_submission", { p_submission_id: args.submission_id, p_admin_feedback: args.feedback || "Aprobado por ALITO BOT" });
        if (error) return `Error: ${error.message}`;
        await auditLog(userEmail, name, args, JSON.stringify(data).slice(0, 200), "maintenance_submissions", args.submission_id);
        return JSON.stringify(data, null, 2);
      }
      case "reject_submission": {
        const { data, error } = await supabaseAdmin.rpc("reject_submission", { p_submission_id: args.submission_id, p_feedback: args.feedback });
        if (error) return `Error: ${error.message}`;
        await auditLog(userEmail, name, args, JSON.stringify(data).slice(0, 200), "maintenance_submissions", args.submission_id);
        return JSON.stringify(data, null, 2);
      }
      case "update_config": {
        const { data: before } = await supabaseAdmin.from("configuraciones_sistema").select("*").eq("id", 1).single();
        const { data, error } = await supabaseAdmin.from("configuraciones_sistema").update(args.updates).eq("id", 1).select().single();
        if (error) return `Error: ${error.message}`;
        await auditHistory({ tipo: "config_actualizada", modulo: "configuracion", desc: "Config actualizada por ALITO BOT", antes: before, despues: data, email: userEmail });
        await auditLog(userEmail, name, args, "Config actualizada", "configuraciones_sistema", "1");
        return JSON.stringify(data, null, 2);
      }
      default:
        return `Herramienta desconocida: ${name}`;
    }
  } catch (e) {
    return `Error ejecutando ${name}: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ==================== AGENT SYSTEM PROMPT ====================

const AGENT_SYSTEM_PROMPT = `Eres ALITO BOT, un agente IA avanzado de ALITO GROUP SRL para gestión de maquinaria pesada y flota vehicular.

CAPACIDADES PRINCIPALES:
- Tienes acceso DIRECTO a la base de datos en tiempo real mediante herramientas (tools).
- Puedes consultar TODOS los módulos: equipos, mantenimientos, inventario, tickets, notificaciones, historial, kits, planes y configuración.
- Puedes CREAR y MODIFICAR datos: crear equipos, registrar mantenimientos, gestionar tickets, mover stock, crear notificaciones.
- TODAS las acciones de escritura quedan registradas en historial_eventos y ai_audit_log para auditoría completa.

COMPORTAMIENTO:
1. SIEMPRE usa herramientas para obtener datos REALES. No inventes datos.
2. Para acciones de escritura, CONFIRMA con el usuario antes de ejecutar.
3. Cuando detectes situaciones críticas (vencidos, stock bajo), ALERTA proactivamente.
4. Cruza datos entre módulos para correlacionar problemas.

HERRAMIENTAS DISPONIBLES:
- LECTURA: list_equipos, get_equipo, search_equipos, list_mantenimientos, list_inventario, list_tickets, list_notificaciones, get_dashboard_summary, list_historial, list_submissions, list_kits, list_planes, get_config
- ESCRITURA: create_equipo, update_equipo, deactivate_equipo, update_horas, registrar_mantenimiento, create_ticket, update_ticket, create_notificacion, mark_notificacion_read, mover_stock, approve_submission, reject_submission, update_config

FORMATO:
- Responde SIEMPRE en español.
- Usa tablas Markdown para datos tabulares.
- Sé conciso pero completo.
- Confirma qué se cambió exactamente.

SEGURIDAD:
- Acciones de escritura requieren confirmación del usuario.
- No elimines datos, solo desactiva.
- Todo queda registrado en auditoría.`;

// ==================== MAIN HANDLER ====================

const MAX_TOOL_ITERATIONS = 8;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).single();
    const userRole = roleData?.role || 'user';
    const userEmail = user.email || 'unknown';

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY no configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Se requiere array de mensajes' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = userRole === 'admin';
    const isSupervisor = userRole === 'supervisor';
    const canWrite = isAdmin || isSupervisor;

    const systemPromptWithRole = `${AGENT_SYSTEM_PROMPT}\n\nUSUARIO: ${userEmail} (rol: ${userRole}).\n${
      canWrite ? 'Permisos completos de lectura y escritura.' : 'Permisos de lectura. Escritura requiere aprobación de admin.'
    }`;

    // Filter write tools for non-admin/supervisor users
    const availableTools = canWrite ? tools : tools.filter(t => {
      const writeFns = ["create_equipo", "update_equipo", "deactivate_equipo", "update_horas", "registrar_mantenimiento", "create_ticket", "update_ticket", "create_notificacion", "mark_notificacion_read", "mover_stock", "approve_submission", "reject_submission", "update_config"];
      return !writeFns.includes(t.function.name);
    });

    let conversationMessages: any[] = [
      { role: 'system', content: systemPromptWithRole },
      ...messages,
    ];

    let iterations = 0;
    let finalResponse: any = null;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      console.log(`Agent iteration ${iterations}...`);

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationMessages,
          tools: availableTools,
          tool_choice: 'auto',
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('AI error:', aiResponse.status, errText);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido.', code: 'rate_limit' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'Créditos agotados.', code: 'insufficient_credits' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: `Error de IA: ${aiResponse.status}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const choice = aiData.choices?.[0];
      if (!choice) {
        return new Response(JSON.stringify({ error: 'Respuesta vacía de la IA' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const assistantMessage = choice.message;
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        finalResponse = aiData;
        break;
      }

      conversationMessages.push(assistantMessage);

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name;
          let toolArgs: any = {};
          try { toolArgs = JSON.parse(toolCall.function.arguments || '{}'); } catch { toolArgs = {}; }
          console.log(`Executing tool: ${toolName}`, toolArgs);
          const result = await executeTool(toolName, toolArgs, userEmail);
          return { role: 'tool', tool_call_id: toolCall.id, content: result };
        })
      );

      conversationMessages.push(...toolResults);
    }

    if (!finalResponse) {
      conversationMessages.push({ role: 'user', content: '[Sistema: Límite de iteraciones. Resume los resultados.]' });
      const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: conversationMessages }),
      });
      finalResponse = await summaryResponse.json();
    }

    console.log(`Agent completed in ${iterations} iteration(s)`);
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en ai-agent:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
