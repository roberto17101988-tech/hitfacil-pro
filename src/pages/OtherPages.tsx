import { Music, Compass, Mic } from 'lucide-react';
import { storage } from '@/lib/storage';

export function ExplorePage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-header rounded-b-3xl px-5 pt-12 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Explorar</h1>
      </div>
      <div className="mx-auto max-w-md px-5 pt-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Compass className="h-8 w-8 text-white/30" />
          </div>
          <h2 className="mb-1 text-lg font-bold text-white/70">Em breve</h2>
          <p className="max-w-xs text-sm text-white/40">
            Explore músicas criadas por outros usuários da comunidade HitFacil PRO.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CoverPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-header rounded-b-3xl px-5 pt-12 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Cover</h1>
      </div>
      <div className="mx-auto max-w-md px-5 pt-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Mic className="h-8 w-8 text-white/30" />
          </div>
          <h2 className="mb-1 text-lg font-bold text-white/70">Em breve</h2>
          <p className="max-w-xs text-sm text-white/40">
            Grave covers das suas músicas favoritas com efeitos de voz profissionais.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LibraryPage() {
  const tracks = storage.getTracks();

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-header rounded-b-3xl px-5 pt-12 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Biblioteca</h1>
      </div>
      <div className="mx-auto max-w-md px-5 pt-6">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Music className="h-8 w-8 text-white/30" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-white/70">Nenhuma música ainda</h2>
            <p className="max-w-xs text-sm text-white/40">
              Crie sua primeira música na aba Criar e ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-white">{track.title}</h3>
                    <p className="text-xs text-white/40">
                      {track.genre} · {track.mood} · {track.voice}
                    </p>
                  </div>
                </div>
                {track.lyrics && (
                  <p className="mt-3 line-clamp-2 whitespace-pre-line text-xs text-white/30">
                    {track.lyrics}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
