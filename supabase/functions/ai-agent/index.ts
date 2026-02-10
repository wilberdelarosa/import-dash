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

// ==================== TOOL DEFINITIONS ====================

const tools = [
  {
    type: "function",
    function: {
      name: "list_equipos",
      description: "Lista equipos registrados. Puede filtrar por activos, categoría. Devuelve nombre, ficha, marca, modelo, serie, categoría, estado.",
      parameters: {
        type: "object",
        properties: {
          activo: { type: "boolean", description: "Filtrar por activos/inactivos" },
          categoria: { type: "string", description: "Filtrar por categoría" },
          limit: { type: "number", description: "Límite de resultados (default 100)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_equipo",
      description: "Obtiene un equipo específico por ficha o ID con toda su info.",
      parameters: {
        type: "object",
        properties: {
          ficha: { type: "string", description: "Ficha del equipo (ej: AC-001)" },
          id: { type: "number", description: "ID numérico del equipo" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_equipo",
      description: "Actualiza campos de un equipo existente (nombre, marca, modelo, activo, etc.)",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID del equipo a actualizar" },
          updates: { type: "object", description: "Campos a actualizar" },
        },
        required: ["id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_mantenimientos",
      description: "Lista mantenimientos programados con horas restantes. Puede filtrar por ficha o solo vencidos (restante < 0).",
      parameters: {
        type: "object",
        properties: {
          ficha: { type: "string", description: "Filtrar por ficha de equipo" },
          vencidos: { type: "boolean", description: "Solo vencidos (horas_km_restante < 0)" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_mantenimiento",
      description: "Actualiza horas/km actuales de un mantenimiento y recalcula el restante.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID del mantenimiento" },
          horas_km_actuales: { type: "number", description: "Nuevas horas/km actuales" },
        },
        required: ["id", "horas_km_actuales"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_inventario",
      description: "Lista inventario de piezas/repuestos. Puede filtrar por stock bajo, tipo, categoría de equipo.",
      parameters: {
        type: "object",
        properties: {
          stock_bajo: { type: "boolean", description: "Solo items con stock <= stock_minimo" },
          tipo: { type: "string" },
          categoria_equipo: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_inventario",
      description: "Actualiza cantidad u otros campos de un item de inventario.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID del item" },
          updates: { type: "object", description: "Campos a actualizar (ej: {cantidad: 5})" },
        },
        required: ["id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tickets",
      description: "Lista tickets de soporte de equipos. Filtra por status (abierto, en_progreso, cerrado), prioridad, ficha.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          prioridad: { type: "string" },
          ficha: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ticket",
      description: "Actualiza un ticket: cambiar status, asignar, agregar notas admin, resolución.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "UUID del ticket" },
          updates: { type: "object" },
        },
        required: ["id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_notificaciones",
      description: "Lista notificaciones del sistema. Filtra por tipo, nivel (info, warning, critical), leída/no leída.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string" },
          nivel: { type: "string" },
          leida: { type: "boolean" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Obtiene resumen general: equipos activos, mantenimientos vencidos/próximos, stock bajo, tickets abiertos, notificaciones pendientes.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_historial",
      description: "Historial de eventos del sistema. Filtra por ficha_equipo, tipo_evento, módulo.",
      parameters: {
        type: "object",
        properties: {
          ficha_equipo: { type: "string" },
          tipo_evento: { type: "string" },
          modulo: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_submissions",
      description: "Reportes de mecánicos (maintenance submissions). Filtra por status: pending, approved, rejected.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_kits",
      description: "Kits de mantenimiento con sus piezas asociadas. Filtra por modelo_aplicable, activo.",
      parameters: {
        type: "object",
        properties: {
          modelo_aplicable: { type: "string" },
          activo: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_planes",
      description: "Planes de mantenimiento con intervalos y kits asociados. Filtra por marca, categoría.",
      parameters: {
        type: "object",
        properties: {
          marca: { type: "string" },
          categoria: { type: "string" },
          activo: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_config",
      description: "Obtiene la configuración actual del sistema (alertas, notificaciones, etc.).",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ==================== TOOL HANDLERS ====================

async function executeTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "list_equipos": {
        let query = supabaseAdmin.from("equipos").select("*").order("ficha");
        if (args.activo !== undefined) query = query.eq("activo", args.activo);
        if (args.categoria) query = query.eq("categoria", args.categoria);
        query = query.limit(args.limit || 100);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "get_equipo": {
        let query = supabaseAdmin.from("equipos").select("*");
        if (args.ficha) query = query.eq("ficha", args.ficha);
        else if (args.id) query = query.eq("id", args.id);
        else return "Se requiere ficha o id";
        const { data, error } = await query.single();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "update_equipo": {
        const { data, error } = await supabaseAdmin.from("equipos").update(args.updates).eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        return `Equipo actualizado: ${JSON.stringify(data, null, 2)}`;
      }
      case "list_mantenimientos": {
        let query = supabaseAdmin.from("mantenimientos_programados").select("*").eq("activo", true).order("horas_km_restante");
        if (args.ficha) query = query.eq("ficha", args.ficha);
        if (args.vencidos) query = query.lt("horas_km_restante", 0);
        query = query.limit(args.limit || 100);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "update_mantenimiento": {
        const { data: mant } = await supabaseAdmin.from("mantenimientos_programados").select("proximo_mantenimiento").eq("id", args.id).single();
        if (!mant) return "Mantenimiento no encontrado";
        const restante = mant.proximo_mantenimiento - args.horas_km_actuales;
        const { data, error } = await supabaseAdmin
          .from("mantenimientos_programados")
          .update({ horas_km_actuales: args.horas_km_actuales, horas_km_restante: restante, fecha_ultima_actualizacion: new Date().toISOString() })
          .eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        return `Restante: ${restante} hrs. ${JSON.stringify(data, null, 2)}`;
      }
      case "list_inventario": {
        let query = supabaseAdmin.from("inventarios").select("*").eq("activo", true).order("nombre");
        if (args.tipo) query = query.eq("tipo", args.tipo);
        if (args.categoria_equipo) query = query.eq("categoria_equipo", args.categoria_equipo);
        query = query.limit(args.limit || 200);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        const result = args.stock_bajo ? data?.filter((i: any) => i.cantidad <= i.stock_minimo) : data;
        return JSON.stringify(result, null, 2);
      }
      case "update_inventario": {
        const { data, error } = await supabaseAdmin.from("inventarios").update(args.updates).eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "list_tickets": {
        let query = supabaseAdmin.from("equipment_tickets").select("*").order("created_at", { ascending: false });
        if (args.status) query = query.eq("status", args.status);
        if (args.prioridad) query = query.eq("prioridad", args.prioridad);
        if (args.ficha) query = query.eq("ficha", args.ficha);
        query = query.limit(args.limit || 50);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "update_ticket": {
        const { data, error } = await supabaseAdmin.from("equipment_tickets").update(args.updates).eq("id", args.id).select().single();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "list_notificaciones": {
        let query = supabaseAdmin.from("notificaciones").select("*").order("created_at", { ascending: false });
        if (args.tipo) query = query.eq("tipo", args.tipo);
        if (args.nivel) query = query.eq("nivel", args.nivel);
        if (args.leida !== undefined) query = query.eq("leida", args.leida);
        query = query.limit(args.limit || 50);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "get_dashboard_summary": {
        const [equipos, mantVencidos, mantProximos, stockBajo, ticketsAbiertos, notifPendientes] = await Promise.all([
          supabaseAdmin.from("equipos").select("id", { count: "exact", head: true }).eq("activo", true),
          supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).lt("horas_km_restante", 0),
          supabaseAdmin.from("mantenimientos_programados").select("id", { count: "exact", head: true }).eq("activo", true).gt("horas_km_restante", 0).lte("horas_km_restante", 50),
          supabaseAdmin.from("inventarios").select("id, cantidad, stock_minimo").eq("activo", true),
          supabaseAdmin.from("equipment_tickets").select("id", { count: "exact", head: true }).neq("status", "cerrado"),
          supabaseAdmin.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
        ]);
        const lowStock = (stockBajo.data || []).filter((i: any) => i.cantidad <= i.stock_minimo).length;
        return JSON.stringify({
          equipos_activos: equipos.count || 0,
          mantenimientos_vencidos: mantVencidos.count || 0,
          mantenimientos_proximos_50hrs: mantProximos.count || 0,
          items_stock_bajo: lowStock,
          tickets_abiertos: ticketsAbiertos.count || 0,
          notificaciones_pendientes: notifPendientes.count || 0,
        }, null, 2);
      }
      case "list_historial": {
        let query = supabaseAdmin.from("historial_eventos").select("*").order("created_at", { ascending: false });
        if (args.ficha_equipo) query = query.eq("ficha_equipo", args.ficha_equipo);
        if (args.tipo_evento) query = query.eq("tipo_evento", args.tipo_evento);
        if (args.modulo) query = query.eq("modulo", args.modulo);
        query = query.limit(args.limit || 50);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "list_submissions": {
        let query = supabaseAdmin.from("maintenance_submissions").select("*").order("created_at", { ascending: false });
        if (args.status) query = query.eq("status", args.status);
        query = query.limit(args.limit || 50);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "list_kits": {
        let query = supabaseAdmin.from("kits_mantenimiento").select("*, kit_piezas(*)").order("nombre");
        if (args.modelo_aplicable) query = query.eq("modelo_aplicable", args.modelo_aplicable);
        if (args.activo !== undefined) query = query.eq("activo", args.activo);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "list_planes": {
        let query = supabaseAdmin.from("planes_mantenimiento").select("*, plan_intervalos(*, plan_intervalo_kits(kit_id))").order("nombre");
        if (args.marca) query = query.eq("marca", args.marca);
        if (args.categoria) query = query.eq("categoria", args.categoria);
        if (args.activo !== undefined) query = query.eq("activo", args.activo);
        const { data, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data, null, 2);
      }
      case "get_config": {
        const { data, error } = await supabaseAdmin.from("configuraciones_sistema").select("*").single();
        if (error) return `Error: ${error.message}`;
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
- Puedes consultar equipos, mantenimientos, inventario, tickets, notificaciones, historial, kits y planes.
- Puedes MODIFICAR datos: actualizar equipos, mantenimientos, inventario y tickets.
- Debes usar las herramientas para obtener datos REALES en vez de inventar respuestas.

COMPORTAMIENTO DE AGENTE:
1. SIEMPRE usa las herramientas disponibles para consultar datos antes de responder. No inventes datos.
2. Si el usuario pregunta sobre equipos, usa list_equipos o get_equipo para obtener datos reales.
3. Si pregunta sobre mantenimientos vencidos, usa list_mantenimientos con vencidos=true.
4. Para dar un resumen general, usa get_dashboard_summary primero.
5. Cuando detectes situaciones críticas (mantenimientos vencidos, stock bajo), ALERTA proactivamente.
6. Para acciones de escritura (actualizar equipo, cambiar status de ticket), CONFIRMA con el usuario antes de ejecutar.

RECOMENDACIONES PROACTIVAS:
- Si ves mantenimientos vencidos, recomienda acciones inmediatas.
- Si hay stock bajo, sugiere realizar pedidos.
- Si hay tickets abiertos sin asignar, sugiere asignarlos.
- Cruza datos entre módulos: si un equipo tiene mantenimiento vencido Y un ticket abierto, correlaciona.
- Prioriza por criticidad y urgencia.

FORMATO DE RESPUESTAS:
- Responde SIEMPRE en español.
- Usa tablas Markdown para datos tabulares.
- Incluye fichas, nombres y datos específicos.
- Sé conciso pero completo.
- Cuando hagas cambios, confirma qué se cambió exactamente.

SEGURIDAD:
- Las acciones de escritura requieren confirmación del usuario.
- No elimines datos, solo actualiza.
- Registra qué acciones se tomaron.`;

// ==================== MAIN HANDLER ====================

const MAX_TOOL_ITERATIONS = 8;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
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

    // Get user role for context
    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).single();
    const userRole = roleData?.role || 'user';

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

    // Add role context to system prompt
    const systemPromptWithRole = `${AGENT_SYSTEM_PROMPT}\n\nUSUARIO ACTUAL: ${user.email} (rol: ${userRole}).\n${
      userRole === 'admin' || userRole === 'supervisor' 
        ? 'Este usuario tiene permisos completos de lectura y escritura.'
        : 'Este usuario tiene permisos de lectura. Las acciones de escritura requieren aprobación de un admin.'
    }`;

    // Build conversation with system prompt
    let conversationMessages: any[] = [
      { role: 'system', content: systemPromptWithRole },
      ...messages,
    ];

    // Agentic loop - iterate until AI gives a final response (no more tool calls)
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
          tools,
          tool_choice: 'auto',
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('AI error:', aiResponse.status, errText);
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta más tarde.', code: 'rate_limit' }), {
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

      // If no tool calls, we have the final response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        finalResponse = aiData;
        break;
      }

      // Process tool calls
      conversationMessages.push(assistantMessage);

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name;
          let toolArgs: any = {};
          try {
            toolArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            toolArgs = {};
          }

          console.log(`Executing tool: ${toolName}`, toolArgs);
          const result = await executeTool(toolName, toolArgs);

          return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          };
        })
      );

      conversationMessages.push(...toolResults);
    }

    if (!finalResponse) {
      // Max iterations reached, get a final summary
      conversationMessages.push({
        role: 'user',
        content: '[Sistema: Has alcanzado el límite de iteraciones. Resume los resultados obtenidos hasta ahora.]',
      });
      
      const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationMessages,
        }),
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
