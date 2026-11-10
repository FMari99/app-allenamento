# Idea generale e obiettivi del progetto

## Visione

Il progetto ha l’obiettivo di realizzare un sistema personale, semplice e gratuito per creare schede di allenamento con l’aiuto di un AI assistant, consultarle dal telefono, eseguire gli allenamenti e conservare lo storico dei progressi.

Il sistema deve ridurre al minimo sia la complessità tecnica sia le operazioni manuali necessarie durante una sessione di allenamento. Non nasce come prodotto commerciale o piattaforma multiutente, ma come strumento personale che possa evolvere gradualmente.

## Obiettivi principali

- Generare schede di allenamento strutturate tramite un AI assistant.
- Validare le schede prima di renderle disponibili nell’app.
- Caricare e conservare le schede in un database online.
- Consultare dal telefono le schede disponibili.
- Eseguire un allenamento attraverso un’interfaccia pensata per l’uso mobile.
- Registrare i risultati effettivi e i tempi delle sessioni.
- Conservare e consultare lo storico degli allenamenti e dei progressi.
- Sincronizzare in modo controllato i dati tra telefono e database online.

L’[indice delle funzionalità](specifica_funzionalita_app.md) elenca ID, stati e priorità e collega i file dedicati in `funzionalita/risolte/` e `funzionalita/in_discussione/`. Lo stato “completata” indica che la specifica è risolta, non che sia implementata.

Le questioni comuni su categorie, modello dati, persistenza, sincronizzazione e contesto dell’AI sono gestite nello stesso indice come funzionalità 010–014, con file dedicati nelle cartelle corrispondenti al loro stato.

## Decisioni funzionali consolidate

- Catalogo condiviso degli esercizi con ID stabili, riutilizzati nelle schede e nello storico.
- Un riepilogo dei risultati per esercizio eseguito; nessun dettaglio delle singole serie nella prima versione.
- Video facoltativo inserito dall’utente e salvato sull’esercizio; l’AI non seleziona video.
- Attrezzatura associata una volta all’esercizio, distinguendo strumenti necessari e utili.
- Attrezzatura modificabile dall’app con disponibilità e note libere per strumento; l’AI riceve solo gli attrezzi attivi disponibili con note per le nuove schede. Le schede già create non si adattano alle successive modifiche dell’inventario; nessuna sostituzione automatica (10/11/2026).
- Vincoli pratici e contesto personale raccolti nella conversazione con l’AI, senza questionari dedicati nell’app.
- Proposta iniziale AI e impostazione corrente conservate nel piano; risultati effettivi nella sessione. Nessuna copia separata dei valori previsti per ogni sessione.
- Valori della sessione precompilati all’avvio, modificabili e validi come risultati solo dopo conferma. L’esercizio si ricava dalla voce stabile del piano: sostituirlo richiede una nuova voce, conservando la precedente per lo storico.
- Sessioni salvate con inizio e fine; quelle senza fine restano in corso nello stesso giorno e sono segnalate incomplete dal successivo.
- Tutti i dati funzionali sono destinati alla sincronizzazione online; il telefono conserva anche quelli ancora in attesa di invio.
- Approvate le cinque categorie di esercizio della 010 e la gestione conversazionale del contesto della 014, senza un profilo personale persistente aggiuntivo.
- Upload automatico al termine della sessione e dei gruppi definiti di modifiche; invio manuale delle modifiche senza un confine prevedibile.

Alla revisione del 02/11/2026 tutte le specifiche 001–021 sono risolte, incluse accesso personale, pubblicazione mobile, flusso AI/script e architettura modulare. Tutte seguono le medesime regole di gestione.

## Flusso generale previsto

1. L’utente chiede all’AI assistant di creare una nuova scheda, fornendo obiettivi, livello, attrezzatura disponibile e altri vincoli utili.
2. L’AI assistant segue regole definite e genera un file strutturato, indicativamente in formato JSON.
3. La scheda viene validata per verificare che struttura, categorie di esercizio e dati obbligatori siano corretti.
4. Uno strumento dedicato carica la scheda nel database online.
5. L’app sul telefono scarica le schede quando l’utente richiede esplicitamente la sincronizzazione.
6. Durante l’allenamento, l’app guida l’utente tra gli esercizi e registra i risultati.
7. I progressi vengono salvati localmente e inviati automaticamente al completamento della sessione. Altri gruppi di modifiche con conclusione esplicita possono essere inviati automaticamente; modifiche senza un termine prevedibile vengono sincronizzate manualmente.

## Ruolo dell’AI assistant

L’AI assistant non deve limitarsi a produrre testo libero. Dovrà operare seguendo una procedura ripetibile che definisca:

