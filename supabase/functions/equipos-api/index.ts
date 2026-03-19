import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Authenticate via API Key header OR Bearer JWT */
async function authenticate(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const EQUIPOS_API_KEY = Deno.env.get("EQUIPOS_API_KEY");

  // Method 1: Static API Key (for external billing systems)
  if (apiKey && EQUIPOS_API_KEY && apiKey === EQUIPOS_API_KEY) {
    return { method: "api_key" as const, userId: null };
  }

  // Method 2: JWT (for internal app usage)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      // Verify admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        return { method: "jwt" as const, userId: data.user.id };
      }
      return null; // authenticated but not admin
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Se requiere x-api-key válida o JWT de admin." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/equipos-api\/?/, "").replace(/\/$/, "");

    // GET /equipos-api → list all equipment
    if (req.method === "GET" && (!path || path === "equipos")) {
      const activo = url.searchParams.get("activo");
      const empresa = url.searchParams.get("empresa");
      const categoria = url.searchParams.get("categoria");
      const ficha = url.searchParams.get("ficha");
      const segmento = url.searchParams.get("segmento");

      let query = supabase
        .from("equipos")
        .select("id, ficha, nombre, marca, modelo, numero_serie, placa, categoria, empresa, activo, motivo_inactividad, segmento, created_at");

      if (activo !== null) query = query.eq("activo", activo === "true");
      if (empresa) query = query.eq("empresa", empresa);
      if (categoria) query = query.eq("categoria", categoria);
      if (ficha) query = query.eq("ficha", ficha);
      if (segmento) query = query.eq("segmento", segmento);

      const { data, error } = await query.order("ficha", { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          count: data.length,
          auth_method: auth.method,
          data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /equipos-api/resumen → summary for billing
    if (req.method === "GET" && path === "resumen") {
      const { data: equipos, error } = await supabase
        .from("equipos")
        .select("id, ficha, nombre, marca, modelo, categoria, empresa, activo, segmento");

      if (error) throw error;

      const resumen = {
        total: equipos.length,
        activos: equipos.filter((e: any) => e.activo).length,
        inactivos: equipos.filter((e: any) => !e.activo).length,
        por_empresa: {} as Record<string, number>,
        por_categoria: {} as Record<string, number>,
        por_segmento: {} as Record<string, number>,
      };

      for (const e of equipos) {
        resumen.por_empresa[e.empresa] = (resumen.por_empresa[e.empresa] || 0) + 1;
        resumen.por_categoria[e.categoria] = (resumen.por_categoria[e.categoria] || 0) + 1;
        if (e.segmento) {
          resumen.por_segmento[e.segmento] = (resumen.por_segmento[e.segmento] || 0) + 1;
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: resumen }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /equipos-api/equipo/:ficha → single equipment detail
    if (req.method === "GET" && path.startsWith("equipo/")) {
      const ficha = path.replace("equipo/", "");

      const { data: equipo, error } = await supabase
        .from("equipos")
        .select("*")
        .eq("ficha", ficha)
        .maybeSingle();

      if (error) throw error;
      if (!equipo) {
        return new Response(
          JSON.stringify({ success: false, error: `Equipo con ficha '${ficha}' no encontrado` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get maintenance info
      const { data: mantenimientos } = await supabase
        .from("mantenimientos_programados")
        .select("tipo_mantenimiento, horas_km_actuales, horas_km_restante, proximo_mantenimiento, frecuencia, activo")
        .eq("ficha", ficha)
        .eq("activo", true);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            equipo,
            mantenimientos_programados: mantenimientos || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Ruta no encontrada",
        rutas_disponibles: [
          "GET /equipos-api → Lista de equipos (filtros: activo, empresa, categoria, ficha, segmento)",
          "GET /equipos-api/resumen → Resumen por empresa, categoría y segmento",
          "GET /equipos-api/equipo/:ficha → Detalle de equipo con mantenimientos",
        ],
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
