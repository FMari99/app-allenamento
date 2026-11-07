# Piano strategico e passaggio di consegne — prima versione

Ultimo aggiornamento: 07/11/2026.

## Punto di ripartenza per una nuova chat

Lo sviluppo è stato avviato su richiesta dell’utente il 29/10/2026. F0 è conclusa e F1 ha prodotto lo scheletro Vue/Vite, il contratto JSON, la validazione Python, la migrazione SQL e test locali. F4 ha ora una demo locale funzionante: registra e riprende sessioni in IndexedDB, con manifest e cache PWA. F5 collega l’app a Supabase ed è pubblicata; il collaudo principale sul telefono è stato confermato dall’utente.

F2 e F3 completate; F4 implementata e verificata localmente. F5 implementata e pubblicata; il 30/10/2026 l’utente ha riferito esito positivo del collaudo principale. Verifica cloud: una sola sessione conclusa, cinque risultati, quattro confermati, nessun duplicato della sessione. Non sono stati segnalati problemi. Progetto `jrtasvnbtmyutomortfn`, account personale creato. Applicati via MCP i pacchetti `20261029133137_fondazioni_e_registro` e `20261029133234_permessi_interni`. Tutte le tabelle applicative hanno RLS. Test reali di proprietà, conflitti, rollback e reinvii superati con rollback dei dati di prova. Configurazione `.env.local` pronta con chiave pubblicabile. Login, rinnovo sessione e lettura Data API riusciti tramite CLI personale (esito riportato dall’utente). Chiusura delle nuove iscrizioni confermata dal controllo live `/auth/v1/settings`: `disable_signup: true`. Nessun intervento umano residuo per F2.

F3 completata il 30/10/2026: CLI personale con export/prepare/upload, validazione contro il catalogo reale, diario privato per gli invii e skill di progetto. Test locali: due suite JS e 14 test Python; skill validata. Prova cloud reale: cinque categorie, associazioni strumenti, seconda scheda con catalogo riutilizzato, reinvii con/senza diario e risposta persa dopo commit, input errati e rollback. Export e relazioni verificati; rimossi solo gli UUID fittizi e confermato il ripristino dei conteggi iniziali. Nessuna scheda personale creata. Per F5 leggere 012, 013, 015, 016 e 018; conservare i comportamenti di F4 verificati sotto.

F4 implementata il 30/10/2026: viste modulari, cinque categorie, bozze/conferma/salto, stato e durata nel fuso della sessione, rotazione, proposta AI e piano corrente, inventario e storico; IndexedDB atomico con coda e revisione contro scritture da altre finestre. Manifest, icone e cache di soli file statici. Test JS/Python e build superati; browser verificato anche a 390×844. Chrome con server spento: modifica/conferma e ripresa dopo ricarica e chiusura/riapertura reali della scheda. La demo usa un database separato; non invia dati a Supabase. La successiva prova principale Android F5 è stata confermata dall’utente.

F5 implementata il 30/10/2026: client Supabase ufficiale, login personale e ripresa offline per proprietario, download manuale, invii RPC atomici con payload congelato, dipendenze e ricevute transazionali locali, conflitti con confronto e scelta. Test locali (19 JS e 14 Python), build e audit senza vulnerabilità. Prova cloud completa riuscita, dati tecnici rimossi. Sito HTTPS attivo: https://fmari99.github.io/app-allenamento/. In origine il repository pubblico conteneva soltanto gli artefatti; dal 07/11/2026 contiene il progetto completo condivisibile e GitHub Actions pubblica la sola build. Nessun test interattivo F5 nel browser su richiesta dell’utente. La scheda fittizia «Collaudo F5 — prova sul telefono» è stata usata dall’utente, che ha riferito «sembra funzionare tutto». La verifica cloud ha trovato una sola sessione conclusa con cinque risultati (quattro confermati); la fixture e le sessioni collegate sono state disattivate tramite `tools/phone_fixture.py cleanup`, con tombstone e account personale. Diario e UUID in `private/collaudo-telefono-f5/`. L’utente deve premere Sincronizza per recepire la pulizia sul telefono. Collaudo principale riuscito; non sono ancora attestati il recupero su altro dispositivo di una sessione incompleta e l’installazione Android come app separata, che non vanno dedotti dalla conferma generica. Conservare queste verifiche residue prima della chiusura formale di F5.

