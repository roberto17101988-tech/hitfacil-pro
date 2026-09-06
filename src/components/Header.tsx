import { Zap, Settings, Coins } from 'lucide-react';

interface HeaderProps {
  onUpgrade: () => void;
  onSettings: () => void;
  credits: number;
}

export function Header({ onUpgrade, onSettings, credits }: HeaderProps) {
  return (
    <header className="gradient-header rounded-b-3xl px-5 pt-12 pb-5 shadow-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow">
          HitFacil <span className="text-fuchsia-200">PRO</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Coins className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-xs font-bold text-white">{credits}</span>
          </div>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <Zap className="h-3.5 w-3.5 fill-white" />
            COMPRAR
          </button>
          <button
            onClick={onSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-90"
          >
            <Settings className="h-4.5 w-4.5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
