# Indicazioni per gli assistenti

## Contesto del progetto

Questo repository contiene un’app personale per creare, consultare ed eseguire schede di allenamento, registrando nel tempo le sessioni e i progressi. L’AI assistant deve poter contribuire alla generazione strutturata delle schede, mentre l’app deve rimanere semplice, gratuita e comoda da usare dal telefono.

Prima di proporre o realizzare modifiche significative, leggere la visione generale, l’indice unico delle funzionalità e le specifiche pertinenti presenti in [`project_knowledge/`](project_knowledge/). Per avviare o riprendere lo sviluppo leggere anche il piano strategico e la sua tabella di avanzamento.

## Documentazione di riferimento

- [`project_knowledge/funzionalita/risolte/019_contatore_serie_e_recuperi.md`](project_knowledge/funzionalita/risolte/019_contatore_serie_e_recuperi.md): regole approvate per contatore locale, recuperi e label.
- [`project_knowledge/funzionalita/risolte/020_riscaldamenti_riutilizzabili.md`](project_knowledge/funzionalita/risolte/020_riscaldamenti_riutilizzabili.md) e [`021`](project_knowledge/funzionalita/risolte/021_impostazioni_e_navigazione_esecuzione.md): riscaldamenti, impostazioni, navigazione e annullamento.
- [`project_knowledge/funzionalita/risolte/022_prossima_esecuzione.md`](project_knowledge/funzionalita/risolte/022_prossima_esecuzione.md): promemoria/aumenti futuri richiesti, implementazione pendente nel piano.
- [`README.md`](README.md): comandi reali, struttura implementata, contratti v1/v2/v3 e limiti delle verifiche locali.
- [`skills/crea-scheda-allenamento/SKILL.md`](skills/crea-scheda-allenamento/SKILL.md): leggere quando si genera, valida o carica una scheda per questa app; usa export e comandi reali della CLI, catalogo riutilizzato e invii ripetibili.

- [`project_knowledge/piano_prima_versione.md`](project_knowledge/piano_prima_versione.md): punto di ingresso per la chat di sviluppo, macrofasi, ruoli AI/umano, verifiche e stato di esecuzione.
- [`project_knowledge/idea_generale_e_obiettivi.md`](project_knowledge/idea_generale_e_obiettivi.md): descrive la visione del progetto, il flusso generale, i vincoli e la direzione tecnica iniziale.
- [`project_knowledge/specifica_funzionalita_app.md`](project_knowledge/specifica_funzionalita_app.md): indice completo delle funzionalità, con ID, stato, priorità e regole di gestione.
- [`project_knowledge/funzionalita/risolte/`](project_knowledge/funzionalita/risolte/): file delle specifiche risolte.
- [`project_knowledge/funzionalita/in_discussione/`](project_knowledge/funzionalita/in_discussione/): file delle specifiche in discussione o da discutere.

## Gestione delle specifiche

Anche le questioni comuni su dati, sincronizzazione e contesto dell’AI sono gestite come funzionalità: stesso indice, numerazione, stati, priorità e cartelle. Non mantenere elenchi o documenti di decisioni separati dal sistema delle specifiche.

- Ogni funzionalità ha un file con prefisso numerico stabile a tre cifre e una voce nell’indice; l’indice collega tutte le specifiche senza duplicarne i requisiti.
- “Completata” significa definizione risolta, non funzionalità implementata. Gli altri stati sono “in discussione” e “da discutere”. Priorità P1/P2/P3 come definite nell’indice.
- Preferire la risoluzione quando i requisiti sostanziali sono sufficienti. Annotare i dettagli secondari come scelte delegate all’assistente e procedere.
- Le questioni importanti aperte devono iniziare con il marcatore letterale `>>`; rimuoverlo quando la decisione viene consolidata.
- Aggiornare insieme file, stato, priorità, cartella e collegamenti nell’indice. Se una specifica viene riaperta, spostarla in `in_discussione/`.
- Per nuove funzionalità aggiornare l’indice; aggiornare questo file solo se cambiano regole o organizzazione generale.
- Le note dell’utente vanno integrate senza perderne il significato; rimuovere le formulazioni superate e conservare un breve registro delle decisioni rilevanti.

Questi documenti rappresentano la conoscenza condivisa del progetto. In caso di contrasto tra un’ipotesi tecnica e una decisione esplicita dell’utente, prevale sempre la decisione più recente dell’utente e la documentazione deve essere aggiornata di conseguenza.

