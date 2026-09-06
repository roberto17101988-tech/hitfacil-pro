import { Sparkles, Compass, Mic, Library } from 'lucide-react';
import type { Page } from '@/lib/types';

interface BottomNavProps {
  active: Page;
  onChange: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof Sparkles }[] = [
  { id: 'create', label: 'Criar', icon: Sparkles },
  { id: 'explore', label: 'Explorar', icon: Compass },
  { id: 'cover', label: 'Cover', icon: Mic },
  { id: 'library', label: 'Biblioteca', icon: Library },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0612]/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all"
            >
              <Icon
                className={`transition-all ${isActive ? 'text-fuchsia-400 stroke-[2.5]' : 'text-white/40'}`}
                style={{ width: 22, height: 22 }}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-fuchsia-400' : 'text-white/40'
                }`}
              >
                {item.label}
              </span>
              {isActive && <span className="-mt-0.5 h-1 w-1 rounded-full bg-fuchsia-400" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
