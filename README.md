# App allenamento

PWA mobile-first per creare schede con l’aiuto di un assistente AI, svolgere gli allenamenti anche offline e sincronizzare risultati e progressi su Supabase.

La versione pubblica è disponibile su **[fmari99.github.io/app-allenamento](https://fmari99.github.io/app-allenamento/)**. Senza un account puoi scegliere **Apri la demo locale**: i dati dimostrativi restano nel browser e non vengono inviati online.

> Il progetto fornisce strumenti organizzativi e suggerimenti modificabili. Non sostituisce indicazioni mediche o professionali.

## Cosa offre

- schede con più allenamenti e riscaldamenti riutilizzabili;
- esecuzione guidata, timer di lavoro/preparazione/recupero e conteggio locale delle serie;
- funzionamento local-first con IndexedDB e PWA installabile;
- ripresa delle sessioni, storico, calendario e grafici dei progressi;
- sincronizzazione manuale e automatica dei gruppi conclusi;
- gestione dei conflitti senza scartare silenziosamente la copia locale;
- catalogo condiviso di esercizi, attrezzatura e video;
- generazione, validazione e caricamento ripetibile delle schede in JSON;
- isolamento dei dati per proprietario tramite autenticazione e Row Level Security.

La versione applicativa corrente è **0.6.1**. Lo stato dettagliato delle verifiche e le decisioni di prodotto sono nel [piano della prima versione](project_knowledge/piano_prima_versione.md).

## Architettura

| Parte | Tecnologia | Ruolo |
| --- | --- | --- |
| Interfaccia | Vue 3 + Vite | PWA statica ottimizzata per smartphone |
| Archivio locale | IndexedDB | dati, posizione UI e coda offline |
| Backend | Supabase/PostgreSQL | autenticazione, dati sincronizzati, RPC atomiche e RLS |
| Schede | JSON Schema + Python | validazione, riuso del catalogo e upload |
| Hosting | GitHub Pages | distribuzione HTTPS della build statica |

Il frontend non contiene chiavi amministrative. Usa esclusivamente URL e chiave **Publishable** di Supabase; l’accesso alle righe è regolato dal login dell’utente e dalle policy RLS.

## Avvio rapido della demo in locale

### Requisiti

- Node.js **22.12 o successivo**;
- npm;
- Python **3.11 o successivo** per CLI e test Python;
- Git.

Clona e installa:

```bash
git clone https://github.com/FMari99/app-allenamento.git
cd app-allenamento
npm ci
python3 -m venv .venv
.venv/bin/pip install -r tools/workouts/requirements.txt
```

Avvia il server di sviluppo:

```bash
npm run dev
```

Apri l’indirizzo mostrato da Vite e scegli **Apri la demo locale**. Senza `.env.local` comparirà un avviso relativo a Supabase, ma la demo resta utilizzabile e separata da qualsiasi account reale.

Per provare la PWA generata:

```bash
npm run build
npm run preview
```

Il service worker viene generato solo nella build, non durante `npm run dev`.

## Configurare un’istanza personale completa

Ogni installazione deve usare un proprio progetto Supabase. Il progetto ospitato dall’autore non accetta registrazioni pubbliche e non va riutilizzato da un fork.

### 1. Crea il progetto Supabase

1. Crea un progetto vuoto dal dashboard Supabase.
2. Apri **SQL Editor** nel nuovo progetto.
3. Copia ed esegui l’intero file [`supabase/setup/01_installazione.sql`](supabase/setup/01_installazione.sql).
4. Verifica che la query finale restituisca `Configurazione completata`.
5. Esegui [`supabase/setup/02_verifica.sql`](supabase/setup/02_verifica.sql) e controlla che non segnali oggetti mancanti o RLS disattivata.

Il setup rifiuta uno schema `public` già popolato e non cancella dati per adattarsi a un progetto esistente. Le migrazioni sorgente sono in [`supabase/migrations/`](supabase/migrations/).

### 2. Crea l’utente dell’app

Nel dashboard vai in **Authentication → Users** e crea un utente con email e password. L’app non espone una schermata di registrazione.

Per un’istanza personale è consigliato disattivare le nuove registrazioni pubbliche nelle impostazioni Auth dopo aver creato gli utenti desiderati. Se condividi l’istanza con più persone, ogni persona deve avere un account distinto: le policy RLS separano i dati per `user_id`.

### 3. Configura il frontend

Copia il modello e inserisci i valori del tuo progetto:

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL=https://ID_PROGETTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

URL e chiave Publishable finiscono necessariamente nel browser e non sono segreti. Non usare mai una chiave Secret o `service_role`: bypasserebbe RLS. `.env.local` è escluso da Git.

Avvia quindi l’app, accedi con l’utente creato e usa **Menu → Area personale → Scarica le tue schede**.

## Creare e caricare una scheda

La CLI usa lo stesso account personale dell’app e non richiede chiavi amministrative.

Configura il progetto e accedi:

```bash
python3 -m tools.workouts.cli configure
python3 -m tools.workouts.cli login
python3 -m tools.workouts.cli check
```

`configure` richiede URL e chiave Publishable. `login` legge la password in modo nascosto e conserva la sessione in `private/session.json`; non passare password o token come argomenti della shell.

Esporta catalogo, attrezzatura e storico già sincronizzati:

```bash
python3 -m tools.workouts.cli export --output private/contesto.json
```

Prepara una scheda conforme al contratto v3, partendo da [`examples/scheda-riscaldamenti-demo.json`](examples/scheda-riscaldamenti-demo.json) e da [`schemas/scheda-v3.schema.json`](schemas/scheda-v3.schema.json), poi validala:

```bash
python3 -m tools.workouts.cli prepare private/scheda.json --catalogo private/contesto.json
```

Caricala:

```bash
python3 -m tools.workouts.cli upload private/scheda.json
```

Un reinvio dello stesso file e degli stessi identificativi è idempotente. Se una risposta si perde, non cambiare il JSON e non eliminare `private/invii/`: ripeti lo stesso comando. Dopo l’upload, nell’app premi **Sincronizza**.

Per usare un assistente AI con le regole complete del progetto, consulta [`skills/crea-scheda-allenamento/SKILL.md`](skills/crea-scheda-allenamento/SKILL.md). L’assistente deve raccogliere obiettivi, esperienza, frequenza, tempo, attrezzatura e vincoli prima di generare una scheda personale.

## Uso dell’app

1. Accedi e apri **Area personale → Scarica le tue schede**.
2. Dalla Home seleziona la scheda e l’allenamento, quindi premi **Inizia**.
3. Conferma o salta ogni esercizio. I valori precompilati diventano risultati soltanto dopo conferma.
4. Al termine, la sessione conclusa viene accodata per l’invio automatico; le modifiche al piano restano manuali fino a **Sincronizza**.
5. Consulta **Calendario**, **Progressi** e **Attrezzatura** dal menu.

L’app salva subito sul dispositivo. Non cancellare i dati del sito o reinstallare la PWA mentre esistono gruppi in attesa: prima usa **Area personale → Esporta copia locale e modifiche in attesa** e prova a sincronizzare.

### Offline e sincronizzazione

- dopo il primo caricamento completo, interfaccia e archivio locale possono essere riaperti offline;
- una sessione conclusa viene ritentata con l’app attiva quando torna la rete;
- modifiche al piano, video, correzioni e sessioni incomplete richiedono sincronizzazione manuale;
- un conflitto conserva entrambe le versioni e chiede quale usare;
- il browser può eliminare IndexedDB se l’utente cancella i dati del sito.

## Test e controlli

Esegui i controlli ordinari con:

```bash
npm test
npm run build
python3 tools/publish_pages.py
```

`npm test` esegue test JavaScript e Python. La build deve produrre `app/dist/`; `publish_pages.py` verifica la lista chiusa degli artefatti e controlla che eventuali token personali locali non siano inclusi.

I test SQL richiedono PostgreSQL locale e usano un ambiente temporaneo:

```bash
npm run test:sql
```

Leggi lo script prima di eseguirlo se il tuo ambiente PostgreSQL è personalizzato. Per un flusso Supabase CLI completo puoi usare le migrazioni versionate; verifica sempre i comandi disponibili con `supabase --help`, perché la CLI cambia nel tempo.

## Pubblicazione su GitHub Pages

La branch `main` contiene i sorgenti; la branch `gh-pages` contiene soltanto gli artefatti statici. Dopo aver installato e autenticato [GitHub CLI](https://cli.github.com/):

```bash
npm test
npm run build
python3 tools/publish_pages.py
python3 tools/publish_pages.py --publish
```

Lo script rileva il repository da `origin`, verifica una lista chiusa di file, controlla che i token della sessione locale non siano nella build, crea un commit su `gh-pages` e configura Pages per pubblicare quella branch. In un checkout senza remote riconoscibile usa `--repository proprietario/nome`.

La build incorpora URL e chiave Publishable presenti in `.env.local`; è previsto per un frontend pubblico. Non deve mai contenere una chiave Secret o `service_role`.

## Struttura del repository

```text
app/                 interfaccia Vue, dominio, IndexedDB e sincronizzazione
examples/            schede JSON dimostrative
project_knowledge/   visione, specifiche funzionali e piano di sviluppo
schemas/             contratti JSON v1, v2 e v3
skills/              procedura per creare schede con un assistente AI
supabase/            migrazioni, setup consolidato e test SQL
tests/               test JavaScript e Python
tools/               CLI schede, build PWA, test e pubblicazione
```

Non sono pubblicati:

- `.env`, `.env.local` e altri file ambiente;
- `private/`, che contiene sessioni, esportazioni, schede personali e diario degli invii;
- `work/`, `node_modules/`, `app/dist/` e file temporanei Supabase;
- dati reali conservati in IndexedDB o nel database Supabase.

Prima di ogni commit controlla almeno `git status --short` e verifica di non aver spostato dati personali fuori da `private/`.

## Documentazione di progetto

- [Visione e obiettivi](project_knowledge/idea_generale_e_obiettivi.md)
- [Indice delle 22 specifiche](project_knowledge/specifica_funzionalita_app.md)
- [Piano, stato e verifiche](project_knowledge/piano_prima_versione.md)
- [Regole per gli assistenti](AGENTS.md)

## Limiti attuali

- l’editor strutturale completo delle schede è una CLI, non una schermata dell’app;
- la PWA è progettata e collaudata principalmente per Chrome su Android;
- audio e timer non sono garantiti con browser sospeso o schermo bloccato;
- i test automatici non sostituiscono il collaudo su un telefono reale;
- non è ancora stata scelta una licenza open source: il codice è visibile pubblicamente, ma il riuso e la redistribuzione richiedono l’autorizzazione del titolare finché non viene aggiunta una licenza.

Issue e pull request sono benvenute per bug riproducibili, miglioramenti documentali e modifiche coerenti con le specifiche esistenti.
