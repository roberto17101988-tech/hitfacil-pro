import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  title: string;
  subtitle: string;
  audioUrl?: string;
  duration: number;
  genre?: string;
  mood?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ title, subtitle, audioUrl, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actualDuration, setActualDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      setLoading(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const onLoaded = () => {
        setLoading(false);
        setActualDuration(audio.duration || duration);
      };
      const onTimeUpdate = () => setElapsed(audio.currentTime);
      const onEnded = () => { setIsPlaying(false); setElapsed(0); };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [audioUrl, duration]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'musica'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(audioUrl, '_blank');
    }
  };

  const progress = actualDuration > 0 ? (elapsed / actualDuration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-4 mb-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-purple shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-white text-white" />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="truncate text-xs text-white/40">{subtitle}</p>
        </div>
        {audioUrl && (
          <button
            onClick={handleDownload}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/50 transition-colors hover:bg-white/15 hover:text-fuchsia-300"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full gradient-purple transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-white/40">
        <span>{formatTime(elapsed)}</span>
        <span>{formatTime(actualDuration)}</span>
      </div>

      {isPlaying && (
        <div className="mt-3 flex h-6 items-end justify-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="w-1 animate-wave rounded-full bg-fuchsia-400"
              style={{
                height: '100%',
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${0.8 + (i % 3) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