- la struttura delle schede;
- le categorie di esercizio ammesse;
- i dati obbligatori e facoltativi;
- le regole di validazione;
- il modo in cui la scheda viene caricata nel sistema.

L’implementazione prevista potrà comprendere una skill dedicata, uno schema JSON e uno script di validazione e caricamento. Il contratto JSON v1 e il validatore sono stati implementati in F1; skill e percorso di caricamento completo rimangono in F3.

## Esperienza d’uso desiderata

L’app deve essere progettata principalmente per smartphone e per l’utilizzo durante l’allenamento. Le operazioni più frequenti devono richiedere pochi tocchi e i dati essenziali devono essere leggibili rapidamente.

Il comportamento desiderato è di tipo **local-first con upload automatici per gruppi conclusi e sincronizzazione manuale**:

- la consultazione e la registrazione di una sessione non dovrebbero dipendere continuamente dalla connessione a Internet;
- il download delle schede dal database deve avvenire su richiesta dell’utente;
- l’invio dei progressi deve essere controllabile e non deve rischiare la perdita dei dati locali in caso di problemi di rete.

Le regole approvate sono nelle specifiche 012 e 013: anche sessioni in corso e incomplete possono essere sincronizzate manualmente; gli invii automatici falliti restano in coda e vengono ritentati quando l’app è attiva e la rete disponibile.

## Vincoli del progetto

- La soluzione deve essere gratuita, almeno per il volume di utilizzo personale previsto.
- L’architettura deve essere la più semplice possibile.
- Va evitato un backend personalizzato se un servizio gestito può coprire le necessità in modo sicuro e affidabile.
- L’app deve essere facilmente accessibile da telefono.
- Le informazioni devono restare esportabili e non dipendere esclusivamente da un formato proprietario.
- Le proposte dell’AI relative a carichi o livello di difficoltà devono essere prudenti e modificabili dall’utente.

## Stack approvato e scelte di distribuzione

Il 29/10/2026 l’utente ha approvato lo stack seguente. L’organizzazione modulare è descritta nella specifica 018; l’ipotesi iniziale senza framework è superata.

- **App mobile:** Vue 3 + Vite, distribuita come PWA. Componenti e viste separati dai moduli per regole di dominio, dati e sincronizzazione.
- **Persistenza locale:** IndexedDB per dati strutturati e coda offline.
- **Database cloud:** Supabase/PostgreSQL; schema SQL approvato nella specifica 011.
- **Generazione e caricamento:** file JSON validati e script Python eseguiti dall’ambiente dell’AI assistant.
- **Pubblicazione dell’app:** GitHub Pages in HTTPS, per Android/Chrome. L’utente preferisce evitare pubblicazioni non necessarie ma le accetta se più comode: la scelta della PWA statica è motivata nella 016. Il frontend è pubblico; i dati personali sono protetti in Supabase.

L’AI conduce le macrofasi del [piano della prima versione](piano_prima_versione.md), chiedendo all’utente configurazioni degli account e prove sul telefono quando servono. La tabella finale del piano registra lo stato reale: lo sviluppo è iniziato il 29/10/2026 e la tabella distingue le fondazioni locali dalle verifiche cloud e sul telefono ancora da svolgere.

## Prerequisiti operativi per lo sviluppo

Le decisioni delle specifiche 015–017 sono consolidate: account personale email/password per app e script, PWA per Android/Chrome su GitHub Pages, creazione delle schede da assistente e script sul computer. La prima versione non comprende un editor strutturale delle schede sul telefono.

Restano da verificare ambiente e disponibilità degli account e da eseguire le configurazioni, guidate dall’AI secondo il piano. Non è necessario riaprire una discussione sulle scelte approvate.

## Criterio di successo iniziale

Una prima versione è utile quando permette di completare in modo affidabile questo ciclo:

1. generare e validare una scheda;
2. caricarla nel sistema;
3. scaricarla manualmente sul telefono;
4. svolgere un allenamento e registrarne i risultati;
5. sincronizzare i progressi;
6. ritrovare lo storico in una sessione successiva.


## Priorità di UX e metodo di verifica (01/11/2026)

UX e stile sono una priorità assoluta durante lo sviluppo; mantenere o migliorare la qualità esistente, adattando lo spazio alla categoria di esercizio e riducendo informazioni superflue. Sono delegate piccole variazioni operative rispetto agli abbozzi, rispettando sempre le indicazioni esplicite. L’utente esegue preferibilmente i collaudi complessi sul telefono: l’assistente prepara istruzioni brevi e controlli automatici rapidi pertinenti, senza lunghe sessioni browser. La 019 estende l’app con counter locale e recuperi configurabili, preservando il riepilogo per esercizio e la separazione AI/corrente/risultati.
