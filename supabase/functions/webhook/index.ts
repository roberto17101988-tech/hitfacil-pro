import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WebhookBody {
  action?: string;
  data?: {
    id?: string;
  };
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(key: string): string | undefined {
  try {
    return Deno.env.get(key) ?? undefined;
  } catch {
    return process.env[key] ?? undefined;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const accessToken = getEnv("MP_ACCESS_TOKEN");
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const body = (await req.json().catch(() => ({}))) as WebhookBody;

    const action = body.action || "unknown";
    const paymentId = body.data?.id || "unknown";

    console.log(`Webhook received — action: ${action}, paymentId: ${paymentId}`);

    // Only process payment updates
    if (action !== "payment.updated" || paymentId === "unknown") {
      return jsonResponse({ received: true, action, paymentId, status: "ignored" });
    }

    // Fetch the payment status from Mercado Pago
    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN not configured");
      return jsonResponse({ received: true, error: "MP_ACCESS_TOKEN not configured" }, 503);
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!mpResponse.ok) {
      console.error("Failed to fetch payment from MP:", await mpResponse.text());
      return jsonResponse({ received: true, error: "Failed to verify payment" }, 502);
    }

    const mpData = await mpResponse.json();
    const status = mpData.status || "unknown";
    const isPaid = status === "approved";

    console.log(`Payment ${paymentId} status: ${status}, isPaid: ${isPaid}`);

    // Update the payments table in Supabase
    if (supabaseUrl && serviceRoleKey) {
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/payments?mp_payment_id=eq.${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            is_paid: isPaid,
            updated_at: new Date().toISOString(),
          }),
        },
      );

      if (!updateResponse.ok) {
        console.error("Failed to update payment in DB:", await updateResponse.text());
      } else {
        console.log(`Payment ${paymentId} updated in DB — is_paid: ${isPaid}`);
      }
    }

    return jsonResponse({
      received: true,
      action,
      paymentId,
      status,
      isPaid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