F6 avviata e implementata il 30/10/2026 su esplicita richiesta dell’utente, pur mantenendo documentate le verifiche residue F5. Versione 0.2.0: calendario mensile giorno → sessioni → esercizi, grafici per catalogo con punti temporali distinti e cursore/slider, carico/durata/distanza, serie × ripetizioni oppure curve indipendenti dichiarate, confronto durate per allenamento e revisione, video modificabile con salvataggio esplicito e invio manuale. Demo separata con storico sintetico caricabile su richiesta, senza modifiche al cloud. Test: 26 JavaScript e 14 Python; build riuscita; aggiornamento service worker verificato automaticamente in runtime isolato, senza accessi a IndexedDB o ricariche forzate. Nessun test UI F6 dell’assistente. Procedure di aggiornamento, sync, generazione, export e ripristino ambiente nel README. Collaudo Android F6, aggiornamento con coda reale, prima scheda personale e allenamento reale ancora pendenti: traguardo B non concluso.

Revisione UI 0.2.1 su richiesta dell’utente: rimossi intestazione logo/stato e testo introduttivo Home; pannello account/demo e informazioni tecniche spostati in Area personale. Barra inferiore Home / Calendario / Menu; menu laterale destro con Area personale, Progressi, Attrezzatura, divisore e versione. Selettore delle schede multiple conservato. Nessuna alterazione di dati/coda. Test 26 JS e 14 Python superati; collaudo visivo lasciato all’utente.

Revisione Home 0.2.2 richiesta dall’utente: nome scheda come selettore mobile, tutte le schede per ultima esecuzione con default sulla più recente. Un solo allenamento e frecce cicliche; default sull’ultima sessione aperta o sul prossimo dopo quella conclusa. Riprendi e Termina integrati nella scheda. Termina da Home chiude all’ultima conferma, salta le bozze e autorizza automaticamente il gruppo atomico; senza conferme è disabilitato. Dopo chiusura passa al successivo. Aggiornate 003/005. 31 test JS e 14 Python superati, nessun test browser dell’assistente.

Revisione Home 0.2.3: Inizia centrato sotto il titolo, Lista esercizi espandibile e chiusa per default a fondo card. Seconda scheda minima «Demo essenziale», aggiunta idempotentemente anche all’archivio demo esistente, senza sovrascrivere sessioni o coda; account reale escluso. 33 test JS e 14 Python superati, build riuscita; nessun test browser dell’assistente.

Revisione esecuzione 0.2.4: pulsanti Riprendi/Termina di pari dimensione; schermata esercizio senza card, barra con n/m, cronometro al secondo e menu ⋯. Precedente/Salta/Completato, avanzamento e conclusione automatica all’ultimo, Home e toast. Risultati, posizione e gruppo concluso atomici. Modali per originale AI, attrezzatura, video e precedenti (5 per pagina). Modifica corrente spostata in Progressi. Ripresa al primo esercizio da fare; correzioni storiche manuali senza alterare fine. Nessuna eliminazione di campi SQL. 41 test JS e 14 Python superati; build riuscita, prova UI all’utente.

01/11/2026 — Versione 0.3.0 pubblicata tramite tools/publish_pages.py, commit artefatti `8012cc3f4741bdba6bd8cea0f2acbe8725754553`: label semantiche, layout adattivo, contatore locale con Annulla, timer persistente a scadenza assoluta, configurazione nel menu, discrepanza conteggio/Serie esplicita. Contratto JSON v2 con recuperi obbligatori e v1 compatibile; skill/payload/demo aggiornati. Migrazione `20261101124720_recuperi_esercizi.sql` applicata tramite MCP al progetto previsto: quattro colonne integer nullable per recuperi AI/correnti, registro verificato, RLS attiva sulle dieci tabelle applicative. Prove cloud in transazione annullata: modifica recuperi correnti riuscita, AI immutabile e negativi rifiutati. Conteggi dati conservati. Advisor: stessi rilievi già documentati nel README (registro privato senza policy, RPC autenticata SECURITY DEFINER intenzionale, protezione password compromesse disabilitata); nessun nuovo oggetto esposto. Verifiche locali già superate: 45 casi JS, 15 Python, build e SQL PostgreSQL effimero. Nessun test browser complesso; collaudo UI e persistenza sul telefono all’utente. Non rigenerare vecchi payload congelati né cancellare dati locali.

