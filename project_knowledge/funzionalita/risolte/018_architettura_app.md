# 018 — Stack e organizzazione modulare dell’app

- Stato: completata
- Priorità: P1
- Ultima revisione: 30/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Decisione approvata

Usare Vue 3 con Vite per l’interfaccia, Supabase/PostgreSQL per database e autenticazione, IndexedDB per dati locali e coda di sincronizzazione, Python per gli strumenti dell’AI. La precedente ipotesi di interfaccia in solo JavaScript senza framework è superata.

L’app rimane una PWA con pubblicazione statica. Modalità di accesso, destinazione di pubblicazione e confine delle operazioni dello script sono consolidate nelle specifiche 015–017: account personale, PWA Android/Chrome su GitHub Pages e creazione delle schede tramite AI/script.

## Responsabilità e moduli

- index.html è il contenitore iniziale; main.js avvia Vue. Non concentrare tutte le funzioni in un singolo file.
- Le viste Vue rappresentano le schermate; i componenti contengono elementi riutilizzabili.
- Le regole di dominio (categorie, conferma risultati, avanzamento, stato della sessione) stanno in moduli indipendenti da Vue e dal database.
- L’accesso a IndexedDB e quello a Supabase sono separati. La sincronizzazione coordina coda, transazioni e conflitti senza dipendere dalla schermata aperta.
- Lo stato condiviso tra viste ha un punto di gestione esplicito. Non duplicare nelle viste logiche di salvataggio o copie divergenti della sessione.
- Gli stili globali definiscono colori, spazi e tipografia; gli stili specifici possono stare nei componenti Vue.
- Python e SQL hanno cartelle proprie. La skill documenta i comandi reali dello script, evitando procedure manuali duplicate.

## Struttura iniziale indicativa

La struttura è stata avviata in F1 il 29/10/2026; consultare README e piano per i moduli effettivamente realizzati e quelli ancora da integrare:

```text
app/
  index.html
  src/
    main.js
    App.vue
    views/
    components/
    state/
    domain/
    data/
      local/
      remote/
    sync/
    styles/
  public/
supabase/
  migrations/
  tests/
tools/
  workouts/
schemas/
tests/
project_knowledge/
```

## Dettagli delegati all’assistente

JavaScript come base iniziale, componenti Vue in file .vue; scegliere durante l’avvio librerie leggere per routing, stato, IndexedDB, grafici e PWA dove semplificano davvero. Evitare sia file monolitici sia frammentazione in moduli senza responsabilità concreta. Non serve approvazione per ogni dipendenza ordinaria: spiegare soltanto scelte con impatto significativo.

Il numero di righe non è un vincolo rigido: separare per responsabilità, leggibilità e verificabilità. Un componente non deve parlare direttamente con Supabase se così duplica la logica dei dati.

## Questioni importanti aperte

Nessuna sullo stack approvato. Il framework non risolve automaticamente persistenza offline e conflitti: applicare le specifiche 012 e 013.

## Registro delle decisioni

- 29/10/2026: l’utente approva Vue 3 + Vite dopo il confronto sulla modularità e sulla gestione dello stato dell’interfaccia.

## Navigazione consolidata il 30/10/2026

Nella revisione 0.2.1 l’utente richiede meno spazio accessorio e meno necessità di scorrere: Home senza introduzione promozionale, barra inferiore a tre pulsanti (Home, Calendario al centro, Menu a destra), menu laterale destro per Area personale, Progressi e Attrezzatura. Un divisore separa la versione dalle voci. Account/demo, comandi di sincronizzazione/esportazione e informazioni di stato sono nell’Area personale; rimossi intestazione logo/stato e riepilogo tecnico globale. Errori restano visibili. Home conserva il selettore di scheda quando ne esistono più di una. Nessuna modifica alle regole di dati e sincronizzazione.

Il 30/10/2026, revisione 0.2.3, l’utente richiede Inizia centrato subito sotto il titolo dell’allenamento e Lista esercizi espandibile in fondo alla card, chiusa per default. La seconda scheda minima della demo serve soltanto al collaudo del selettore, senza dati cloud o sostituzione dell’archivio demo preesistente.
