# Indice e gestione delle specifiche funzionali

Questo file è l’indice aggiornato delle funzionalità. Sostituisce il documento unico iniziale: requisiti e note dell’utente sono stati consolidati nei singoli file collegati sotto.

## Stati e cartelle

Lo stato riguarda la **definizione della specifica**, non lo sviluppo dell’app.

- **Completata**: risolta e sufficientemente dettagliata per essere implementata; file in `funzionalita/risolte/`.
- **In discussione**: analizzata, ma con decisioni importanti ancora aperte; file in `funzionalita/in_discussione/`.
- **Da discutere**: ancora da analizzare; file in `funzionalita/in_discussione/`.

I dettagli secondari di presentazione e interazione vengono decisi dall’assistente e annotati nella specifica senza impedirne la chiusura. Alla revisione del 04/11/2026 risultano risolte le specifiche 001–022, inclusi riscaldamenti riutilizzabili e impostazioni di esecuzione. Nessuna in discussione.

## Priorità

- **P1 — Essenziale**: necessaria al ciclo principale di generazione, esecuzione e registrazione.
- **P2 — Consultazione e analisi**: utile per leggere lo storico e i progressi.
- **P3 — Accessoria**: miglioramento che può essere aggiunto dopo il flusso principale.

Le priorità sono una prima assegnazione dell’assistente, modificabile. Non rappresentano un ordine rigido: le dipendenze comuni vanno affrontate prima delle funzionalità che le utilizzano.

## Elenco delle funzionalità

| ID | Funzionalità | Stato | Priorità |
| --- | --- | --- | --- |
| 001 | [Calendario degli allenamenti](funzionalita/risolte/001_calendario.md) | completata | P2 |
| 002 | [Storico dei progressi per esercizio](funzionalita/risolte/002_storico_progressi.md) | completata | P2 |
| 003 | [Proposta automatica del prossimo allenamento](funzionalita/risolte/003_prossimo_allenamento.md) | completata | P1 |
| 004 | [Schermata dedicata al singolo esercizio](funzionalita/risolte/004_schermata_esercizio.md) | completata | P1 |
| 005 | [Durata e stato dell’allenamento](funzionalita/risolte/005_durata_sessione.md) | completata | P1 |
| 006 | [Video associati agli esercizi](funzionalita/risolte/006_video_esercizi.md) | completata | P3 |
| 007 | [Attrezzatura necessaria e utile per esercizio](funzionalita/risolte/007_attrezzatura_esercizi.md) | completata | P1 |
| 008 | [Profilo dell’attrezzatura disponibile](funzionalita/risolte/008_attrezzatura_disponibile.md) | completata | P1 |
| 009 | [Impostazione iniziale suggerita dall’AI](funzionalita/risolte/009_impostazione_ai.md) | completata | P1 |
| 010 | [Categorie di esercizio e dati obbligatori](funzionalita/risolte/010_categorie_esercizi.md) | completata | P1 |
| 011 | [Struttura SQL di schede, allenamenti e sessioni](funzionalita/risolte/011_struttura_schede_sessioni.md) | completata | P1 |
| 012 | [Dati sul telefono e nel database](funzionalita/risolte/012_persistenza_dati.md) | completata | P1 |
| 013 | [Sincronizzazione e gestione dei conflitti](funzionalita/risolte/013_sincronizzazione.md) | completata | P1 |
| 014 | [Informazioni personali fornite all’AI](funzionalita/risolte/014_contesto_personale_ai.md) | completata | P1 |
| 015 | [Accesso personale all’app e allo script](funzionalita/risolte/015_accesso_personale.md) | completata | P1 |
| 016 | [Prima versione mobile e pubblicazione](funzionalita/risolte/016_pubblicazione_mobile.md) | completata | P1 |
| 017 | [Generazione, validazione e caricamento delle schede](funzionalita/risolte/017_generazione_caricamento_schede.md) | completata | P1 |
| 018 | [Stack e organizzazione modulare dell’app](funzionalita/risolte/018_architettura_app.md) | completata | P1 |
| 019 | [Contatore locale delle serie e recuperi](funzionalita/risolte/019_contatore_serie_e_recuperi.md) | completata | P1 |
| 020 | [Riscaldamenti riutilizzabili](funzionalita/risolte/020_riscaldamenti_riutilizzabili.md) | completata | P1 |
| 021 | [Impostazioni, navigazione e annullamento](funzionalita/risolte/021_impostazioni_e_navigazione_esecuzione.md) | completata | P1 |
| 022 | [Promemoria e valori per la prossima esecuzione](funzionalita/risolte/022_prossima_esecuzione.md) | completata | P1 |

