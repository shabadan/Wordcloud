import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

export interface AppState {
  adminPassword: string;
  question: string;
  isOpen: boolean;
  words: Record<string, number>;
  submissionsHistory: Array<{
    id: string;
    word: string;
    timestamp: number;
  }>;
}

const defaultState: AppState = {
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
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
  submissionsHistory: [],
};

// Carica o inizializza data.json
let appState: AppState = { ...defaultState };

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      appState = {
        ...defaultState,
        ...parsed,
        words: parsed.words || {},
        submissionsHistory: parsed.submissionsHistory || [],
      };
      // Garantisci che ci sia sempre una password valida
      if (!appState.adminPassword) {
        appState.adminPassword = process.env.ADMIN_PASSWORD || 'admin';
      }
    } catch (err) {
      console.error('Errore nel caricamento di data.json:', err);
    }
  } else {
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Errore nel salvataggio di data.json:', err);
  }
}

loadData();

// Helper per ottenere lo stato pubblico sicuro (senza password)
function getPublicState(activeParticipants: number = 0) {
  const totalSubmissions = Object.values(appState.words).reduce((a, b) => a + b, 0);
  const uniqueWords = Object.keys(appState.words).length;
  return {
    question: appState.question,
    isOpen: appState.isOpen,
    words: appState.words,
    totalSubmissions,
    uniqueWords,
    activeParticipants,
    recentSubmissions: (appState.submissionsHistory || []).slice(-15).reverse(),
  };
}

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.json());

// Session token semplice per admin
const ADMIN_SESSION_SECRET = 'wordcloud_admin_active_session_' + Date.now();

// API per verificare lo stato pubblico
app.get('/api/state', (_req, res) => {
  res.json(getPublicState(io.engine.clientsCount));
});

// API Login Admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password richiesta' });
  }

  if (password === appState.adminPassword) {
    return res.json({
      success: true,
      token: ADMIN_SESSION_SECRET,
      message: 'Accesso eseguito con successo',
    });
  }

  return res.status(401).json({ success: false, message: 'Password errata' });
});

// API Modifica Password Admin
app.post('/api/admin/change-password', (req, res) => {
  const { token, currentPassword, newPassword } = req.body;
  if (token !== ADMIN_SESSION_SECRET && currentPassword !== appState.adminPassword) {
    return res.status(403).json({ success: false, message: 'Non autorizzato' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'La nuova password deve contenere almeno 3 caratteri',
    });
  }

  appState.adminPassword = newPassword.trim();
  saveData();

  return res.json({
    success: true,
    message: 'Password di amministrazione aggiornata e salvata con successo!',
  });
});

// API per invio parola da HTTP fallback
app.post('/api/submit', (req, res) => {
  if (!appState.isOpen) {
    return res.status(403).json({
      success: false,
      message: 'Le risposte sono attualmente bloccate dal moderatore',
    });
  }

  const rawWord = req.body?.word;
  const word = String(rawWord || '')
    .trim()
    .toUpperCase();

  if (!word || word.length > 30) {
    return res.status(400).json({
      success: false,
      message: 'La parola deve avere tra 1 e 30 caratteri',
    });
  }

  appState.words[word] = (appState.words[word] || 0) + 1;
  appState.submissionsHistory.push({
    id: Math.random().toString(36).substring(2, 9),
    word,
    timestamp: Date.now(),
  });
  if (appState.submissionsHistory.length > 200) {
    appState.submissionsHistory = appState.submissionsHistory.slice(-100);
  }

  saveData();
  io.emit('stateUpdate', getPublicState(io.engine.clientsCount));
  io.emit('newWordSubmitted', { word, count: appState.words[word] });

  return res.json({
    success: true,
    word,
    count: appState.words[word],
    state: getPublicState(io.engine.clientsCount),
  });
});

// Socket.io Real-Time
io.on('connection', (socket) => {
  const broadcastState = () => {
    io.emit('stateUpdate', getPublicState(io.engine.clientsCount));
  };

  // Invia stato immediato
  socket.emit('stateUpdate', getPublicState(io.engine.clientsCount));
  // Notifica partecipanti attivi
  broadcastState();

  socket.on('disconnect', () => {
    broadcastState();
  });

  // Ricezione parola utente
  socket.on('submitWord', (rawWord: string, callback?: (resp: any) => void) => {
    if (!appState.isOpen) {
      if (callback) callback({ success: false, message: 'Le risposte sono bloccate' });
      return;
    }

    const word = String(rawWord || '')
      .trim()
      .toUpperCase();

    if (!word || word.length > 30) {
      if (callback) callback({ success: false, message: 'Parola non valida' });
      return;
    }

    appState.words[word] = (appState.words[word] || 0) + 1;
    appState.submissionsHistory.push({
      id: Math.random().toString(36).substring(2, 9),
      word,
      timestamp: Date.now(),
    });
    if (appState.submissionsHistory.length > 200) {
      appState.submissionsHistory = appState.submissionsHistory.slice(-100);
    }

    saveData();
    broadcastState();
    io.emit('newWordSubmitted', { word, count: appState.words[word] });

    if (callback) {
      callback({ success: true, word, count: appState.words[word] });
    }
  });

  // Azioni Admin
  socket.on('adminAction', (data: { token: string; action: string; payload?: any }, callback?: (resp: any) => void) => {
    const { token, action, payload } = data;
    if (token !== ADMIN_SESSION_SECRET) {
      if (callback) callback({ success: false, message: 'Sessione non valida' });
      return;
    }

    let modified = true;

    switch (action) {
      case 'setQuestion':
        if (typeof payload === 'string' && payload.trim()) {
          appState.question = payload.trim();
        }
        break;

      case 'toggleStatus':
        appState.isOpen = !appState.isOpen;
        break;

      case 'setStatus':
        appState.isOpen = Boolean(payload);
        break;

      case 'resetCloud':
        appState.words = {};
        appState.submissionsHistory = [];
        break;

      case 'deleteWord':
        if (typeof payload === 'string' && appState.words[payload]) {
          delete appState.words[payload];
          appState.submissionsHistory = appState.submissionsHistory.filter((item) => item.word !== payload);
        }
        break;

      case 'changePassword':
        if (typeof payload === 'string' && payload.trim().length >= 3) {
          appState.adminPassword = payload.trim();
        } else {
          modified = false;
          if (callback) callback({ success: false, message: 'Password troppo corta' });
          return;
        }
        break;

      case 'seedSample':
        appState.words = {
          'COLLABORAZIONE': 8,
          'INNOVAZIONE': 7,
          'CREATIVITÀ': 6,
          'PASSIONE': 5,
          'FUTURO': 5,
          'DINAMISMO': 4,
          'CONOSCENZA': 4,
          'ENTUSIASMO': 3,
          'TRASFORMAZIONE': 3,
          'QUALITÀ': 2,
        };
        break;

      default:
        modified = false;
        break;
    }

    if (modified) {
      saveData();
      broadcastState();
      if (callback) callback({ success: true, state: getPublicState(io.engine.clientsCount) });
    }
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WordCloud server avviato su http://0.0.0.0:${PORT}`);
  });
}

startServer();