02/11/2026 — Versione 0.4.0 pubblicata, commit artefatti `aa785ea61825f212ab13f43d3a2a5b6bb891564a`, index/service worker/JS/CSS verificati via HTTP uguali alla build: riscaldamenti riutilizzabili [020](funzionalita/risolte/020_riscaldamenti_riutilizzabili.md) e nuova esecuzione [021](funzionalita/risolte/021_impostazioni_e_navigazione_esecuzione.md). Un blocco nella scheda può servire più allenamenti; altri richiamano blocchi specifici o nessuno. Contratto v3 e compiler/validator/skill aggiornati, v1/v2 e payload precedenti conservati. Tipo e collegamento nella tabella allenamenti, stessa struttura di voci e risultati nella sessione principale. Migrazione `20261102110937_riscaldamenti_riutilizzabili.sql` applicata via MCP. Prova cloud con ruolo authenticated: creazione RPC e riuso, risultato del blocco, protezione riferimenti e annullamento con tombstone; rollback integrale, conteggi iniziali conservati e nessuna fixture residua. Quattro versioni nel registro, dieci tabelle con RLS, advisor invariati.

Esecuzione 0.4.0: Salta/Completato metà larghezza, frecce opzionali sotto per consultazione/anteprima, azioni e campi bloccati per esercizi futuri anche nel dominio. Correzioni ai precedenti non riavviano recuperi correnti. Modale Impostazioni e pagina nel menu: schermata intera nasconde nav inferiore (default sì), frecce (sì), suono a fine recupero (no); preferenze locali con Salva/Annulla. Segnale Web Audio con gesto utente, nessun replay di timer vecchi né garanzia background. Menu ⋯ con Torna alla Home e Annulla sessione confermato, tombstone automatiche della sola sessione; preservati payload tentati e dipendenze. Demo aggiornata idempotentemente con riscaldamento comune ai due allenamenti, sessioni già iniziate intatte e nuova revisione per confronti durate. Test: 51 casi JS e 17 Python, build, SQL locale e setup vuoto superati; nessun test browser. Collaudo visivo/audio/telefono all’utente secondo README; F6 non formalmente conclusa.

02/11/2026 — Versione 0.5.0 pubblicata, commit artefatti `e26d23e625dab367c84bfdb6a3f384c8a772b595`; index, service worker e JS/CSS verificati via HTTP uguali alla build. Recupero in modale piena verde con countdown/anello e Salta recupero; alla scadenza rosso con tempo extra e Riprendi allenamento. Quattro suoni acuti locali, anteprime senza sovrapposizione in seconda modale, Seleziona e Salva nelle impostazioni; nessun replay di timer scaduti alla riapertura. Recuperi post esercizio consumati non ripartono su Completato. Preferenze e timer restano solo locali; nessuna migrazione SQL necessaria. 54 casi JS e 17 Python e build superati; pattern audio verificati con AudioContext simulato. UI/audio sul telefono da collaudare all’utente, nessuna prova browser complessa.

Prima scheda personale caricata il 02/11/2026: file v3 sotto private/, validato e inviato con CLI personale, 56 righe in unica RPC. Export successivo confrontato campo per campo: un riscaldamento condiviso, due allenamenti, 21 voci e 18 esercizi nuovi. Riutilizzato lo stesso esercizio del catalogo dove ripetuto, carichi e convenzioni espliciti. Mobilità e recuperi iniziali aggiunti su delega dell’utente; assunzioni e fonti nei file privati, nessun contenuto personale negli artefatti del sito. Diary e operation_id conservati, nessun reinvio necessario. Prossima azione umana: aggiornare alla 0.5.0, accedere al proprio account e Sincronizza per scaricare la scheda; test UI/audio nella demo prima dell’uso reale.

04/11/2026 — Primo fix della nuova richiesta, inizialmente interpretata come interventi separati (chiarimento successivo sotto): versione 0.5.1 sulla stabilità UI, commit artefatti `1d79c851006501cd30d7799fb65d2f4620c749e4`. Causa individuata nel retry periodico che attivava sync anche senza lavoro e nei commit interni che usavano il blocco globale e sostituivano tutti i riferimenti dello snapshot. Ora selezione unica dei gruppi inviabili condivisa tra coordinatore/engine, nessuna sync automatica a vuoto, commit interni in background senza blocco UI, riuso ricorsivo dei rami immutati; timer e scritture mantengono persistenza/atomicità/revisione e protezione alla chiusura. 57 casi JS e 17 Python superati; test Vue: nessun reset dei punti del grafico su commit metadati, cambiamenti reali propagati, snapshot precedente immutato. Build riuscita; nessuna prova browser lunga, verifica visiva utente pendente. La prima distribuzione era ancora in elaborazione al controllo di quella chat; superata dalla distribuzione 0.6.0 descritta sotto.

