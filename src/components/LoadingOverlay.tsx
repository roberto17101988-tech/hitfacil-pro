import { Loader2 } from 'lucide-react';

export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-fuchsia-500/30 animate-pulse-ring" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full gradient-purple glow-purple">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      </div>
      <div className="mb-4 flex h-8 items-end gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 animate-wave rounded-full bg-fuchsia-400"
            style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-white/70">{message}</p>
    </div>
  );
}