## Decisioni operative consolidate

- Stack approvato: Vue 3 + Vite, Supabase/PostgreSQL, IndexedDB e Python. Organizzazione modulare nella specifica 018; superata l’ipotesi di interfaccia senza framework.
- Progettare il database SQL assumendo Supabase/PostgreSQL; lo schema approvato e semplificato è nella specifica 011.
- Sincronizzazione 012–013: upload automatico a fine sessione o di un gruppo esplicitamente concluso; modifiche senza confine prevedibile inviate manualmente. Download su richiesta. Conservare la coda offline e ritentare solo i gruppi già autorizzati all’invio automatico.
- Categorie della 010 e raccolta conversazionale del contesto della 014 approvate. Non introdurre un profilo personale persistente aggiuntivo senza una nuova decisione.

- Nella 011 non duplicare esercizio_id, descrizioni o misure previste in esercizi_sessione: risalire al catalogo tramite la voce stabile del piano. Precompilare i valori di sessione e considerarli risultati solo dopo conferma; sostituire una voce del piano creando una nuova riga.
- Per arrivare rapidamente alla prima versione, limitare le discussioni alle decisioni che influenzano il flusso principale. Le scelte operative 015–017 sono risolte: account personale email/password, Android/Chrome, PWA su GitHub Pages e creazione schede tramite AI/script sul computer. Restano da configurare i servizi, non da riconfermare queste decisioni.

- Nella 016 è preservata la preferenza dell’utente per non pubblicare inutilmente l’app: ha accettato la pubblicazione se più comoda. Per la prima versione si è scelta la PWA statica su GitHub Pages; URL pubblico, dati privati protetti da login e RLS. Non introdurre packaging Android nella prima versione.

## Principi di lavoro

- L’AI conduce il piano: prepara codice, comandi e verifiche e richiede all’utente soltanto scelte personali, accessi alle console e prove reali sul telefono quando più efficienti dell’automazione.
- Fornire per gli interventi umani pochi passaggi concreti, risultato atteso e informazioni da riportare; non delegare scrittura del codice o diagnosi dei log all’utente.
- Aggiornare la tabella di avanzamento del piano a fine fase e prima del passaggio a una nuova chat. Le specifiche risolte non attestano implementazione o test completati.
- Il 29/10/2026 l’utente ha autorizzato l’avvio dello sviluppo. F0 e fondazioni F1 realizzate; F2 completata: database e test SQL cloud verificati, login/refresh/lettura API personali riusciti e nuove iscrizioni disattivate con conferma live. Consultare la tabella del piano per il punto corrente e la prossima fase. Le precedenti note di sola preparazione documentale sono superate.
- Il 30/10/2026 F3 è completata: export, validazione e upload tramite CLI personale e skill di progetto; test reali su catalogo vuoto/popolato, relazioni, reinvii e risposta persa superati. Dati fittizi rimossi. F4 è ora descritta nel punto seguente; download e sincronizzazione dal telefono restano in F5.

- Il 30/10/2026 F4 è implementata e verificata localmente: demo separata, sessioni e risultati persistenti, inventario, storico e base PWA offline. Non trasferire i dati fittizi della demo all’account personale. F5 è descritta nel punto seguente; mantenere la separazione della demo.

- Privilegiare soluzioni semplici e proporzionate a un progetto personale.
- Evitare servizi a pagamento o componenti che richiedano manutenzione non necessaria.
- Distinguere chiaramente requisiti confermati, proposte e decisioni ancora aperte.
- Non presentare come definitiva una tecnologia indicata soltanto come ipotesi iniziale.
- Conservare i dati in formati strutturati, validabili e adatti sia all’app sia agli strumenti usati dall’AI assistant.
- Progettare l’interfaccia prima di tutto per un utilizzo rapido da smartphone durante l’allenamento.
- Trattare suggerimenti su esercizi, carichi e prestazioni come indicazioni prudenti, non come prescrizioni mediche o professionali.
- Scrivere documentazione e testi rivolti all’utente in italiano, salvo diversa richiesta.