04/11/2026 — Chiarimento dell’utente: implementare tutti gli interventi in sequenza senza fermarsi dopo ciascuno. Versione 0.6.0 completa tutti i punti della richiesta; non restano quei fix da iniziare. Timer lavoro/preparazione (5s configurabili)/recupero, switch automatico tra serie, riavvio senza doppio conteggio, riduzione a barra ed espansione, testo prossimo esercizio/serie. Ultima Serie fatta conferma/avanza atomicamente; ultimo esercizio chiude senza pausa finale. Singola serie senza contatore e attrezzatura subito visibile. Stop agli automatismi durante lunghe sospensioni: una fase per commit, scadenza assoluta, coordinatore visibile, conferma esplicita dopo ritardo oltre 2,5s. Grafici conservano selezione per ID anche su ACK o nuovi dati.

Prossima volta 022 implementata: JSONB proposta_futura validato da helper privato sulla voce del piano, promemoria oppure misure future, origine e rinvio per sessione. Applica aggiorna piano corrente e bozza attuale senza conferma risultato, Rimanda evita ulteriori avvisi nella stessa sessione anche dopo sync, Annulla proposta conserva i valori. Invio manuale/revisione/coalescenza e dipendenze precedenti; valori AI immutabili e storico intatto. Ambito per voce, esplicito per blocchi condivisi. Migrazione 20261104155916 applicata via strumenti MCP nativi ora disponibili dopo OAuth rinnovato; cinque migrazioni e dieci tabelle con RLS. Prova cloud con RPC/ruolo authenticated e rollback riuscita, nessun dato fittizio residuo; advisor invariati. Configurazione CLI ancora v2.122.0 per evitare breaking change v3; nessun aggiornamento dipendenze non richiesto.

Verifiche: 65 casi JS, 17 Python, SQL PostgreSQL effimero e setup vuoto superati, build 0.6.0 riuscita. Nessun test browser complesso. Collaudo UI/telefono ancora all’utente, con istruzioni nel README; F6/traguardo B non formalmente conclusi. Prima scheda personale invariata, nessun aumento applicato per prova. Build finale inviata: commit artefatti `256882da939edadbc4d88e95b0be91dbee776d79`, run https://github.com/FMari99/app-allenamento/actions/runs/41864725745. Il controllo HTTP finale trova ancora 0.5.0 e asset nuovi assenti: non dichiarare la 0.6.0 online. Stato API Actions queued; https://www.githubstatus.com/api/v2/summary.json conferma incidente Actions/Pages con degraded_performance. Non è un errore del progetto. Tentato annullamento dei run intermedi superati 41864515424, 41864114355 e 41861834066; GitHub rifiuta con HTTP 409 perché non in esecuzione (stato queued). Nessun run annullato; anche il run finale resta in coda. A ripristino del servizio verificare quale commit risulta effettivamente distribuito. Nessun ulteriore login o intervento console richiesto all’utente. Nel prossimo turno verificare attivazione run/HTTP; non ripubblicare inutilmente la stessa build.

MCP: dal 04/11/2026 strumenti nativi disponibili e verificati dopo rinnovo OAuth; preferirli al vecchio helper curl. Configurato e autenticato con OAuth nella configurazione desktop (`/home/fabio/.codex`); il precedente accesso Snap è scaduto. Gli strumenti nativi non risultavano esposti nemmeno dopo riavvio: collegamento verificato usando direttamente il protocollo MCP via curl e la sola credenziale Supabase dal portachiavi, senza esportare né mostrare token. Nessun ulteriore login o riavvio richiesto. Usare il server desktop con URL limitato al progetto `jrtasvnbtmyutomortfn`.

Ordine di lettura:

1. [AGENTS.md](../AGENTS.md).
2. Questo piano, soprattutto la tabella di avanzamento finale.
3. [Idea generale e obiettivi](idea_generale_e_obiettivi.md).
4. [Indice unico](specifica_funzionalita_app.md).
5. Specifiche della fase corrente, senza rileggere ogni volta tutti i documenti.

