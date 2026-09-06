const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_AMOUNT = 19.9;
const DEFAULT_DESCRIPTION = "HitFacil PRO - Creditos";

interface PixResponse {
  paymentId: string;
  mpPaymentId: string;
  pixCode: string;
  pixQrCode: string;
  status: string;
  amount: number;
  email: string;
  isPaid: boolean;
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(key: string): string | undefined {
  // Deno runtime injects secrets via Deno.env, not process.env
  try {
    return Deno.env.get(key) ?? undefined;
  } catch {
    // Fallback to process.env if Deno.env is not available
    return process.env[key] ?? undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  try {
    // POST: create a new PIX payment
    if (req.method === "POST") {
      const accessToken = getEnv("MP_ACCESS_TOKEN");

      if (!accessToken) {
        console.error("MP_ACCESS_TOKEN not found in environment");
        return jsonResponse(
          {
            error:
              "MP_ACCESS_TOKEN não configurado. Acesse o painel do Supabase > Edge Functions > Secrets e adicione a variável MP_ACCESS_TOKEN com seu token do Mercado Pago.",
          },
          503,
        );
      }

      console.log("MP_ACCESS_TOKEN found, length:", accessToken.length);

      const body = await req.json().catch(() => ({}));
      const email: string = body.email || "";
      const credits: number = body.credits || 50;
      const amount: number = body.amount || DEFAULT_AMOUNT;
      const description = `HitFacil PRO - ${credits} Creditos`;

      if (!email || !email.includes("@")) {
        return jsonResponse({ error: "Email é obrigatório." }, 400);
      }

      // Create PIX payment via Mercado Pago REST API
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: description,
          payment_method_id: "pix",
          payer: { email },
        }),
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error("Mercado Pago error response:", errorText);
        console.error("Mercado Pago status:", mpResponse.status);

        let errorDetail = "Falha ao criar pagamento PIX.";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorDetail = errorJson.message;
          }
          if (errorJson.cause?.length > 0) {
            errorDetail = errorJson.cause.map((c: { description?: string }) => c.description).join(", ");
          }
        } catch {
          // keep default error message
        }

        return jsonResponse(
          { error: errorDetail, mpStatus: mpResponse.status },
          502,
        );
      }

      const mpData = await mpResponse.json();

      const pixCode = mpData.point_of_interaction?.transaction_data?.qr_code || "";
      const pixQrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "";
      const mpPaymentId = String(mpData.id || "");
      const status = mpData.status || "pending";

      console.log("PIX payment created:", mpPaymentId, "status:", status);

      // Store payment in Supabase
      if (supabaseUrl && serviceRoleKey) {
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
          },
          body: JSON.stringify({
            email,
            mp_payment_id: parseInt(mpPaymentId) || null,
            status,
            amount: amount,
            pix_code: pixCode,
            pix_qr_code: pixQrCode,
            is_paid: status === "approved",
          }),
        }).catch((e) => console.error("Failed to store payment:", e));
      }

      const result: PixResponse = {
        paymentId: mpPaymentId,
        mpPaymentId,
        pixCode,
        pixQrCode,
        status,
        amount: amount,
        email,
        isPaid: status === "approved",
      };

      return jsonResponse(result);
    }

    // GET: check payment status by mp_payment_id
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mpPaymentId = url.searchParams.get("mp_payment_id");

      if (!mpPaymentId) {
        return jsonResponse({ error: "mp_payment_id é obrigatório." }, 400);
      }

      const accessToken = getEnv("MP_ACCESS_TOKEN");

      if (!accessToken) {
        return jsonResponse({ error: "MP_ACCESS_TOKEN não configurado." }, 503);
      }

      // Query Mercado Pago for current status
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error("MP status check error:", errorText);
        return jsonResponse({ error: "Pagamento não encontrado." }, 404);
      }

      const mpData = await mpResponse.json();
      const status = mpData.status || "pending";
      const isPaid = status === "approved";

      // Update Supabase if payment was approved
      if (isPaid && supabaseUrl && serviceRoleKey) {
        await fetch(`${supabaseUrl}/rest/v1/payments?mp_payment_id=eq.${mpPaymentId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            is_paid: true,
            updated_at: new Date().toISOString(),
          }),
        }).catch((e) => console.error("Failed to update payment:", e));
      }

      return jsonResponse({
        mpPaymentId,
        status,
        isPaid,
      });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Pix function error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
