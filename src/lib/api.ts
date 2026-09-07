import type { GenerateResponse, PixPayment, PaymentStatus, PublicTrack } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function generateTrack(params: {
  lyrics: string;
  title?: string;
  genre?: string;
  mood?: string;
  voice?: string;
}): Promise<GenerateResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate`, {
    method: 'POST', headers, body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok || data.error || typeof data.audioUrl !== 'string') {
    throw new Error(data.error || `Falha ao gerar música (${response.status})`);
  }
  return data as GenerateResponse;
}

export async function createPixPayment(plan: string, email: string): Promise<PixPayment> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/pix`, {
    method: 'POST', headers, body: JSON.stringify({ plan, email }),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `Falha ao criar PIX (${response.status})`);
  return data as PixPayment;
}

export async function checkPaymentStatus(mpPaymentId: string): Promise<PaymentStatus> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/pix?mp_payment_id=${encodeURIComponent(mpPaymentId)}`, { headers });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `Falha ao verificar pagamento (${response.status})`);
  return data as PaymentStatus;
}

export async function fetchTrendingTracks(): Promise<PublicTrack[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/public_tracks?is_public=eq.true&order=plays.desc,created_at.desc&limit=30`, { headers });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) throw new Error('Não foi possível carregar as músicas em alta.');
  return data as PublicTrack[];
}
