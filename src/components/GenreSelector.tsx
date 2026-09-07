import { Guitar, Flame, Drum, Wind, Cross, AudioLines, Disc3, Music2 } from 'lucide-react';
import type { Genre } from '@/lib/types';

interface GenreSelectorProps { selected: string; onSelect: (genre: Genre) => void; }

const genres: { name: Genre; icon: typeof Guitar; tone: string }[] = [
  { name: 'Sertanejo', icon: Guitar, tone: 'from-amber-400/25 to-orange-500/10' },
  { name: 'Funk', icon: Flame, tone: 'from-rose-400/25 to-red-500/10' },
  { name: 'Pagodão', icon: Drum, tone: 'from-yellow-400/25 to-amber-500/10' },
  { name: 'Forró', icon: Wind, tone: 'from-orange-400/25 to-yellow-500/10' },
  { name: 'Gospel', icon: Cross, tone: 'from-sky-400/25 to-cyan-500/10' },
  { name: 'Trap', icon: AudioLines, tone: 'from-slate-300/20 to-slate-500/10' },
  { name: 'MPB', icon: Disc3, tone: 'from-emerald-400/25 to-teal-500/10' },
  { name: 'Piseiro', icon: Music2, tone: 'from-lime-400/25 to-green-500/10' },
];

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-end justify-between">
        <div><p className="eyebrow">Identidade sonora</p><h3 className="text-lg font-bold text-white">Escolha seu estilo BR</h3></div>
        <span className="text-[10px] font-semibold text-white/35">8 estilos</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {genres.map(({ name, icon: Icon, tone }) => {
          const isSelected = selected === name;
          return <button key={name} onClick={() => onSelect(name)} className={`group flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl border px-1 text-center transition-all ${isSelected ? `border-lime-300/80 bg-gradient-to-br ${tone} text-white shadow-[0_0_24px_rgba(163,230,53,.14)]` : 'border-white/8 bg-white/[.035] text-white/45 hover:border-white/20 hover:bg-white/[.07] hover:text-white/80'}`}><Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isSelected ? 'text-lime-300' : ''}`} /><span className="text-[10px] font-bold leading-tight">{name}</span></button>;
        })}
      </div>
    </section>
  );
}
