export type Voice = 'Masculina' | 'Feminina' | 'Dueto';
export type Genre = 'Sertanejo' | 'Funk' | 'Pagodão' | 'Forró' | 'Gospel' | 'Trap' | 'MPB' | 'Piseiro';
export type Mood = 'Happy' | 'Romantic' | 'Uplifting' | 'Chill' | 'Worship' | 'Adoração';
export type Tab = 'description' | 'lyrics';
export type Page = 'create' | 'explore' | 'cover' | 'library';

export interface CreatedTrack {
  id: string;
  title: string;
  genre: string;
  mood: string;
  voice: string;
  lyrics: string;
  audioUrl?: string;
  coverUrl?: string;
  createdAt: string;
  duration: number;
}

export interface PixPayment {
  paymentId: string;
  mpPaymentId: string;
  pixCode: string;
  pixQrCode: string;
  status: string;
  amount: number;
  email: string;
  isPaid: boolean;
  plan?: string;
}

export interface PaymentStatus {
  mpPaymentId: string;
  status: string;
  isPaid: boolean;
}

export interface GenerateResponse {
  audioUrl: string;
  coverUrl?: string;
  duration: number;
  title: string;
  genre: string;
  mood: string;
  voice: string;
  lyrics: string;
  createdAt: string;
}

export interface PublicTrack {
  id: string;
  title: string;
  genre: string;
  mood: string;
  voice: string;
  lyrics: string;
  audio_url: string;
  cover_url?: string;
  duration: number;
  plays: number;
  created_at: string;
}
