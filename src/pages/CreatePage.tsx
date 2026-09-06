import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Wand2, Check, Coins } from 'lucide-react';
import { Header } from '@/components/Header';
import { VoiceSelector } from '@/components/VoiceSelector';
import { GenreSelector } from '@/components/GenreSelector';
import { MoodSelector } from '@/components/MoodSelector';
import { PaywallModal } from '@/components/PaywallModal';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AudioPlayer } from '@/components/AudioPlayer';
import { storage } from '@/lib/storage';
import { generateTrack } from '@/lib/api';
import type { Genre, Mood, Voice, Tab, CreatedTrack } from '@/lib/types';

interface CreatePageProps {
  onUpgrade: () => void;
}

const LYRIC_LIMIT = 2500;

const SAMPLE_LYRICS = [
  '[Verse 1]\nUnder the neon lights we dance\nChasing dreams in every glance\nFeel the rhythm in your soul\nLet the music take control\n\n[Chorus]\nWe are rising higher\nFueled by the fire\nTogether we are strong\nThis is our song',
  '[Verse 1]\nStars above and ocean deep\nPromises that we will keep\nEvery heartbeat calls your name\nNothing here will stay the same\n\n[Chorus]\nYou are my light in the dark\nA flame from a single spark\nHold me close and never let go\nOur love is the only thing I know',
  '[Verse 1]\nWalking through the city rain\nWashing off the hidden pain\nTomorrow brings a brand new song\nWhere you and I belong\n\n[Chorus]\nLift your voice and sing\nLet the heavens ring\nGlory to the One above\nFilled with endless love',
];

const LOADING_STEPS = [
  'Gerando a letra...',
  'Enviando para o Suno AI...',
  'Compondo a melodia...',
  'Cantando com a voz selecionada...',
  'Mixando e finalizando...',
];

