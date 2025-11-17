import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSMSRequest {
  phoneNumber: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phoneNumber, message } = (await req.json()) as SendSMSRequest;

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: "Missing phoneNumber or message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
      console.error("Missing Twilio environment variables");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare Twilio API request
    const credentials = btoa(`${accountSid}:${authToken}`);
    const formData = new URLSearchParams();
    
    // Use Messaging Service SID if available (more reliable), otherwise use From number
    if (messagingServiceSid) {
      formData.append("MessagingServiceSid", messagingServiceSid);
    } else {
      formData.append("From", fromNumber);
    }
    
    formData.append("To", phoneNumber);
    formData.append("Body", message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", data);
      return new Response(
        JSON.stringify({
          error: data.message || "Failed to send SMS",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.sid,
        phone: data.to,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
