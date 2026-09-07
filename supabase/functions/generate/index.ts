const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest { lyrics: string; title?: string; genre?: string; mood?: string; voice?: string; }
interface SunoRecordResponse { code: number; data?: { status?: string; response?: { sunoData?: Array<{ audioUrl?: string; imageUrl?: string; duration?: number; }> }; errorMessage?: string | null; }; }
const SUNO_BASE = "https://api.sunoapi.org";

function jsonResponse(body: object, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
function voiceToGender(voice: string): "m" | "f" | undefined { if (voice === "Masculina") return "m"; if (voice === "Feminina") return "f"; return undefined; }
function buildStyle(genre: string, mood: string): string { return [genre, mood, "Brazilian production"].filter(Boolean).join(", "); }

async function pollForAudio(taskId: string, apiKey: string): Promise<{ audioUrl: string; coverUrl?: string; duration: number }> {
  const url = `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;
  for (let attempt = 0; attempt < 72; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!response.ok) continue;
    const data: SunoRecordResponse = await response.json();
    const status = data.data?.status;
    if (status === "SUCCESS") {
      const song = data.data?.response?.sunoData?.[0];
      if (song?.audioUrl) return { audioUrl: song.audioUrl, coverUrl: song.imageUrl, duration: Math.max(180, Math.min(240, song.duration || 180)) };
    }
    if (["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "SENSITIVE_WORD_ERROR"].includes(status || "")) throw new Error(data.data?.errorMessage || `Geração falhou: ${status}`);
  }
  throw new Error("Tempo esgotado aguardando a geração da música");
}

async function publishTrack(result: { title: string; genre: string; mood: string; voice: string; lyrics: string; audioUrl: string; coverUrl?: string; duration: number; }) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;
  await fetch(`${supabaseUrl}/rest/v1/public_tracks`, { method: "POST", headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ title: result.title, genre: result.genre, mood: result.mood, voice: result.voice, lyrics: result.lyrics, audio_url: result.audioUrl, cover_url: result.coverUrl || null, duration: result.duration }) });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const body = (await req.json()) as GenerateRequest;
    const apiKey = Deno.env.get("SUNO_API_KEY");
    if (!apiKey) return jsonResponse({ error: "SUNO_API_KEY não configurado nos secrets do Supabase." }, 503);
    const lyrics = (body.lyrics || "").slice(0, 5000);
    const title = (body.title || "Minha música").slice(0, 80);
    const genre = body.genre || "Sertanejo";
    const mood = body.mood || "Uplifting";
    const voice = body.voice || "Dueto";
    const requestBody: Record<string, unknown> = { customMode: true, instrumental: false, model: "V5_5", callBackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/webhook`, prompt: lyrics, style: buildStyle(genre, mood).slice(0, 1000), title, duration: 240 };
    const vocalGender = voiceToGender(voice); if (vocalGender) requestBody.vocalGender = vocalGender;
    const createResponse = await fetch(`${SUNO_BASE}/api/v1/generate`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
    if (!createResponse.ok) return jsonResponse({ error: `Falha ao criar música (${createResponse.status})` }, 502);
    const createData = await createResponse.json();
    const taskId: string | undefined = createData.data?.taskId;
    if (!taskId) return jsonResponse({ error: "Não foi possível iniciar a geração de música." }, 502);
    const generated = await pollForAudio(taskId, apiKey);
    const result = { ...generated, title, genre, mood, voice, lyrics, createdAt: new Date().toISOString() };
    await publishTrack(result);
    return jsonResponse(result);
  } catch (err) { const message = err instanceof Error ? err.message : "Unknown error"; console.error("Generate error:", message); return jsonResponse({ error: message }, 500); }
});