Le specifiche sono la fonte dei requisiti; questo piano definisce sequenza, responsabilità e avanzamento. Non costituisce un secondo elenco di decisioni funzionali. Per conflitti, aggiornare prima la specifica pertinente, poi i riferimenti del piano.

## Decisioni da non riaprire

- Stack approvato: Vue 3 + Vite, Supabase/PostgreSQL, IndexedDB, Python; organizzazione modulare nella 018.
- Uso personale e gratuità; nessun servizio AI a pagamento integrato necessario al funzionamento dell’app.
- Schema SQL approvato nella 011: nove tabelle applicative più operazioni_sync.
- esercizi_sessione contiene dieci colonne specifiche più i campi tecnici comuni; non duplicare esercizio_id, descrizioni, categoria o convenzioni e non reintrodurre previsto_*.
- I valori della sessione vengono precompilati, sono modificabili e diventano risultati solo alla conferma. Nel piano rimangono proposta originale AI e impostazione corrente.
- I riferimenti della voce di piano sono stabili; per sostituire un esercizio si disattiva la vecchia voce e se ne crea una nuova. Lo storico include i riferimenti disattivati.
- Upload automatico per sessioni/gruppi conclusi, manuale per modifiche senza confine prevedibile; download su richiesta. Coda e reinvii secondo 012–013.
- Dettagli estetici e implementativi ordinari sono delegati all’AI. “Completata” nell’indice significa specifica risolta, non software già pronto.

- Scelte 015–017 consolidate: account email/password, Android/Chrome, GitHub Pages per la PWA, schede create da AI/script sul computer. Non riaprire queste scelte in F0.

## Traguardi

**A — Prima versione utilizzabile:** generare e caricare una scheda, scaricarla sul telefono, eseguirla offline, registrare e riprendere i risultati, sincronizzarli e ritrovarli in un elenco storico. Include valori originali/correnti, attrezzatura, rotazione e gestione degli errori necessari al ciclo. Si raggiunge dopo F5.

**B — Prima versione completa rispetto alle specifiche approvate:** aggiungere calendario, grafici e collegamenti video con le interazioni previste, completare verifica sul telefono e istruzioni d’uso. Si raggiunge dopo F6. Queste funzioni restano richieste: il traguardo A è una consegna anticipata, non una cancellazione di requisiti.

## Come collabora l’AI con l’utente

- L’AI sceglie il prossimo passo, prepara file e comandi, esegue sviluppo e verifiche e mantiene questo piano aggiornato.
- L’utente gestisce account, login, credenziali, scelte personali, pochi passaggi nelle console e prove sul proprio telefono: sono operazioni per cui l’intervento umano evita lunghe automazioni dell’interfaccia.
- Non chiedere all’utente di scrivere SQL, correggere codice o interpretare log. Fornire un file pronto da eseguire o pochi passaggi precisi.
- Ogni richiesta umana indica obiettivo, passaggi brevi, risultato atteso e cosa riportare: per esempio “progetto pronto” oppure il testo dell’errore, senza segreti.
- Raggruppare le richieste pertinenti; non chiedere conferma per ogni file. Se l’utente ha già autorizzato un’operazione, non richiedere la stessa autorizzazione.
- Mentre una configurazione umana è pendente, proseguire sul lavoro indipendente. Non dichiarare verificata una fase cloud sulla sola base dei test con dati simulati.
- Usare strumenti diretti o comandi per attività ripetitive. Evitare lunghe esplorazioni automatizzate delle console quando un passaggio umano è più semplice.
- A fine fase mostrare cosa è ora utilizzabile e il prossimo passo; annotare prove e limiti nella tabella di avanzamento.

## F0 — Avvio e verifica dei prerequisiti

**AI:** verificare file, eventuale stato Git e strumenti già disponibili. Le scelte 015–017 sono risolte: non riproporle come domande. Verificare soltanto disponibilità degli account e prerequisiti tecnici. Android/Chrome è il dispositivo di riferimento; GitHub Pages è la destinazione scelta secondo la motivazione della 016.

**Umano:** segnalare se possiede già account Supabase e GitHub, quando l’AI lo richiede. Non inviare password o chiavi riservate in chat.

