# Live WordCloud Interactive

Applicazione web in tempo reale per la creazione e proiezione di Word Cloud interattivi, con supporto WebSockets, persistenza su file `data.json`, visualizzazione anti-sovrapposizione a 10 colori a contrasto e pannello admin.

---

## 🚀 Pubblicazione su Render (Piano Gratuito)

Questa applicazione è già predisposta per il deploy con un clic su **Render**.

### Metodo 1: Deploy Automatico tramite Blueprint (Consigliato)

1. Carica questo progetto su un repository GitHub o GitLab.
2. Accedi alla dashboard di [Render](https://dashboard.render.com/).
3. Clicca su **New +** in alto a destra e seleziona **Blueprint**.
4. Collega il tuo repository: Render rileverà automaticamente il file `render.yaml` già configurato.
5. Clicca su **Apply**: il servizio verrà compilato e pubblicato con HTTPS gratuito in circa 2 minuti!

---

### Metodo 2: Creazione Manuale come Web Service

Se preferisci configurarlo a mano dalla dashboard:

1. Su Render, clicca su **New +** → **Web Service**.
2. Collega il tuo repository Git.
3. Compila i seguenti campi:
   - **Name**: `live-wordcloud` (o il nome che preferisci)
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm install @rolldown/binding-linux-x64-gnu@1.2.14 --legacy-peer-deps --no-save && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
4. Nella sezione **Environment Variables**, aggiungi:
   - `NODE_ENV` = `production`
   - `ADMIN_PASSWORD` = `admin` (oppure la password che desideri)
5. Clicca su **Create Web Service**.

---

## ⚙️ Variabili d'Ambiente Disponibili

| Variabile | Descrizione | Default |
|---|---|---|
| `PORT` | Porta HTTP assegnata automaticamente da Render | `3000` |
| `NODE_ENV` | Modalità esecuzione (`production` o `development`) | `production` |
| `ADMIN_PASSWORD` | Password per accedere al pannello `/admin` | `admin` |

---

## 📁 Persistenza Dati

L'applicazione salva domande, risposte e configurazioni nel file locale `data.json`.
Sul piano gratuito di Render il filesystem è effimero (si azzera in caso di inattività prolungata o riavvio); per persistenza a lungo termine è possibile facoltativamente collegare un Persistent Disk dalla dashboard di Render o utilizzare un database esterno.
