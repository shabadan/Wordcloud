import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { ParticipantView } from './components/ParticipantView';
import { DisplayView } from './components/DisplayView';
import { AdminView } from './components/AdminView';
import { PublicState, ViewMode } from './types';

const defaultPublicState: PublicState = {
  question: 'Quale parola descrive meglio questa esperienza?',
  isOpen: true,
  words: {
    'ENTUSIASMANTE': 9,
    'INNOVATIVO': 7,
    'COINVOLGENTE': 6,
    'FUTURO': 5,
    'CREATIVITÀ': 5,
    'ISPIRAZIONE': 4,
    'VELOCE': 4,
    'ENERGIA': 3,
    'COLLABORAZIONE': 3,
    'BRILLANTE': 2,
    'CONCRETO': 2,
    'FLESSIBILE': 2,
  },
  totalSubmissions: 42,
  uniqueWords: 12,
  activeParticipants: 1,
  recentSubmissions: [],
};

export default function App() {
  const [state, setState] = useState<PublicState>(defaultPublicState);
  const [mode, setMode] = useState<ViewMode>('display');
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('wordcloud_admin_token') : null;
  });

  const socketRef = useRef<Socket | null>(null);

  // Inizializza la modalità in base all'URL (?mode=admin | display | participant) o pathname
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') as ViewMode | null;
    const path = window.location.pathname.toLowerCase();

    if (modeParam && ['participant', 'display', 'admin'].includes(modeParam)) {
      setMode(modeParam);
    } else if (path.includes('admin')) {
      setMode('admin');
    } else if (path.includes('view') || path.includes('display')) {
      setMode('display');
    } else if (path.includes('vote') || path.includes('participant')) {
      setMode('participant');
    }
  }, []);

  const changeMode = (newMode: ViewMode) => {
    setMode(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.replaceState({}, '', url.toString());
  };

  // Connessione Socket.IO e fetch iniziale
  useEffect(() => {
    // Caricamento iniziale via REST
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setState(data);
      })
      .catch((err) => console.log('Fetch iniziale API:', err));

    // Connessione WebSocket real-time
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connesso con id:', socket.id);
    });

    socket.on('stateUpdate', (updatedState: PublicState) => {
      setState(updatedState);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Azione invio parola (da utente/partecipante)
  const handleSubmitWord = async (word: string): Promise<{ success: boolean; message?: string }> => {
    const socket = socketRef.current;

    // Se il socket è connesso, invia via socket con acknowledgement
    if (socket && socket.connected) {
      return new Promise((resolve) => {
        socket.emit('submitWord', word, (res: any) => {
          if (res) {
            resolve(res);
          } else {
            resolve({ success: true });
          }
        });
      });
    }

    // Fallback REST HTTP
    try {
      const resp = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.state) setState(data.state);
        return { success: true };
      }
      return { success: false, message: data.message || "Impossibile inviare la parola" };
    } catch {
      return { success: false, message: 'Errore di connessione al server' };
    }
  };

  // Azione login admin
  const handleAdminLogin = async (password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        sessionStorage.setItem('wordcloud_admin_token', data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Password non valida' };
    } catch {
      return { success: false, message: 'Errore di rete durante il login' };
    }
  };

  const handleAdminLogout = () => {
    setAuthToken(null);
    sessionStorage.removeItem('wordcloud_admin_token');
  };

  // Azione generica Admin
  const handleAdminAction = async (action: string, payload?: any): Promise<{ success: boolean; message?: string }> => {
    if (!authToken) return { success: false, message: 'Non autenticato' };

    const socket = socketRef.current;
    if (socket && socket.connected) {
      return new Promise((resolve) => {
        socket.emit('adminAction', { token: authToken, action, payload }, (res: any) => {
          resolve(res || { success: true });
        });
      });
    }

    // Se il socket non è disponibile, usa l'azione o ricarica lo stato
    return { success: false, message: 'Connessione server persa' };
  };

  // Azione cambio password admin (risposta diretta al prompt dell'utente)
  const handleChangePassword = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: authToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Errore cambio password' };
    } catch {
      return { success: false, message: 'Errore di rete durante il salvataggio' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar currentMode={mode} onSelectMode={changeMode} state={state} />

      <main className="flex-1 flex flex-col">
        {mode === 'participant' && (
          <ParticipantView
            state={state}
            onSubmitWord={handleSubmitWord}
            onSwitchToDisplay={() => changeMode('display')}
          />
        )}

        {mode === 'display' && (
          <DisplayView
            state={state}
            onSwitchToParticipant={() => changeMode('participant')}
            onSwitchToAdmin={() => changeMode('admin')}
          />
        )}

        {mode === 'admin' && (
          <AdminView
            state={state}
            authToken={authToken}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onAdminAction={handleAdminAction}
            onChangePassword={handleChangePassword}
          />
        )}
      </main>
    </div>
  );
}
