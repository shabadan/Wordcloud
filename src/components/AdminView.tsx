import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Save,
  Trash2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sliders,
  Search,
} from 'lucide-react';
import { PublicState } from '../types';
import { getWordColor } from '../palette';

interface AdminViewProps {
  state: PublicState;
  authToken: string | null;
  onLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
  onLogout: () => void;
  onAdminAction: (action: string, payload?: any) => Promise<{ success: boolean; message?: string }>;
  onChangePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  state,
  authToken,
  onLogin,
  onLogout,
  onAdminAction,
  onChangePassword,
}) => {
  // Login State
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Question State
  const [questionText, setQuestionText] = useState(state.question);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionSavedMsg, setQuestionSavedMsg] = useState(false);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Word Moderation
  const [wordFilter, setWordFilter] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showPwdGuide, setShowPwdGuide] = useState(false);

  // Sincronizza input domanda con lo stato se non in fase di digitazione attiva
  React.useEffect(() => {
    setQuestionText(state.question);
  }, [state.question]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setIsLoggingIn(true);
    setLoginError(null);

    const res = await onLogin(passwordInput);
    if (!res.success) {
      setLoginError(res.message || 'Password errata. Riprova (password predefinita: admin)');
    } else {
      setPasswordInput('');
    }
    setIsLoggingIn(false);
  };

  const handleSaveQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionText.trim()) return;

    setIsSavingQuestion(true);
    await onAdminAction('setQuestion', questionText.trim());
    setIsSavingQuestion(false);
    setQuestionSavedMsg(true);
    setTimeout(() => setQuestionSavedMsg(false), 2500);
  };

  const handleToggleStatus = async () => {
    await onAdminAction('toggleStatus');
  };

  const handleResetCloud = async () => {
    await onAdminAction('resetCloud');
    setConfirmResetOpen(false);
  };

  const handleSeedDemo = async () => {
    await onAdminAction('seedSample');
  };

  const handleDeleteWord = async (wordToDelete: string) => {
    await onAdminAction('deleteWord', wordToDelete);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'La nuova password deve contenere almeno 3 caratteri.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'Le due password non coincidono.',
      });
      return;
    }

    setIsChangingPwd(true);
    setPasswordChangeMsg(null);

    const res = await onChangePassword(newPassword);
    if (res.success) {
      setPasswordChangeMsg({
        type: 'success',
        text: 'Password aggiornata e salvata con successo in data.json!',
      });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeMsg(null), 4000);
    } else {
      setPasswordChangeMsg({
        type: 'error',
        text: res.message || 'Errore durante il cambio password.',
      });
    }
    setIsChangingPwd(false);
  };

  const questionPresets = [
    'Quale parola descrive meglio questa esperienza?',
    'Un punto di forza del nostro team?',
    'Quale valore guida il tuo lavoro quotidiano?',
    'Cosa ti aspetti da questo evento o corso?',
    'Un termine che definisce il nostro futuro?',
  ];

  const wordEntries = Object.entries(state.words).sort((a, b) => b[1] - a[1]);
  const filteredWords = wordEntries.filter(([w]) =>
    w.toLowerCase().includes(wordFilter.toLowerCase())
  );

  // SCHERMATA LOGIN SE NON AUTENTICATO
  if (!authToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2">Accesso Amministratore</h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            Pannello di controllo per impostare la domanda, attivare o bloccare le risposte e moderare il cloud.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password Admin:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password (predefinita: admin)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all pr-11"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Password iniziale standard: <strong className="text-cyan-300 font-mono">admin</strong>
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !passwordInput}
              className="w-full py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Accedi al Pannello
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PANNELLO DI CONTROLLO ADMIN COMPLETO
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Intestazione Pannello */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Pannello Amministrazione</h1>
            <p className="text-xs text-slate-400">
              Controllo completo della sessione, ricezione risposte e gestione password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowPwdGuide(!showPwdGuide)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Come cambiare password</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Box Guida Informativa su come cambiare la password (risposta diretta alla domanda dell'utente) */}
      {showPwdGuide && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 relative animate-in fade-in">
          <button
            onClick={() => setShowPwdGuide(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-3">
            <FileCode className="w-5 h-5" />
            <h3 className="text-base text-white">Come cambiare la password di admin (3 modalità)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">1. Dall'Interfaccia (Consigliato)</span>
              <p className="text-slate-400 mb-2">
                Usa direttamente il modulo <strong>"Modifica Password Admin"</strong> qui sotto. La nuova password viene salvata istantaneamente nel file <code className="text-cyan-400">data.json</code> senza riavviare il server.
              </p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">2. Nel file data.json</span>
              <p className="text-slate-400 mb-2">
                Modifica la voce <code className="text-cyan-400 font-mono">"adminPassword": "..."</code> direttamente nel file <code className="text-cyan-400">data.json</code> alla radice del progetto.
              </p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">3. Variabile d'Ambiente</span>
              <p className="text-slate-400 mb-2">
                Imposta la variabile <code className="text-cyan-400 font-mono">ADMIN_PASSWORD="TuaPassword"</code> all'avvio del server per sovrascrivere il valore predefinito.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Griglia Controlli Principali */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna Sinistra / 2 Colonne: Interruttore e Domanda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Interruttore Risposte Utenti */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {state.isOpen ? (
                    <Unlock className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-rose-400" />
                  )}
                  <span>Stato Ricezione Risposte</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {state.isOpen
                    ? 'I partecipanti possono attualmente inviare parole dal loro schermo.'
                    : 'Le risposte sono bloccate. I partecipanti vedono il messaggio di attesa.'}
                </p>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                  state.isOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {state.isOpen ? '● Attivo (Aperto)' : '■ Bloccato'}
              </div>
            </div>

            {/* Grande Tasto Attiva / Blocca */}
            <button
              onClick={handleToggleStatus}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl tracking-wide shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] ${
                state.isOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {state.isOpen ? (
                <>
                  <Lock className="w-6 h-6" />
                  <span>BLOCCA RISPOSTE</span>
                </>
              ) : (
                <>
                  <Unlock className="w-6 h-6" />
                  <span>ATTIVA RISPOSTE</span>
                </>
              )}
            </button>
          </div>

          {/* Card Modifica Domanda */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Modifica Domanda o Tema</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Questa domanda comparirà all'istante sullo schermo di proiezione e sui telefoni degli utenti.
            </p>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Inserisci la domanda da mostrare ai partecipanti..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-semibold text-base focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all pr-28"
                />
                <button
                  type="submit"
                  disabled={isSavingQuestion || !questionText.trim()}
                  className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingQuestion ? 'Salvataggio...' : 'Salva'}</span>
                </button>
              </div>

              {questionSavedMsg && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Domanda aggiornata e trasmessa a tutti i client in tempo reale!</span>
                </div>
              )}
            </form>

            {/* Suggerimenti veloci */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Suggerimenti rapidi:
              </p>
              <div className="flex flex-wrap gap-2">
                {questionPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestionText(preset);
                      onAdminAction('setQuestion', preset);
                    }}
                    className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Moderazione e Lista Parole */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Parole Raccolte ({wordEntries.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {state.totalSubmissions} occorrenze totali. Puoi eliminare singole parole indesiderate.
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filtra parole..."
                  value={wordFilter}
                  onChange={(e) => setWordFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {filteredWords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Nessuna parola trovata.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredWords.map(([w, count]) => {
                  const color = getWordColor(w);
                  return (
                    <div
                      key={w}
                      className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-extrabold text-white text-sm tracking-wide">{w}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-xs">
                          {count} {count === 1 ? 'voto' : 'voti'}
                        </span>
                        <button
                          onClick={() => handleDeleteWord(w)}
                          title="Elimina questa parola dal cloud"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonna Destra: Cambio Password & Azioni Rapide */}
        <div className="space-y-6">
          {/* CARD MODIFICA PASSWORD ADMIN (Risposta esatta alla domanda dell'utente) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Modifica Password Admin</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Aggiorna la password di accesso. La modifica viene memorizzata automaticamente su <code className="text-cyan-400">data.json</code>.
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nuova Password:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Almeno 3 caratteri"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Conferma Password:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la nuova password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              {passwordChangeMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    passwordChangeMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {passwordChangeMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{passwordChangeMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPwd || !newPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isChangingPwd ? 'Aggiornamento...' : 'Aggiorna Password Admin'}</span>
              </button>
            </form>
          </div>

          {/* Azioni Rapide Manutenzione */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white">Azioni Rapide Sessione</h2>

            <button
              onClick={handleSeedDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ricarica Parole di Esempio</span>
            </button>

            <button
              onClick={() => setConfirmResetOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Azzera Word Cloud (Reset Totale)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Conferma Reset */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Confermi il reset del Word Cloud?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Questa operazione cancellerà tutte le parole inviate finora. L'operazione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleResetCloud}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Sì, Cancella Tutto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
