export type Voice = 'Masculina' | 'Feminina' | 'Dueto';
export type Genre = 'Pop' | 'Rap' | 'Rock' | 'EDM' | 'R&B' | 'Hip Hop' | 'Gospel' | 'Sertanejo Gospel' | 'Forró Gospel';
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
}

export interface PaymentStatus {
  mpPaymentId: string;
  status: string;
  isPaid: boolean;
}

export interface GenerateResponse {
  audioUrl: string;
  duration: number;
  title: string;
  genre: string;
  mood: string;
  voice: string;
  lyrics: string;
  createdAt: string;
}
