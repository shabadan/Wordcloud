import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, Lock, Sparkles, MessageSquare, History } from 'lucide-react';
import { PublicState } from '../types';

interface ParticipantViewProps {
  state: PublicState;
  onSubmitWord: (word: string) => Promise<{ success: boolean; message?: string }>;
  onSwitchToDisplay?: () => void;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  state,
  onSubmitWord,
  onSwitchToDisplay,
}) => {
  const [word, setWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [myHistory, setMyHistory] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.isOpen) {
      setFeedback({
        type: 'error',
        message: 'Le risposte sono temporaneamente bloccate dal moderatore.',
      });
      return;
    }

    const cleanWord = word.trim().toUpperCase();
    if (!cleanWord) return;

    if (cleanWord.length > 30) {
      setFeedback({
        type: 'error',
        message: 'La parola può contenere al massimo 30 caratteri.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await onSubmitWord(cleanWord);
      if (res.success) {
        setWord('');
        setFeedback({
          type: 'success',
          message: `"${cleanWord}" inviata con successo! Guarda lo schermo live!`,
        });
        setMyHistory((prev) => [cleanWord, ...prev.filter((w) => w !== cleanWord)].slice(0, 5));

        // Coriandoli celebrativi
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF3366', '#00E599', '#00D2FF', '#FFD000', '#A855F7'],
        });

        setTimeout(() => {
          setFeedback(null);
        }, 3500);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || "Errore durante l'invio della parola.",
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Errore di connessione. Riprova.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow di sfondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge di stato */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  state.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  state.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                state.isOpen ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {state.isOpen ? 'Risposte Aperte' : 'Risposte Bloccate'}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
            {state.totalSubmissions} {state.totalSubmissions === 1 ? 'risposta' : 'risposte'}
          </div>
        </div>

        {/* Domanda */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>DOMANDA CORRENTE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
            {state.question || 'Caricamento domanda...'}
          </h2>
        </div>

        {/* Form Invio Parola */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="word-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
            >
              La tua parola o concetto:
            </label>
            <div className="relative">
              <input
                id="word-input"
                type="text"
                disabled={!state.isOpen || isSubmitting}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={30}
                placeholder={state.isOpen ? 'Es. ENERGIA, FUTURO...' : 'Invio temporaneamente bloccato'}
                autoComplete="off"
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-950/80 border text-white font-medium text-lg placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                  state.isOpen
                    ? 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/20'
                    : 'border-rose-900/40 bg-slate-950/40 text-slate-500 cursor-not-allowed'
                }`}
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono">
                {word.length}/30
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!state.isOpen || !word.trim() || isSubmitting}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              !state.isOpen
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : !word.trim() || isSubmitting
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Invio in corso...
              </span>
            ) : !state.isOpen ? (
              <>
                <Lock className="w-5 h-5 text-slate-500" />
                Risposte bloccate
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Invia al Word Cloud
              </>
            )}
          </button>
        </form>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Storico parole inviate in questa sessione */}
        {myHistory.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2.5">
              <History className="w-3.5 h-3.5" />
              <span>Hai inviato:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {myHistory.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link verso lo Schermo Live */}
        {onSwitchToDisplay && (
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
            <button
              onClick={onSwitchToDisplay}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Guarda il risultato in tempo reale sul Word Cloud
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
