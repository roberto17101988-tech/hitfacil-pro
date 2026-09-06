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

function getEnv(key: string): string | undefined {
  try {
    return Deno.env.get(key) ?? undefined;
  } catch {
    return process.env[key] ?? undefined;
  }
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Map voice selection to Suno-style tags
function voiceToTags(voice: string): string {
  switch (voice) {
    case "Masculina": return "male vocal";
    case "Feminina": return "female vocal";
    case "Dueto": return "male and female duet vocals";
    default: return "male and female duet vocals";
  }
}

// Map genre + mood to a description prompt for the AI music API
function buildPrompt(data: GenerateRequest): string {
  const parts: string[] = [];
  const genreStr = data.genre || "pop";
  const moodStr = data.mood || "uplifting";
  const voiceStr = voiceToTags(data.voice || "Dueto");

  parts.push(`${genreStr} ${moodStr} song with ${voiceStr}`);
  if (data.title) parts.push(`titled "${data.title}"`);
  return parts.join(", ");
}

async function pollForAudio(taskId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  const pollUrl = `https://api.musicapi.org/api/v1/sonic/fetch/${taskId}`;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const resp = await fetch(pollUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      // Check for audio URL in common response shapes
      const url = data.audio_url || data.data?.audio_url || data.data?.output?.audio_url || data.output?.audio_url;
      const status = data.status || data.data?.status;
      if (url) return url;
      if (status === "failed" || status === "error") throw new Error("Generation failed");
    } catch {
      // keep polling
    }
  }
  throw new Error("Timeout waiting for audio generation");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as GenerateRequest;

    // Read the MusicAPI key from environment — NEVER hardcode it
    const apiKey = getEnv("MUSICAPI_KEY") || getEnv("VITE_MUSICAPI_KEY");

    if (!apiKey) {
      return jsonResponse(
        { error: "MUSICAPI_KEY não configurado. Adicione a variável MUSICAPI_KEY nos secrets do Supabase." },
        503,
      );
    }

    const prompt = buildPrompt(body);
    const lyrics = body.lyrics || "";
    const title = body.title || "Untitled Track";

    console.log(`Generate — prompt: ${prompt}, lyrics length: ${lyrics.length}`);

    // Step 1: Create music generation task via musicapi.org
    const createResponse = await fetch("https://api.musicapi.org/api/v1/sonic/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gpt_description_prompt: prompt,
        lyrics: lyrics || undefined,
        mv: "sonic-v3-5",
        title: title,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("MusicAPI create error:", errorText);
      return jsonResponse(
        { error: `Falha ao criar música (${createResponse.status})` },
        502,
      );
    }

    const createData = await createResponse.json();
    const taskId = createData.task_id || createData.id || createData.data?.task_id || createData.data?.id;

    if (!taskId) {
      // Some APIs return the audio URL directly
      const directUrl = createData.audio_url || createData.data?.audio_url || createData.output?.audio_url;
      if (directUrl) {
        const result: GenerateResult = {
          audioUrl: directUrl,
          duration: 30,
          title,
          genre: body.genre || "Pop",
          mood: body.mood || "Happy",
          voice: body.voice || "Dueto",
          lyrics,
          createdAt: new Date().toISOString(),
        };
        return jsonResponse(result);
      }
      return jsonResponse({ error: "Não foi possível iniciar a geração de música." }, 502);
    }

    console.log(`Task created: ${taskId}, polling for audio...`);

    // Step 2: Poll for the completed audio
    const audioUrl = await pollForAudio(taskId, apiKey);

    const result: GenerateResult = {
      audioUrl,
      duration: 30,
      title,
      genre: body.genre || "Pop",
      mood: body.mood || "Happy",
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