## Regole di manutenzione

- Ogni funzionalità ha un unico file e un ID numerico stabile a tre cifre, che costituisce il prefisso del nome: `001_calendario.md`.
- Non rinumerare gli ID esistenti quando cambiano priorità, stato o ordine di lavoro.
- Aggiungere qui ogni nuova funzionalità, indicando stato, priorità e collegamento.
- Riportare gli stessi stato e priorità anche nel file della funzionalità.
- Quando una specifica cambia stato, spostarla nella cartella corretta e aggiornare tutti i collegamenti interessati.
- In ogni file mantenere requisiti consolidati, esito della revisione, dettagli delegati, questioni aperte e un breve registro delle decisioni significative.
- Segnalare ogni questione importante ancora da decidere con una riga che inizi letteralmente con `>>`. Per ritrovarle nei file cercare `^>>`.
- Quando una questione è risolta, integrarne l’esito nei requisiti e rimuovere il relativo marcatore aperto. Non lasciare note obsolete in conflitto con le decisioni attuali.
- Preferire la chiusura delle specifiche sufficientemente definite; non riaprire una discussione per dettagli estetici.
- Anche le questioni comuni e architetturali seguono lo stesso sistema: un file numerato, una voce nell’indice e uno stato. Le proposte non ancora concordate restano in discussione.

## Esito dell’analisi per avviare la prima versione

Tutte le specifiche 001–018 sono risolte. Le risposte dell’utente hanno confermato accesso personale (015), Android/Chrome e la scelta di distribuzione motivata nella 016, oltre al flusso AI/script (017).

Non rimangono decisioni funzionali bloccanti prima dello sviluppo. Restano verifiche di ambiente e configurazioni guidate di account, database e hosting, da svolgere nelle fasi del piano. Lo sviluppo è stato avviato il 29/10/2026; lo stato reale è registrato esclusivamente nella tabella del piano, separatamente dallo stato delle specifiche.

## Piano di realizzazione

Il [piano strategico della prima versione](piano_prima_versione.md) è il riferimento unico per ordine delle macrofasi, ruoli AI/umano, criteri di accettazione e avanzamento. Prevede una prima consegna utilizzabile e poi il completamento di calendario, grafici e video. I requisiti rimangono nei file delle specifiche; il piano non ne modifica lo stato.

## Registro delle revisioni

- 27/10/2026: prima formalizzazione delle nove funzionalità.
- 28/10/2026: analizzate le note dell’utente; tutte le nove specifiche risultano risolte. Creati i file dedicati, assegnate priorità e abbozzate le cinque proposte trasversali. Nessuna implementazione è attestata da questi stati.

- 28/10/2026: trasferite le cinque proposte trasversali nelle funzionalità 010–014, tutte in discussione con priorità P1; eliminato il documento separato dopo la migrazione dei contenuti.

- 28/10/2026: approvate 010 e 014; risolte 012 e 013 con invio automatico per gruppi conclusi e manuale negli altri casi. Riscritta 011 come proposta SQL per Supabase, ancora in discussione.

- 29/10/2026: approvata e semplificata 011; consolidate tutte le specifiche 001–014. Analisi delle lacune limitata a tre questioni operative 015–017, con proposte e ordine di lavoro per una prima versione rapida.
- 29/10/2026: aggiunta 018 per Vue 3 + Vite e modularità approvati; creato il piano strategico con passaggio di consegne e stato di esecuzione. Nessuno sviluppo avviato.

- 29/10/2026: consolidate le risposte nei file 015–017, spostati tra le risolte. Tutte le 18 specifiche completate; nessun deploy o sviluppo avviato.

- 01/11/2026: aggiunta e approvata 019, contatore locale e due recuperi per voce di piano.