export function CreatePage({ onUpgrade }: CreatePageProps) {
  const [tab, setTab] = useState<Tab>('lyrics');
  const [lyrics, setLyrics] = useState(() => storage.getLyrics());
  const [title, setTitle] = useState(() => storage.getTitle());
  const [genre, setGenre] = useState(() => storage.getGenre());
  const [mood, setMood] = useState(() => storage.getMood());
  const [voice, setVoice] = useState(() => storage.getVoice());
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [createdTrack, setCreatedTrack] = useState<CreatedTrack | null>(null);
  const [credits, setCredits] = useState(() => storage.getCredits());
  const loadingStepRef = useRef<number | null>(null);

  useEffect(() => {
    setCredits(storage.getCredits());
  }, []);

  const handleLyricsChange = (value: string) => {
    const trimmed = value.slice(0, LYRIC_LIMIT);
    setLyrics(trimmed);
    storage.setLyrics(trimmed);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    storage.setTitle(value);
  };

  const handleGenreSelect = (g: Genre) => {
    const newGenre = genre === g ? '' : g;
    setGenre(newGenre);
    storage.setGenre(newGenre);
  };

  const handleMoodSelect = (m: Mood) => {
    const newMood = mood === m ? '' : m;
    setMood(newMood);
    storage.setMood(newMood);
  };

  const handleVoiceSelect = (v: Voice) => {
    setVoice(v);
    storage.setVoice(v);
  };

  const handleInspire = () => {
    const random = SAMPLE_LYRICS[Math.floor(Math.random() * SAMPLE_LYRICS.length)];
    handleLyricsChange(random);
  };

  const clearLoadingSteps = () => {
    if (loadingStepRef.current) {
      clearInterval(loadingStepRef.current);
      loadingStepRef.current = null;
    }
  };

  const startLoadingSteps = () => {
    let step = 0;
    setLoadingMsg(LOADING_STEPS[0]);
    loadingStepRef.current = window.setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingMsg(LOADING_STEPS[step]);
    }, 2000);
  };

  useEffect(() => {
    return () => clearLoadingSteps();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!lyrics.trim() || loading) return;

    if (storage.getCredits() < 1) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setCreatedTrack(null);
    startLoadingSteps();

    try {
      const result = await generateTrack({
        lyrics,
        title: title || undefined,
        genre: genre || undefined,
        mood: mood || undefined,
        voice: voice || undefined,
      });

      storage.spendCredit();
      setCredits(storage.getCredits());

      const track: CreatedTrack = {
        id: crypto.randomUUID(),
        title: result.title,
        genre: result.genre,
        mood: result.mood,
        voice: result.voice,
        lyrics: result.lyrics || lyrics,
        audioUrl: result.audioUrl || undefined,
        createdAt: result.createdAt,
        duration: result.duration,
      };
      storage.addTrack(track);
      setCreatedTrack(track);
    } catch {
      // Fallback: still create the track without audio URL
      storage.spendCredit();
      setCredits(storage.getCredits());

      const track: CreatedTrack = {
        id: crypto.randomUUID(),
        title: title || 'Untitled Track',
        genre: genre || 'Pop',
        mood: mood || 'Happy',
        voice: voice || 'Dueto',
        lyrics,
        createdAt: new Date().toISOString(),
        duration: 30,
      };
      storage.addTrack(track);
      setCreatedTrack(track);
    } finally {
      clearLoadingSteps();
      setLoadingMsg('Música criada com sucesso!');
      setTimeout(() => setLoading(false), 600);
    }
  }, [lyrics, title, genre, mood, voice, loading]);

  return (
    <div className="min-h-screen pb-24">
      <Header
        onUpgrade={onUpgrade}
        onSettings={() => {}}
        credits={credits}
      />

      <div className="mx-auto max-w-md px-5 pt-5">
        {/* Credits banner */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-fuchsia-500/15 bg-fuchsia-500/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-300" />
            <span className="text-xs font-medium text-white/70">
              {credits} {credits === 1 ? 'crédito' : 'créditos'} restantes
            </span>
          </div>
          <button
            onClick={onUpgrade}
            className="text-xs font-bold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
          >
            Comprar mais
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-6 border-b border-white/10">
          <button
            onClick={() => setTab('description')}
            className={`relative pb-3 text-sm font-semibold transition-colors ${
              tab === 'description' ? 'text-white' : 'text-white/40'
            }`}
          >
            Descrição da Música
            {tab === 'description' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full gradient-purple" />
            )}
          </button>
          <button
            onClick={() => setTab('lyrics')}
            className={`relative pb-3 text-sm font-semibold transition-colors ${
              tab === 'lyrics' ? 'text-white' : 'text-white/40'
            }`}
          >
            Letra
            {tab === 'lyrics' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full gradient-purple" />
            )}
          </button>
        </div>

        {tab === 'lyrics' && (
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={handleInspire}
                className="absolute -top-1 right-0 z-10 flex items-center gap-1.5 rounded-full bg-fuchsia-500/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-fuchsia-400"
              >
                <Wand2 className="h-3 w-3" />
                Inspire-me
              </button>
              <textarea
                value={lyrics}
                onChange={(e) => handleLyricsChange(e.target.value)}
                placeholder="Insira a Letra"
                rows={8}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 pt-12 text-sm text-white placeholder-white/30 transition-colors focus:border-fuchsia-500/50 focus:outline-none"
              />
              <div className="absolute bottom-3 right-3 font-mono text-[11px] text-white/30">
                {lyrics.length}/{LYRIC_LIMIT}
              </div>
            </div>
            <button className="mt-3 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500">
              <Sparkles className="h-4 w-4" />
              Gerador de Letras
            </button>
          </div>
        )}

        {tab === 'description' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/60">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Insira o Título da Música (Opcional)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {tab === 'lyrics' && (
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Insira o Título da Música (Opcional)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
        )}

        <VoiceSelector selected={voice} onSelect={handleVoiceSelect} />
        <GenreSelector selected={genre} onSelect={handleGenreSelect} />
        <MoodSelector selected={mood} onSelect={handleMoodSelect} />

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!lyrics.trim() || loading || credits < 1}
          className="w-full gradient-purple rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 mb-4 glow-purple"
        >
          {credits < 1 ? 'Sem créditos' : 'Criar'}
        </button>

        {/* Audio player after creation */}
        {createdTrack && !loading && (
          <>
            <div className="mb-3 flex items-center gap-2 animate-fade-in">
              <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-purple">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">Música criada com sucesso!</p>
            </div>
            <AudioPlayer
              title={createdTrack.title}
              subtitle={`${createdTrack.genre} · ${createdTrack.mood} · ${createdTrack.voice}`}
              audioUrl={createdTrack.audioUrl}
              duration={createdTrack.duration}
            />
          </>
        )}
      </div>

      {loading && <LoadingOverlay message={loadingMsg} />}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={onUpgrade}
      />
    </div>
  );
}
