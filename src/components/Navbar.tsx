import React, { useState } from 'react';
import {
  Cloud,
  Smartphone,
  Tv,
  Settings,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { ViewMode, PublicState } from '../types';

interface NavbarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  state: PublicState;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  state,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?mode=participant`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between">
      {/* Brand & Live Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
          <Cloud className="w-5 h-5" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">
              WordCloud <span className="text-cyan-400">Live</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                state.isOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {state.isOpen ? 'Attivo' : 'Bloccato'}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => onSelectMode('participant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentMode === 'participant'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Partecipa</span>
        </button>

        <button
          onClick={() => onSelectMode('display')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentMode === 'display'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Schermo Live</span>
        </button>

        <button
          onClick={() => onSelectMode('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentMode === 'admin'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>

      {/* Tasto rapido Copia Link Partecipante */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          title="Copia link per i partecipanti"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{copied ? 'Link Copiato!' : 'Copia Link'}</span>
        </button>
      </div>
    </nav>
  );
};
