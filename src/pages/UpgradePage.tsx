import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Copy, Check, Loader2, QrCode, Mail, Zap, Coins, Clock } from 'lucide-react';
import { createPixPayment, checkPaymentStatus } from '@/lib/api';
import { storage } from '@/lib/storage';
import type { PixPayment } from '@/lib/types';

interface UpgradePageProps {
  onBack: () => void;
  onPaid: (credits: number) => void;
}

const CREDIT_PACKS = [
  { credits: 50, price: 19.9, label: '50 Créditos', popular: true },
  { credits: 120, price: 39.9, label: '120 Créditos', popular: false },
  { credits: 300, price: 89.9, label: '300 Créditos', popular: false },
];

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 30 * 60 * 1000;

export function UpgradePage({ onBack, onPaid }: UpgradePageProps) {
  const [selectedPack, setSelectedPack] = useState(0);
  const [email, setEmail] = useState(() => storage.getEmail());
  const [emailError, setEmailError] = useState('');
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const pollStartRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback((mpPaymentId: string, creditsToBuy: number) => {
    stopPolling();
    pollStartRef.current = Date.now();
    setPolling(true);

    pollTimerRef.current = window.setInterval(async () => {
      if (pollStartRef.current && Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
        stopPolling();
        return;
      }

      try {
        const status = await checkPaymentStatus(mpPaymentId);
        if (status.isPaid) {
          stopPolling();
          setPaidConfirmed(true);
          storage.addCredits(creditsToBuy);
          setTimeout(() => onPaid(creditsToBuy), 2000);
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL);
  }, [stopPolling, onPaid]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email é obrigatório.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError('Email inválido.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleGeneratePix = async () => {
    if (!validateEmail(email)) return;

    const pack = CREDIT_PACKS[selectedPack];
    setLoading(true);
    setError('');
    setPayment(null);
    storage.setEmail(email.trim());

    try {
      const result = await createPixPayment(email.trim(), pack.credits, pack.price);
      setPayment(result);
      storage.setPaymentId(result.mpPaymentId);
      startPolling(result.mpPaymentId, pack.credits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (payment?.pixCode) {
      navigator.clipboard.writeText(payment.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePayment = () => {
    stopPolling();
    setPaidConfirmed(true);
    storage.addCredits(CREDIT_PACKS[selectedPack].credits);
    setTimeout(() => onPaid(CREDIT_PACKS[selectedPack].credits), 1500);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-header rounded-b-3xl px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { stopPolling(); onBack(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-90"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Comprar Créditos</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Hero */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-300">
            <Zap className="h-3 w-3 fill-fuchsia-300" />
            HITFACIL PRO
          </div>
          <h2 className="mb-1 text-2xl font-extrabold text-white">Compre créditos</h2>
          <p className="text-sm text-white/50">Crie músicas cantadas reais com IA</p>
        </div>

        {/* Credit packs */}
        {!paidConfirmed && !payment && (
          <div className="mb-6 space-y-3">
            {CREDIT_PACKS.map((pack, i) => (
              <button
                key={i}
                onClick={() => setSelectedPack(i)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                  selectedPack === i
                    ? 'border-fuchsia-400 bg-gradient-to-r from-fuchsia-500/15 to-violet-500/10 shadow-[0_0_24px_rgba(217,70,239,.15)]'
                    : 'border-white/10 bg-white/[.04] hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    selectedPack === i ? 'gradient-purple' : 'bg-white/8'
                  }`}>
                    <Coins className={`h-5 w-5 ${selectedPack === i ? 'text-white' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${selectedPack === i ? 'text-white' : 'text-white/70'}`}>{pack.label}</p>
                    {pack.popular && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">Mais popular</p>
                    )}
                  </div>
                </div>
                <p className={`text-lg font-extrabold ${selectedPack === i ? 'text-fuchsia-300' : 'text-white/50'}`}>
                  R${pack.price.toFixed(2).replace('.', ',')}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Email + PIX section */}
        {!paidConfirmed && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            {!payment && (
              <>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/60">
                  <Mail className="h-4 w-4" />
                  Seu email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                  placeholder="seu@email.com"
                  className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:outline-none ${
                    emailError ? 'border-red-500/50' : 'border-white/10 focus:border-fuchsia-500/50'
                  }`}
                />
                {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}

                <button
                  onClick={handleGeneratePix}
                  disabled={loading}
                  className="mt-4 w-full gradient-purple rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 glow-purple"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando PIX...
                    </span>
                  ) : (
                    `Pagar R$${CREDIT_PACKS[selectedPack].price.toFixed(2).replace('.', ',')} via PIX`
                  )}
                </button>

                {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
              </>
            )}

            {payment && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/20">
                    <QrCode className="h-4.5 w-4.5 text-fuchsia-300" />
                  </div>
                  <h3 className="text-base font-bold text-white">Pague com PIX</h3>
                  {polling && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-fuchsia-300">
                      <Clock className="h-3 w-3" />
                      Aguardando...
                    </span>
                  )}
                </div>

                {payment.pixQrCode ? (
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-xl bg-white p-3">
                      <img src={`data:image/png;base64,${payment.pixQrCode}`} alt="PIX QR Code" className="h-48 w-48" />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl bg-white/10 p-8 text-center">
                    <QrCode className="mx-auto mb-2 h-16 w-16 text-white/30" />
                    <p className="text-xs text-white/40">QR Code indisponível</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-white/40">Código PIX (Copia e Cola)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={payment.pixCode || 'Código indisponível'}
                      className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-white/60"
                    />
                    <button
                      onClick={handleCopy}
                      disabled={!payment.pixCode}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/20 transition-colors hover:bg-fuchsia-500/30 disabled:opacity-40"
                    >
                      {copied ? <Check className="h-4 w-4 text-fuchsia-300" /> : <Copy className="h-4 w-4 text-fuchsia-300" />}
                    </button>
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                  <span className={`h-2 w-2 rounded-full ${polling ? 'animate-pulse bg-fuchsia-400' : 'bg-white/30'}`} />
                  {polling ? 'Aguardando pagamento...' : 'PIX gerado'}
                </div>

                <button
                  onClick={handleSimulatePayment}
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/15"
                >
                  Já paguei — Confirmar
                </button>

                <p className="mt-3 text-center text-[11px] text-white/30">
                  {CREDIT_PACKS[selectedPack].credits} créditos serão adicionados após a confirmação.
                </p>
              </>
            )}
          </div>
        )}

        {/* Payment confirmed */}
        {paidConfirmed && (
          <div className="animate-fade-in rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-purple glow-purple">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Pagamento confirmado!</h2>
            <p className="text-sm text-white/50">{CREDIT_PACKS[selectedPack].credits} créditos adicionados. Redirecionando...</p>
          </div>
        )}
      </div>
    </div>
  );
}
