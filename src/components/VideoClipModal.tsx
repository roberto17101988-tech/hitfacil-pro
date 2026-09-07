import { useEffect, useRef, useState } from 'react';
import { Download, Play, Pause, X, Video } from 'lucide-react';

interface VideoClipModalProps { open: boolean; onClose: () => void; title: string; lyrics: string; audioUrl?: string; coverUrl?: string; }

export function VideoClipModal({ open, onClose, title, lyrics, audioUrl, coverUrl }: VideoClipModalProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audioRef.current?.pause(); }, [open]);
  if (!open) return null;
  const toggle = () => {
    if (!audioUrl) return;
    if (!audioRef.current) audioRef.current = new Audio(audioUrl);
    if (playing) audioRef.current.pause(); else void audioRef.current.play();
    setPlaying(!playing);
  };
  const download = () => {
    if (!audioUrl) return;
    const link = document.createElement('a'); link.href = audioUrl; link.download = `${title || 'hitfacil-clipe'}.mp4`; link.target = '_blank'; link.click();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" onClick={onClose}>
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-[#101411] shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-lime-300/30 via-emerald-950 to-black">
        {coverUrl && <img src={coverUrl} alt="Capa da música" className="absolute inset-0 h-full w-full object-cover opacity-65" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-6 bottom-6"><p className="eyebrow text-lime-300">HITFACIL VISUAL</p><h2 className="mt-2 text-2xl font-black text-white">{title}</h2></div>
        <button onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-5"><p className="mb-4 max-h-28 overflow-hidden whitespace-pre-line text-center text-sm leading-6 text-white/65">{lyrics}</p><div className="flex gap-2"><button onClick={toggle} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 py-3 text-sm font-extrabold text-black">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{playing ? 'Pausar clipe' : 'Prévia com letra'}</button><button onClick={download} className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white"><Download className="h-4 w-4" /></button></div><p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-white/30"><Video className="h-3 w-3" /> Baixe o vídeo com a letra na tela</p></div>
    </div>
  </div>;
}
