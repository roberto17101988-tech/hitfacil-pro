import type { Mood } from '@/lib/types';

interface MoodSelectorProps {
  selected: string;
  onSelect: (mood: Mood) => void;
}

const moods: Mood[] = ['Happy', 'Romantic', 'Uplifting', 'Chill', 'Worship', 'Adoração'];

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-white/70">Humor</h3>
      <div className="flex flex-wrap gap-2.5">
        {moods.map((m) => {
          const isSelected = selected === m;
          return (
            <button
              key={m}
              onClick={() => onSelect(m)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-500/25 scale-105'
                  : 'bg-white/[.06] text-white/50 hover:bg-white/12 hover:text-white/70'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </section>
  );
}
