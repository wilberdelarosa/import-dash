import type {} from "../types.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return new Response(JSON.stringify({ error: "Email and PIN are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase service credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    const { error: sendError } = await supabase.auth.admin.sendRawEmail({
      email,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; color: #0d8d56; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { color: #333; line-height: 1.6; }
              .pin-box { background-color: #f0f7f4; border-left: 4px solid #0d8d56; padding: 20px; margin: 20px 0; text-align: center; }
              .pin-code { font-size: 32px; font-weight: bold; color: #0d8d56; letter-spacing: 5px; font-family: monospace; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              .warning { color: #d32f2f; font-size: 14px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Codigo de Verificacion</h1>
              </div>
              
              <div class="content">
                <p>Hola,</p>
                <p>Hemos recibido una solicitud para crear una cuenta en <strong>ALITO GROUP - Sistema de Gestion de Maquinaria</strong>.</p>
                
                <p>Tu codigo de verificacion es:</p>
                
                <div class="pin-box">
                  <div class="pin-code">${pin}</div>
                </div>
                
                <p>Este codigo es valido por 15 minutos.</p>
                
                <div class="warning">
                  Si no solicitaste este codigo, ignora este correo. Tu cuenta esta segura.
                </div>
              </div>
              
              <div class="footer">
                <p>2025 ALITO GROUP. Todos los derechos reservados.</p>
                <p>Este es un correo automatico, por favor no responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (sendError) {
      console.error("Error sending email:", sendError);
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "PIN sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
