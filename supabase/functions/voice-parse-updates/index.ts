import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere el texto transcrito" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get all active equipment with current hours from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: mantenimientos, error: dbError } = await supabase
      .from("mantenimientos_programados")
      .select("id, ficha, nombre_equipo, horas_km_actuales, fecha_ultima_actualizacion, tipo_mantenimiento, activo")
      .eq("activo", true);

    if (dbError) throw dbError;

    // Also get equipos to filter only active ones
    const { data: equipos, error: eqError } = await supabase
      .from("equipos")
      .select("ficha, activo")
      .eq("activo", true);

    if (eqError) throw eqError;

    const fichasActivas = new Set((equipos || []).map((e: { ficha: string }) => e.ficha));
    const mantenimientosActivos = (mantenimientos || []).filter(
      (m: { ficha: string }) => fichasActivas.has(m.ficha)
    );

    const fichasList = mantenimientosActivos.map(
      (m: { ficha: string; nombre_equipo: string; horas_km_actuales: number }) =>
        `${m.ficha} (${m.nombre_equipo}, ${m.horas_km_actuales} hrs actuales)`
    ).join("\n");

    const systemPrompt = `Eres un asistente que extrae datos de lecturas de equipos desde texto dictado por voz.

EQUIPOS DISPONIBLES EN EL SISTEMA:
${fichasList}

INSTRUCCIONES:
1. Del texto transcrito, extrae pares de (ficha, nueva_lectura_horas_km).
2. Maneja variaciones de voz: "alfa charlie" = "AC", "cero cero tres" = "003", etc.
3. Si una ficha no coincide con ninguna del sistema, intenta la más similar.
4. Devuelve SOLO un JSON con el resultado usando la herramienta proporcionada.

IMPORTANTE: Las lecturas son números positivos que representan horas de operación o kilómetros.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Texto transcrito:\n"${transcript}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_readings",
              description: "Extract equipment readings from voice transcript",
              parameters: {
                type: "object",
                properties: {
                  readings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ficha: { type: "string", description: "Equipment ficha code like AC-003" },
                        lectura: { type: "number", description: "New hour/km reading" },
                        confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence in extraction" },
                      },
                      required: ["ficha", "lectura", "confidence"],
                    },
                  },
                },
                required: ["readings"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_readings" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intente más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Agregue fondos en Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("Error del servicio AI");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No se pudo extraer datos del texto");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const readings = parsed.readings || [];

    // Validate and enrich each reading
    const results = readings.map((r: { ficha: string; lectura: number; confidence: string }) => {
      const mantenimiento = mantenimientosActivos.find(
        (m: { ficha: string }) => m.ficha.toUpperCase() === r.ficha.toUpperCase()
      );

      if (!mantenimiento) {
        return {
          ficha: r.ficha,
          lectura: r.lectura,
          confidence: r.confidence,
          valid: false,
          error: "Ficha no encontrada en el sistema",
          mantenimientoId: null,
          nombreEquipo: null,
          lecturaAnterior: null,
          incremento: null,
          anomalia: null,
        };
      }

      const lecturaAnterior = mantenimiento.horas_km_actuales;
      const incremento = r.lectura - lecturaAnterior;

      // Anomaly detection
      let anomalia: string | null = null;
      if (incremento < 0) {
        anomalia = "error_lectura_menor";
      } else if (mantenimiento.fecha_ultima_actualizacion) {
        const fechaUltima = new Date(mantenimiento.fecha_ultima_actualizacion);
        const ahora = new Date();
        const diasTranscurridos = Math.max(1, (ahora.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24));
        const maxHorasPosibles = diasTranscurridos * 9 * 1.2; // 9 hrs/day * 1.2 margin
        if (incremento > maxHorasPosibles) {
          anomalia = "incremento_sospechoso";
        }
      }

      return {
        ficha: mantenimiento.ficha,
        lectura: r.lectura,
        confidence: r.confidence,
        valid: true,
        error: null,
        mantenimientoId: mantenimiento.id,
        nombreEquipo: mantenimiento.nombre_equipo,
        lecturaAnterior,
        incremento,
        anomalia,
      };
    });

    return new Response(
      JSON.stringify({ success: true, readings: results, totalParsed: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("voice-parse-updates error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
