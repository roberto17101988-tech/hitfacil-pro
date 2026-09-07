const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  lyrics: string;
  title?: string;
  genre?: string;
  mood?: string;
  voice?: string;
}

interface GenerateResult {
  audioUrl: string;
  duration: number;
  title: string;
  genre: string;
  mood: string;
  voice: string;
  lyrics: string;
  createdAt: string;
}

const SUNO_BASE = "https://api.sunoapi.org";

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function voiceToGender(voice: string): "m" | "f" | undefined {
  switch (voice) {
    case "Masculina": return "m";
    case "Feminina": return "f";
    default: return undefined;
  }
}

function buildStyle(genre: string, mood: string): string {
  const parts = [genre, mood].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Pop";
}

interface SunoTask {
  taskId: string;
}

interface SunoRecordResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    response?: {
      sunoData?: Array<{
        audioUrl?: string;
        streamAudioUrl?: string;
        duration?: number;
        title?: string;
      }>;
    };
    errorCode?: string | null;
    errorMessage?: string | null;
  };
}

async function pollForAudio(
  taskId: string,
  apiKey: string,
  maxAttempts = 60,
): Promise<{ audioUrl: string; duration: number }> {
  const pollUrl = `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const resp = await fetch(pollUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (!resp.ok) continue;
      const data: SunoRecordResponse = await resp.json();

      if (data.code !== 200) continue;

      const status = data.data?.status;
      if (status === "SUCCESS") {
        const tracks = data.data?.response?.sunoData;
        if (tracks && tracks.length > 0 && tracks[0].audioUrl) {
          return {
            audioUrl: tracks[0].audioUrl,
            duration: tracks[0].duration || 30,
          };
        }
      }

      const failedStatuses = [
        "CREATE_TASK_FAILED",
        "GENERATE_AUDIO_FAILED",
        "CALLBACK_EXCEPTION",
        "SENSITIVE_WORD_ERROR",
      ];
      if (failedStatuses.includes(status || "")) {
        throw new Error(data.data?.errorMessage || `Geração falhou: ${status}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Geração falhou")) {
        throw e;
      }
    }
  }
  throw new Error("Tempo esgotado aguardando a geração da música");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as GenerateRequest;

    const apiKey = Deno.env.get("SUNO_API_KEY");

    if (!apiKey) {
      return jsonResponse(
        { error: "SUNO_API_KEY não configurado nos secrets do Supabase." },
        503,
      );
    }

    const lyrics = body.lyrics || "";
    const title = (body.title || "Untitled Track").slice(0, 80);
    const genre = body.genre || "Pop";
    const mood = body.mood || "Happy";
    const style = buildStyle(genre, mood);
    const vocalGender = voiceToGender(body.voice || "Dueto");

    console.log(`Generate — style: ${style}, title: ${title}, voice: ${body.voice}, lyrics length: ${lyrics.length}`);

    const requestBody: Record<string, unknown> = {
      customMode: true,
      instrumental: false,
      model: "V4_5ALL",
      callBackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/webhook`,
      prompt: lyrics.slice(0, 5000),
      style: style.slice(0, 1000),
      title,
    };

    if (vocalGender) {
      requestBody.vocalGender = vocalGender;
    }

    const createResponse = await fetch(`${SUNO_BASE}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Suno create error:", errorText);
      return jsonResponse(
        { error: `Falha ao criar música (${createResponse.status})` },
        502,
      );
    }

    const createData = await createResponse.json();
    const taskId: string | undefined = createData.data?.taskId;

    if (!taskId) {
      return jsonResponse({ error: "Não foi possível iniciar a geração de música." }, 502);
    }

    console.log(`Task created: ${taskId}, polling for audio...`);

    const { audioUrl, duration } = await pollForAudio(taskId, apiKey);

    const result: GenerateResult = {
      audioUrl,
      duration,
      title,
      genre,
      mood,
      voice: body.voice || "Dueto",
      lyrics,
      createdAt: new Date().toISOString(),
    };

    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
