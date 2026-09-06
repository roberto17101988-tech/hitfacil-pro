import { Music, Mic, Guitar, Radio, Heart, Headphones, Church, Music2, Sparkles } from 'lucide-react';
import type { Genre } from '@/lib/types';

interface GenreSelectorProps {
  selected: string;
  onSelect: (genre: Genre) => void;
}

const genres: { name: Genre; icon: typeof Music }[] = [
  { name: 'Pop', icon: Music },
  { name: 'Rap', icon: Mic },
  { name: 'Rock', icon: Guitar },
  { name: 'EDM', icon: Radio },
  { name: 'R&B', icon: Heart },
  { name: 'Hip Hop', icon: Headphones },
  { name: 'Gospel', icon: Church },
  { name: 'Sertanejo Gospel', icon: Music2 },
  { name: 'Forró Gospel', icon: Sparkles },
];

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-white/70">Gênero</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {genres.map((genre) => {
          const Icon = genre.icon;
          const isSelected = selected === genre.name;
          return (
            <button
              key={genre.name}
              onClick={() => onSelect(genre.name)}
              className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-center transition-all ${
                isSelected
                  ? 'border-fuchsia-400 bg-gradient-to-br from-fuchsia-500/25 to-violet-500/20 text-white shadow-[0_0_22px_rgba(168,85,247,.16)]'
                  : 'border-white/10 bg-white/[.04] text-white/45 hover:border-white/25 hover:text-white/70'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-tight">{genre.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
