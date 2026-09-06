import type { CreatedTrack } from './types';

const LYRICS_KEY = 'hitmusic:lyrics';
const TITLE_KEY = 'hitmusic:title';
const GENRE_KEY = 'hitmusic:genre';
const MOOD_KEY = 'hitmusic:mood';
const VOICE_KEY = 'hitmusic:voice';
const CREDITS_KEY = 'hitmusic:credits';
const TRACKS_KEY = 'hitmusic:tracks';
const PREMIUM_KEY = 'hitmusic:premium';
const IS_PAID_KEY = 'hitmusic:isPaid';
const PAYMENT_ID_KEY = 'hitmusic:paymentId';
const EMAIL_KEY = 'hitmusic:email';

export const storage = {
  getLyrics(): string {
    return localStorage.getItem(LYRICS_KEY) || '';
  },
  setLyrics(lyrics: string): void {
    localStorage.setItem(LYRICS_KEY, lyrics);
  },
  getTitle(): string {
    return localStorage.getItem(TITLE_KEY) || '';
  },
  setTitle(title: string): void {
    localStorage.setItem(TITLE_KEY, title);
  },
  getGenre(): string {
    return localStorage.getItem(GENRE_KEY) || '';
  },
  setGenre(genre: string): void {
    localStorage.setItem(GENRE_KEY, genre);
  },
  getMood(): string {
    return localStorage.getItem(MOOD_KEY) || '';
  },
  setVoice(voice: string): void {
    localStorage.setItem(VOICE_KEY, voice);
  },
  getVoice(): string {
    return localStorage.getItem(VOICE_KEY) || 'Dueto';
  },
  setMood(mood: string): void {
    localStorage.setItem(MOOD_KEY, mood);
  },
  getTracks(): CreatedTrack[] {
    try {
      const raw = localStorage.getItem(TRACKS_KEY);
      return raw ? JSON.parse(raw) as CreatedTrack[] : [];
    } catch {
      return [];
    }
  },
  addTrack(track: CreatedTrack): void {
    const tracks = this.getTracks();
    tracks.unshift(track);
    localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
  },
  getTrackCount(): number {
    return this.getTracks().length;
  },
  getCredits(): number {
    const saved = localStorage.getItem(CREDITS_KEY);
    if (saved === null) {
      localStorage.setItem(CREDITS_KEY, '24');
      return 24;
    }
    return Math.max(0, Number(saved) || 0);
  },
  setCredits(value: number): void {
    localStorage.setItem(CREDITS_KEY, String(Math.max(0, value)));
  },
  spendCredit(): boolean {
    const credits = this.getCredits();
    if (credits < 1) return false;
    this.setCredits(credits - 1);
    return true;
  },
  addCredits(value: number): void {
    this.setCredits(this.getCredits() + value);
  },
  isPremium(): boolean {
    return localStorage.getItem(PREMIUM_KEY) === 'true';
  },
  setPremium(value: boolean): void {
    localStorage.setItem(PREMIUM_KEY, String(value));
  },
  isPaid(): boolean {
    return localStorage.getItem(IS_PAID_KEY) === 'true';
  },
  setPaid(value: boolean): void {
    localStorage.setItem(IS_PAID_KEY, String(value));
  },
  getPaymentId(): string {
    return localStorage.getItem(PAYMENT_ID_KEY) || '';
  },
  setPaymentId(id: string): void {
    localStorage.setItem(PAYMENT_ID_KEY, id);
  },
  getEmail(): string {
    return localStorage.getItem(EMAIL_KEY) || '';
  },
  setEmail(email: string): void {
    localStorage.setItem(EMAIL_KEY, email);
  },
};