- F5 è pubblicata su https://fmari99.github.io/app-allenamento/, con test automatici locali/cloud superati. Dal 07/11/2026 il repository pubblico contiene l’intero progetto condivisibile; `private/`, file ambiente, build e temporanei restano esclusi. La PWA viene compilata e distribuita da `.github/workflows/deploy-pages.yml`; `tools/publish_pages.py` verifica gli artefatti e può avviare il workflow, senza sostituire `main` con la build. Il collaudo principale Android è stato confermato dall’utente: verifica cloud con una sola sessione conclusa e cinque risultati (quattro confermati). Fixture Collaudo F5 disattivata tramite `tools/phone_fixture.py cleanup`; serve Sincronizza sul telefono per recepire la pulizia. Recupero su altro dispositivo di una sessione incompleta e installazione separata non ancora attestati: consultare il piano prima di chiudere formalmente F5. L’utente preferisce eseguire personalmente i test UI: evitare test browser dell’assistente salvo controlli certamente molto rapidi. Preservare payload già tentati, dipendenze, copia offline per owner e ricevute transazionali.

- Il 30/10/2026 l’utente ha autorizzato F6 mantenendo lo stesso approccio. Versione 0.2.0 implementata: calendario, grafici, durate confrontabili e video condiviso; 26 test JS e 14 Python, build superati. La demo offre storico sintetico locale su richiesta. Collaudo Android F6 e uso reale ancora pendenti; non segnare il traguardo B raggiunto. Istruzioni e limiti nel README, avanzamento nel piano. Non generare una prima scheda personale senza raccogliere il contesto previsto dalla skill.

- UI 0.2.1 approvata dall’utente: privilegiare schermate compatte per ridurre lo scorrimento. Nessuna barra superiore con logo/stato né testo introduttivo Home. Navigazione inferiore Home, Calendario centrale, Menu destro; menu laterale con Area personale, Progressi, Attrezzatura, separatore e versione. Account/demo, sincronizzazione, esportazione e stato offline/locali nell’Area personale, senza riepilogo tecnico globale a fondo pagina. In 0.2.2 il nome della scheda apre sempre un selettore mobile, anche con una sola scheda.

- Home 0.2.2: schede ordinate per ultima esecuzione e più recente selezionata all’ingresso; nome cliccabile apre «Seleziona scheda». Un solo allenamento alla volta, con frecce cicliche; ultima sessione aperta proposta con Riprendi e Termina integrati. Termina da Home usa l’ultimo completato_at confermato, salta le bozze, accoda il gruppo automatico e passa al successivo; senza conferme resta disabilitato. Normale conclusione durante allenamento distinta. Specifiche 003 e 005 aggiornate; 31 JS e 14 Python superati, prova UI all’utente.

- Home 0.2.3: pulsante Inizia centrato sotto il titolo; Lista esercizi chiusa per default e apribile/chiudibile in fondo alla card. La sola demo comprende anche «Demo essenziale» (un allenamento, un esercizio), aggiunta alle demo esistenti in modo idempotente preservando dati e coda. Non aggiungere questa fixture all’account reale.

- Esecuzione 0.2.4: niente card, barra esercizio n/m con cronometro live e menu ⋯. Precedente, Salta e Completato: le ultime due avanzano e sull’ultimo esercizio chiudono atomicamente la sessione, tornano Home e mostrano toast. Salta non conta come eseguito; eventuali bozze residue diventano saltate. Dettagli in modali separate per originale AI, attrezzatura, video e precedenti (5 per pagina). Modifica corrente in Progressi, non nella modale AI. Riprendi apre il primo da eseguire. Chiusura automatica a ora corrente distinta dal Termina parziale Home all’ultima conferma. Correzioni storiche restano manuali. Nessuna eliminazione di colonne SQL. 41 JS e 14 Python superati; UI al collaudo utente.

- Priorità generale ribadita il 01/11/2026: UX e stile devono mantenere o superare il livello esistente, con spazio adattivo e interfacce compatte. L’assistente può rifinire piccoli dettagli rispetto agli abbozzi, salvo indicazioni esplicite dell’utente. Privilegiare controlli automatici rapidi e pertinenti; lasciare i test complessi e l’uso sul telefono all’utente, con istruzioni concrete, evitando consumo di token per lunghe prove browser.
- Nuova [019](project_knowledge/funzionalita/risolte/019_contatore_serie_e_recuperi.md) approvata: label riconoscibili, contatore serie solo locale persistente, due recuperi AI/correnti per voce del piano, modifica timer nel menu ⋯ e un solo countdown visibile. La convalida dei risultati rimane distinta. Contratto v2 per nuove schede, v1 compatibile per vecchi payload. Versione 0.3.0 pubblicata il 01/11/2026; migrazione cloud applicata e verificata tramite MCP OAuth desktop, 45 casi JS e 15 Python superati. Collaudo UI sul telefono ancora all’utente; seguire lo stato nel piano.

