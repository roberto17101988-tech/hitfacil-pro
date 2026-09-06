import { Mic2, Users, UserRound } from 'lucide-react';
import type { Voice } from '@/lib/types';

interface VoiceSelectorProps {
  selected: string;
  onSelect: (voice: Voice) => void;
}

const voices: { name: Voice; icon: typeof Mic2; description: string; featured?: boolean }[] = [
  { name: 'Masculina', icon: UserRound, description: 'Voz masculina' },
  { name: 'Feminina', icon: Mic2, description: 'Voz feminina' },
  { name: 'Dueto', icon: Users, description: 'Duas vozes', featured: true },
];

export function VoiceSelector({ selected, onSelect }: VoiceSelectorProps) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70">Voz</h3>
        <span className="text-[10px] uppercase tracking-wider text-fuchsia-300 font-bold">Mais popular</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {voices.map((voice) => {
          const Icon = voice.icon;
          const isSelected = selected === voice.name;
          return (
            <button
              key={voice.name}
              onClick={() => onSelect(voice.name)}
              className={`relative rounded-2xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-fuchsia-400 bg-fuchsia-500/15 shadow-[0_0_24px_rgba(217,70,239,.18)]'
                  : 'border-white/10 bg-white/[.04] hover:border-white/25'
              }`}
            >
              {voice.featured && <span className="absolute -top-2 right-2 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[9px] font-bold text-white">TOP</span>}
              <Icon className={`mb-2 h-5 w-5 ${isSelected ? 'text-fuchsia-300' : 'text-white/45'}`} />
              <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/65'}`}>{voice.name}</p>
              <p className="mt-0.5 text-[10px] text-white/35">{voice.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
