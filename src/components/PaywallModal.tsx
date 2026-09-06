import { X, Coins, Check } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PaywallModal({ open, onClose, onUpgrade }: PaywallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-fuchsia-500/20 bg-[#13091f] p-7 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-purple glow-purple">
          <Coins className="h-7 w-7 text-white" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">Créditos esgotados</h2>
        <p className="mb-5 text-sm leading-relaxed text-white/50">
          Você usou todos os seus créditos gratuitos. Compre mais créditos e continue criando músicas ilimitadas.
        </p>

        <div className="mb-6 space-y-2.5">
          {['Pacote de 50 créditos', 'Músicas cantadas reais', 'Todas as vozes e gêneros', 'Download em MP3'].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20">
                <Check className="h-3 w-3 text-fuchsia-300" />
              </div>
              <span className="text-sm text-white/70">{feat}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full gradient-purple rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 glow-purple"
        >
          Comprar Créditos via PIX
        </button>

        <button
          onClick={onClose}
          className="mt-1 w-full py-3 text-sm font-medium text-white/40 transition-colors hover:text-white/60"
        >
          Talvez depois
        </button>
      </div>
    </div>
  );
}