**Esito:** registrare ambiente disponibile e configurazioni da eseguire; iniziare F1 senza attendere il completamento delle configurazioni cloud.

## F1 — Fondazioni locali e contratto dei dati

**AI:** predisporre il progetto Vue/Vite e la struttura modulare 018; configurare esclusioni dei segreti e dei dati personali; scrivere le migrazioni SQL riproducibili, lo schema JSON e dati fittizi per le cinque categorie. Preparare le funzioni di salvataggio transazionale e le regole di proprietà. Fissare un contratto comune per script e app.

**Umano:** nessun intervento ordinario. Solo eventuali installazioni o autorizzazioni di sistema richieste dall’ambiente, spiegate dall’AI.

**Verifica per proseguire:** il progetto si avvia e produce una build; esempi validi/invalidi sono riconosciuti; lo schema rispetta la 011 semplificata. Eseguire i controlli SQL in un ambiente locale disponibile, oppure indicare esplicitamente che verranno eseguiti in F2. Non installare infrastruttura locale pesante solo per rinviare una prova semplice sul progetto di sviluppo.

**Perché iniziare qui:** definire prima i dati evita divergenze tra app e script, ma lo scheletro dell’interfaccia permette subito verifiche concrete. Non costruire un’intera infrastruttura remota prima di avere file riproducibili.

## F2 — Database e accesso reali

**AI:** preparare un pacchetto di configurazione preciso: migrazioni ordinate, impostazioni di autenticazione, modelli di configurazione locale e controlli diagnostici. Se gli strumenti autorizzati permettono di applicarlo direttamente, usarli; altrimenti dare all’utente i file pronti per la console SQL.

**Umano:** creare/selezionare il progetto Supabase Free, custodire le credenziali, predisporre l’account personale secondo la 015 e inserire localmente i valori indicati. Se necessario, eseguire il file SQL fornito e riportare l’esito. Prima di applicare migrazioni l’AI deve accertare che il progetto di destinazione sia quello previsto e se contenga dati preesistenti.

**Verifica per proseguire:** login dall’app/script; migrazioni applicate e registrate; lettura/scrittura dei dati propri consentita e accesso non autorizzato negato; vincoli e rollback di un gruppo non valido; riconoscimento di un invio ripetuto. Credenziali amministrative assenti dal codice distribuito.

**Se il cloud non è pronto:** continuare con le schermate e i dati fittizi di F4; F2 rimane non verificata.

## F3 — Percorso AI → scheda → database

**AI:** realizzare lo script Python per esportare il contesto, validare e caricare JSON, con errori leggibili e reinvii senza duplicati. Creare la skill usando i comandi reali e gli schemi del progetto. Provare il flusso su catalogo vuoto e su catalogo già popolato.

**Umano:** effettuare l’accesso locale quando richiesto. Per la prima scheda personale, fornire in conversazione obiettivi, attrezzatura e contesto; fino a quel momento l’AI usa dati fittizi. Nessuna compilazione manuale del JSON.

**Verifica per proseguire:** scheda caricata con tutte le relazioni; rifiuto di input errati senza scritture parziali; secondo invio senza duplicazioni; contesto esportato riutilizzabile dall’assistente.

**Riferimento:** applicare la 017 approvata: le revisioni strutturali diventano nuove schede, il catalogo viene riutilizzato.

## F4 — Allenamento sul telefono e persistenza locale

**AI:** implementare scelta scheda/allenamento, rotazione, schermata esercizio, precompilazione/conferma, stato e durata, valori iniziali/correnti, inventario e storico in elenco. IndexedDB salva ogni avanzamento utile; riprendere una sessione dopo la chiusura. Preparare la PWA e un’interfaccia iniziale sobria.

**Umano:** breve prova di leggibilità e comodità quando l’AI dispone di una versione apribile; segnalare problemi concreti. Non serve approvare preventivamente ogni schermata.

**Verifica per proseguire:** cinque categorie gestite, bozze escluse dai risultati, ripresa senza perdita di dati, passaggio al giorno successivo e sessioni incomplete coerenti con la 005, sostituzione di una voce senza alterare lo storico.

## F5 — Sincronizzazione completa e prima consegna utilizzabile

**AI:** collegare dati reali e coda locale, download esplicito, gruppi automatici e manuali, revisione/conflitti, invii ripetibili e scadenza dell’accesso. Preparare la build pubblicabile e la procedura di distribuzione per l’hosting scelto nella 016.

