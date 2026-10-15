import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Maximize2,
  Minimize2,
  QrCode,
  RotateCw,
  Download,
  Users,
  BarChart3,
  Hash,
  X,
  Share2,
  Copy,
  Check,
  Palette,
} from 'lucide-react';
import { WordCloudCanvas } from './WordCloudCanvas';
import { PublicState } from '../types';
import { CONTRAST_PALETTE_10 } from '../palette';

interface DisplayViewProps {
  state: PublicState;
  onSwitchToParticipant?: () => void;
  onSwitchToAdmin?: () => void;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  state,
  onSwitchToParticipant,
  onSwitchToAdmin,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotateWords, setRotateWords] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; count: number } | null>(null);

  // URL per i partecipanti
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=participant`
    : '';

  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Errore generazione QR:', err));
    }
  }, [joinUrl]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen non supportato o bloccato:', err);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const copyToClipboard = () => {
    if (navigator.clipboard && joinUrl) {
      navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadCloud = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Crea un nuovo canvas con sfondo scuro elegante e intestazione
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height + 140;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Sfondo gradiente scuro
    const grad = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Titolo della domanda
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.question, exportCanvas.width / 2, 70);

    // Disegna il cloud
    ctx.drawImage(canvas, 0, 110);

    // Salva file
    const link = document.createElement('a');
    link.download = `wordcloud-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto px-3 sm:px-6 py-3">
      {/* Intestazione Domanda e Badge */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex-shrink-0">
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1.5">
            <span className="flex h-3 w-3 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  state.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  state.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span
              className={`text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                state.isOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {state.isOpen ? '● Risposte Aperte' : '■ Risposte Bloccate'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 tracking-tight leading-snug">
            {state.question || 'Word Cloud Live'}
          </h1>
        </div>

        {/* Indicatori Statistiche in Tempo Reale */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Risposte</p>
              <p className="text-base font-extrabold text-white leading-tight">{state.totalSubmissions}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Hash className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Parole Uniche</p>
              <p className="text-base font-extrabold text-white leading-tight">{state.uniqueWords}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Users className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Connessi</p>
              <p className="text-base font-extrabold text-white leading-tight">{state.activeParticipants}</p>
            </div>
          </div>

          {/* Bottone QR Code per Audience */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Partecipa (QR)</span>
          </button>
        </div>
      </header>

      {/* Area Word Cloud Canvas (Anti-Sovrapposizione + 10 Colori a Contrasto) */}
      <main className="flex-1 min-h-0 w-full my-3 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-3 sm:p-5 relative overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-center items-center">
        {/* Glow ambientale */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <WordCloudCanvas
          words={state.words}
          rotateWords={rotateWords}
          onWordClick={(word, count) => setSelectedWord({ word, count })}
          className="z-10 w-full h-full flex-1"
        />
      </main>

      {/* Barra Inferiore: Palette a 10 Colori & Controlli Proiezione */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 px-4 backdrop-blur-xl flex-shrink-0">
        {/* Mostra i 10 colori a contrasto */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mr-1 flex-shrink-0">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>10 Colori Contrasto:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {CONTRAST_PALETTE_10.map((c) => (
              <span
                key={c.hex}
                title={`${c.name} (${c.hex})`}
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-125 cursor-help"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Azioni Toolbar */}
        <div className="flex items-center gap-2">
          {/* Rotazione parole on/off */}
          <button
            onClick={() => setRotateWords(!rotateWords)}
            title={rotateWords ? 'Disattiva orientamento verticale' : 'Attiva orientamento dinamico'}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              rotateWords
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{rotateWords ? 'Dinamico 25%' : 'Orizzontale'}</span>
          </button>

          {/* Salva immagine PNG */}
          <button
            onClick={handleDownloadCloud}
            title="Scarica immagine WordCloud in alta definizione"
            className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Esporta PNG</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Esci da schermo intero' : 'Attiva schermo intero per proiettore'}
            className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Riduci' : 'Schermo Intero'}</span>
          </button>
        </div>
      </footer>

      {/* Modal QR Code per il pubblico */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Inquadra per partecipare</h3>
            <p className="text-xs text-slate-400 mb-5">
              Scansiona il codice con lo smartphone per inviare la tua risposta in tempo reale!
            </p>

            {qrCodeDataUrl ? (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-5">
                <img src={qrCodeDataUrl} alt="QR Code per inviare risposta" className="w-56 h-56 mx-auto block" />
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-800 rounded-2xl animate-pulse mx-auto mb-5" />
            )}

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-left">
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate px-2"
              />
              <button
                onClick={copyToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ispezione parola cliccata */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center relative shadow-2xl">
            <button
              onClick={() => setSelectedWord(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-2">Dettaglio Parola</p>
            <h3 className="text-3xl font-extrabold text-white tracking-wide mb-2">{selectedWord.word}</h3>
            <p className="text-sm text-slate-300">
              Ricevuta <span className="font-bold text-white">{selectedWord.count}</span> volte
              {state.totalSubmissions > 0 && (
                <span className="text-cyan-400 ml-1">
                  ({Math.round((selectedWord.count / state.totalSubmissions) * 100)}% del totale)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