- 02/11/2026: [020](project_knowledge/funzionalita/risolte/020_riscaldamenti_riutilizzabili.md) introduce blocchi di riscaldamento riutilizzabili nella stessa scheda, richiamati selettivamente dagli allenamenti; contratto v3, v1/v2 invariati per i reinvii. Tipo e riferimento in allenamenti, nessuna nuova tabella; voci e risultati nella sessione principale. La [021](project_knowledge/funzionalita/risolte/021_impostazioni_e_navigazione_esecuzione.md) introduce modalità immersiva (default attiva), frecce (default attive), suono (default spento), impostazioni locali con Salva, e annullamento confermato tramite tombstone automatiche. Anteprime future consultabili ma non eseguibili; correzioni precedenti non riavviano il recupero. Non forzare fullscreen browser né promettere audio in background. Consultare il piano per pubblicazione e collaudo 0.4.0.

- 02/11/2026, revisione 0.5.0: recupero sempre in modale a tutto schermo, verde con countdown/anello e Salta recupero, rossa a scadenza con tempo extra e Riprendi allenamento. Quattro suoni acuti locali, selettore in seconda modale con anteprima, Seleziona e successivo Salva delle impostazioni. Non riavviare un recupero post esercizio già consumato alla conferma. Prima scheda personale A/B caricata tramite CLI e verificata con export; non trattare più l’account come privo di schede. Contenuti e diario restano sotto private/, mai negli artefatti pubblicati. UI/audio sul telefono ancora al collaudo utente.

- 04/11/2026: “un fix alla volta” significa implementare in sequenza e proseguire autonomamente con tutti, senza fermarsi dopo ciascuno. Correzione stabilità 0.5.1 inclusa nella 0.6.0: niente sync a vuoto, commit interni senza blocco UI e riferimenti invariati conservati. Non rimuovere serializzazione, atomicità o protezione scritture alla chiusura.
- 0.6.0 include timer lavoro/preparazione/recupero, automatismo tra serie opzionale, riavvio e barra ridotta; ultima serie equivale a Completato, una serie senza contatore e attrezzatura subito visibile. Mai recuperare automaticamente serie durante lunghe sospensioni: una fase per commit con scadenza assoluta e conferma esplicita dopo sospensione. La 022 è implementata con proposta_futura JSONB sulla voce, helper privato e invio manuale; Applica/Rimanda/Annulla proposta, valori AI e risultati storici intatti. Test locali e cloud nel piano; UI/telefono all’utente. MCP Supabase nativo disponibile dopo rinnovo OAuth: preferirlo al precedente helper curl; non chiedere altri riavvii senza motivo.

## Aggiornamento della conoscenza di progetto

Quando emergono informazioni significative che aggiungono, correggono o superano quanto già documentato, l’assistente deve aggiornare:

1. il documento pertinente dentro `project_knowledge/`;
2. questo file `AGENTS.md`, se la nuova informazione modifica le indicazioni operative, i principi generali, la struttura della documentazione o i riferimenti disponibili.

Se viene aggiunto un nuovo documento importante in `project_knowledge/`, deve essere inserito anche nell’elenco della documentazione di riferimento di questo file.

Non è necessario registrare ogni dettaglio temporaneo, tentativo tecnico o scelta facilmente reversibile. Vanno invece conservati almeno:

- obiettivi e vincoli del progetto;
- decisioni architetturali o tecnologiche confermate;
- requisiti funzionali rilevanti;
- strutture dati e flussi principali concordati;
- decisioni che influenzano il lavoro futuro;
- cambiamenti che rendono obsolete informazioni già presenti.

Gli aggiornamenti devono modificare le informazioni esistenti quando sono state superate, evitando di accumulare note contraddittorie. Se una decisione non è ancora definitiva, deve essere indicata esplicitamente come proposta o questione aperta.

## Prima di concludere una modifica

- Verificare che il risultato sia coerente con i documenti di `project_knowledge/`.
- Aggiornare la documentazione quando la modifica introduce una decisione significativa.
- Evitare di alterare o eliminare contenuti dell’utente non coinvolti nella richiesta.
- Eseguire controlli proporzionati al tipo di modifica effettuata.