**Umano:** creare/selezionare la destinazione di pubblicazione ed eseguire gli eventuali pochi passaggi di console indicati; installare/aprire l’app sul telefono e seguire una prova guidata. La scelta di distribuzione è consolidata nella 016: pubblicare solo gli artefatti previsti, non automaticamente tutto il workspace.

**Prova di accettazione A, guidata dall’AI:**

1. Caricare una scheda e scaricarla manualmente.
2. Disconnettere la rete, avviare una sessione, confermare un esercizio, chiudere e riaprire.
3. Terminare la sessione offline; verificare che l’invio risulti pendente.
4. Tornare online con app attiva: sessione inviata una sola volta.
5. Verificare che modifiche estranee in attesa manuale non siano state inviate automaticamente.
6. Sincronizzare manualmente e verificare recupero dello storico remoto, inclusa una sessione incompleta.

**AI verifica inoltre:** conflitto con aggiornamento remoto, errore a metà gruppo, risposta persa dopo un salvataggio riuscito e accesso scaduto. L’utente non deve simulare manualmente tutti gli errori tecnici.

**Esito:** traguardo A raggiunto solo con prova effettiva del ciclo completo. Distinguere prove automatizzate, prove nel browser e prova effettuata dall’utente sul telefono.

## F6 — Consultazione completa e stabilizzazione

**AI:** completare calendario 001, grafici 002, video 006 e storico durate 005; correggere i problemi emersi nell’uso. Verificare aggiornamento dell’app senza cancellare la coda; preparare istruzioni brevi per aggiornare, sincronizzare, creare una scheda ed esportare i propri dati. L’esportabilità è già un vincolo di progetto: usare un formato strutturato, senza costruire un sistema separato di backup complesso.

**Umano:** usare l’app durante un allenamento reale, controllare i dati salvati e segnalare gli ostacoli principali. Eseguire soltanto le verifiche sul dispositivo che l’AI non può riprodurre.

**Verifica per concludere:** requisiti approvati coperti, calendario e grafici coerenti con i risultati, link video riutilizzato tra schede, aggiornamento senza perdita locale. Lo script esporta dati leggibili e la procedura di ripristino dell’ambiente è documentata. Tutti i limiti residui sono espliciti.

**Esito:** traguardo B. Non trasformare la stabilizzazione in una riprogettazione del prodotto.

## Stato di esecuzione — mantenere aggiornato

| Fase | Stato | Evidenze / risultato | Prossima azione umana |
| --- | --- | --- | --- |
| Preparazione documentale | completata | Specifiche e piano aggiornati il 29/10/2026; sviluppo ora autorizzato | Nessuna |
| F0 | completata | Verificati Node 22.14, npm 11.5.1, Python 3.14.4, PostgreSQL 18. Dal 07/11/2026 il repository GitHub pubblico contiene il progetto completo; segreti, dati personali, build e temporanei restano esclusi. Nell’ambiente Codex locale `.git` è un mount vuoto: per la pubblicazione è stata usata una directory Git separata | Nessuna |
| F1 | completata | Vue/Vite: build riuscita; contratto v1, esempi 5 categorie, validazione/conversione Python; migrazione 202610290001 e RPC atomica. Passano npm test e test SQL su PostgreSQL 18 single-user: rollback, reinvii, conflitti, proprietà RPC e risultati. RLS disabilitata da questa modalità, poi verificata nel cloud in F2. IndexedDB integrato e verificato nel browser in F4. npm ci riproducibile. Avvio preview poi riuscito con autorizzazione di rete locale; verifica interattiva completata in F4 | Nessuna per i file locali |
| F2 | completata | MCP OAuth verificato sul progetto previsto e vuoto. Due pacchetti cloud registrati; dieci tabelle con RLS; permessi interni corretti. Account personale creato. Test SQL reali: isolamento, rollback, conflitti e reinvii riusciti, dati prova annullati. Configurazione pubblicabile locale pronta. Login, refresh e lettura API personali riusciti (output utente). Controllo live Auth: disable_signup=true; nuove iscrizioni chiuse | Nessuna |
| F3 | completata | CLI export/prepare/upload, diario privato ripetibile e skill di progetto; due suite JS e 14 test Python superati. Test cloud reale con 2 schede, 5 categorie, riuso catalogo, associazioni, risposta persa dopo commit, reinvii e rollback; export verificato. Tutti i dati fittizi creati sono stati rimossi, conteggi iniziali ripristinati | Prima scheda personale ora caricata: Sincronizza dal telefono |
| F4 | implementata e verificata localmente | Demo separata, cinque categorie, sessioni/bozze/conferma/salto, ripresa, rotazione, inventario, piano corrente e storico. IndexedDB e coda atomici; blocco scritture da finestra obsoleta. Manifest/icone/service worker. npm test: 3 suite JS (8 casi sessione) e 14 Python; build riuscita. Browser a 390×844; Chrome con server spento, ricarica e chiusura/riapertura con risultato conservato. Nessun invio cloud o test Android fisico | Breve prova di leggibilità della demo; prova sul telefono con F5 |
| F5 | implementata e pubblicata; collaudo principale Android confermato | Login app, archivi per owner, invii automatici/manuali, payload congelati, ricevute/versioni/dipendenze atomiche, confronto e scelta conflitti, download esplicito. Repository pubblico con sorgenti, migrazioni, test, specifiche e guida completa; Pages distribuisce solo la build tramite GitHub Actions. CLI configurabile per progetti Supabase distinti. Segreti e dati personali esclusi. Nessun test UI F5 dell’assistente | Utente: esito positivo del percorso principale; cloud: una sessione conclusa senza duplicati, 5 risultati (4 confermati). Fixture disattivata. Premere Sincronizza per pulizia locale; recupero sessione incompleta su altro dispositivo e installazione separata ancora non attestati |
| F6 | 0.6.0 pubblicata (run success); rifiniture 0.6.1 inviate e in coda; tutti i fix richiesti implementati; prima scheda personale caricata; migrazione cloud verificata, collaudo telefono pendente | Versione 0.2.0: calendario, grafici interattivi con scale dichiarate, durate confrontabili e video condiviso; demo con storico sintetico. 26 JS e 14 Python superati; build riuscita. Service worker generato eseguito in runtime isolato: cache aggiornata senza toccare IndexedDB; nessun test UI F6 dell’assistente. README con uso/export/ripristino | Aggiornare alla 0.6.0 e collaudare timer/sequenza/riduzione, attrezzatura e Prossima volta secondo README; scaricare la scheda personale con Sincronizza; restano calendario/grafici/video e aggiornamento con coda. Poi uso reale e verifiche residue F5. Traguardo B non concluso |

Gli stati delle fasi sono separati dagli stati delle specifiche. Prima di chiudere ogni chat di sviluppo aggiornare questa tabella con file prodotti, verifiche realmente eseguite, eventuali blocchi e prossimo passo preciso. Non registrare credenziali o ogni tentativo intermedio. Se lo stato reale diverge dal documento, verificarlo e correggere il registro.

04/11/2026 — Rifiniture 0.6.1: riquadro attrezzatura nascosto se vuoto; prossimo esercizio più evidente nel timer, con attrezzi attivi e carico della voce di sessione tra parentesi (zero/nullo omessi), anche nella barra ridotta. Build e 8 casi timer mirati superati, nessun test browser. Commit artefatti `0c1992832885fbcd5311668a751ae1839f0a670c`, run `41877574815` ancora queued al controllo HTTP (nuovi asset non disponibili). La precedente 0.6.0 ha invece concluso con successo il run `41864725745`; le distribuzioni intermedie risultano ora cancelled da GitHub. Prossima azione umana: quando compare 0.6.1 nel Menu, verificare esercizio senza attrezzi e recupero prima di un esercizio con carico.

07/11/2026 — Condivisione del progetto: il repository pubblico passa dagli artefatti statici al progetto completo condivisibile. README riscritto come guida a demo, installazione, Supabase, CLI, uso, test e deploy. La CLI accetta l’URL del progetto dell’utente invece di essere vincolata a quello originario; setup SQL reso generico. GitHub Pages viene compilato da `main` con GitHub Actions e pubblica soltanto `app/dist`. Restano esclusi `private/`, `.env*`, build, dipendenze e temporanei. Nessuna licenza open source scelta: questa limitazione è esplicita nel README.

## Primo messaggio sufficiente nella nuova chat

“Leggi AGENTS.md e project_knowledge/piano_prima_versione.md e avvia il piano dalla prima fase non completata. Conduci tu il lavoro e indicami soltanto le azioni per cui serve il mio intervento.”
