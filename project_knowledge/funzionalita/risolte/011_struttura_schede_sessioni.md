# 011 — Struttura SQL di schede, allenamenti e sessioni

- Stato: completata
- Priorità: P1
- Ultima revisione: 10/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e base tecnica

Usare un database SQL PostgreSQL su Supabase, come assunto dall’utente. Questo documento descrive lo schema approvato delle tabelle; non è una migrazione eseguita.

Una **scheda** è un programma con uno o più **allenamenti** ordinati. Una **sessione** è una singola esecuzione di un allenamento. Il completamento della sessione attiva l’upload automatico previsto dalla specifica 012.

## Convenzioni comuni

Tutte le nove tabelle applicative descritte sotto appartengono allo schema `public` e includono queste colonne, oltre a quelle elencate per ciascuna tabella:

| Colonna | Tipo SQL | Obbligatoria / vincolo | Significato |
| --- | --- | --- | --- |
| id | uuid | PK, non NULL | ID stabile, generabile anche offline |
| user_id | uuid | FK → auth.users(id), non NULL | Proprietario dei dati |
| created_at | timestamptz | non NULL | Creazione del record |
| updated_at | timestamptz | non NULL | Ultima modifica confermata dal server |
| row_version | bigint | non NULL, default 1, > 0 | Versione incrementata dal server per rilevare conflitti |
| deleted_at | timestamptz | NULL consentito | Segnale di eliminazione sincronizzabile |

PK = chiave primaria, FK = chiave esterna. “NULL” significa valore assente. Tutti i campi sono obbligatori salvo quelli indicati come facoltativi.

Ogni tabella espone anche un vincolo UNIQUE(user_id, id). I collegamenti tra tabelle applicative usano FK composte (user_id, riferimento) → (user_id, id), così non possono collegare dati di proprietari diversi.

Le eliminazioni ordinarie sono logiche tramite deleted_at. Le FK tra dati applicativi usano RESTRICT per le cancellazioni fisiche: eliminare un piano non deve cancellare lo storico. Le relazioni verso auth.users usano il comportamento di cancellazione definito nella futura migrazione di gestione account.

## 1. strumenti

Catalogo personale degli strumenti disponibili o utilizzabili.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| nome | text | Non vuoto; nome dello strumento |
| note | text | Non NULL, default stringa vuota; testo libero su carichi, luogo e vincoli pratici |

Unicità del nome normalizzato (minuscole e spazi esterni rimossi) per utente tra record non eliminati. Il catalogo può contenere strumenti non posseduti.

## 2. esercizi

Catalogo riutilizzabile in tutte le schede.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| nome | text | Non vuoto |
| istruzioni | text | Non NULL, default stringa vuota |
| categoria | text | CHECK sui cinque codici sotto |
| convenzione_carico | text | Facoltativa; totale oppure per_attrezzo, obbligatoria nelle categorie con carico |
| convenzione_ripetizioni | text | Facoltativa; totali oppure per_lato, obbligatoria nelle categorie con ripetizioni |
| video_url | text | Facoltativa; collegamento inserito dall’utente |

Categorie approvate nella 010: `ripetizioni`, `ripetizioni_carico`, `durata`, `durata_carico`, `distanza_durata`.

Il video è salvato solo nel catalogo: aggiornarlo lo rende disponibile in tutte le schede. Categoria e convenzioni restano immutabili dopo l’utilizzo in una scheda: 10 kg per attrezzo non devono diventare retroattivamente 10 kg totali. Un diverso significato delle misure richiede un nuovo ID; aumentare il carico, correggere un nome o aggiornare il video non crea una variante.

## 3. esercizi_strumenti

Relazione molti-a-molti tra esercizi e strumenti.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| esercizio_id | uuid | FK → esercizi |
| strumento_id | uuid | FK → strumenti |
| ruolo | text | CHECK: necessario oppure utile |

UNIQUE(user_id, esercizio_id, strumento_id), anche per record eliminati: per ripristinare un’associazione si riattiva lo stesso record. L’AI la definisce alla creazione dell’esercizio e la riusa.

## 4. attrezzatura_disponibile

Inventario personale: la presenza di una riga attiva indica che lo strumento è disponibile.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| strumento_id | uuid | FK → strumenti |

UNIQUE(user_id, strumento_id). Nessuna colonna per parco, casa, rumore o altre eccezioni: queste si discutono in chat.

## 5. schede

Il programma di allenamento.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| nome | text | Non vuoto |
| note | text | Non NULL, default stringa vuota |
| revisione | integer | Default 1, > 0; revisione dell’intero piano |

Quando cambia il contenuto della scheda, l’ordine degli allenamenti o una prescrizione, incrementare revisione nella stessa transazione. row_version serve invece al controllo tecnico dei conflitti sulla singola riga.

Non conservare tutte le versioni storiche del piano. Le sessioni mantengono le voci eseguite, il loro ordine e i risultati; non conservano un insieme separato di valori previsti. La revisione è un riferimento e non permette di ricostruire integralmente il vecchio piano.

## 6. allenamenti

I singoli allenamenti ordinati all’interno della scheda.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| scheda_id | uuid | FK → schede |
| nome | text | Non vuoto, per esempio Allenamento A |
| posizione | integer | > 0 |
| note | text | Non NULL, default stringa vuota |

Unicità (user_id, scheda_id, posizione) tra record attivi. La rotazione della specifica 003 usa posizione e l’ultima sessione conclusa; non occorre una tabella aggiuntiva.

## 7. esercizi_allenamento

Una riga rappresenta un’occorrenza di un esercizio nel piano: lo stesso esercizio può comparire più volte.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| allenamento_id | uuid | FK → allenamenti |
| esercizio_id | uuid | FK → esercizi |
| posizione | integer | > 0 |
| note | text | Non NULL, default stringa vuota |
| ai_serie | integer | Facoltativo secondo categoria; > 0; proposta iniziale |
| ai_ripetizioni | integer | Facoltativo secondo categoria; > 0, per serie |
| ai_carico_kg | numeric(10,3) | Facoltativo secondo categoria; ≥ 0 |
| ai_durata_secondi | integer | Facoltativo secondo categoria; > 0 |
| ai_distanza_metri | numeric(12,3) | Facoltativo secondo categoria; > 0 |
| corrente_serie | integer | Facoltativo secondo categoria; > 0; impostazione modificabile |
| corrente_ripetizioni | integer | Facoltativo secondo categoria; > 0, per serie |
| corrente_carico_kg | numeric(10,3) | Facoltativo secondo categoria; ≥ 0 |
| corrente_durata_secondi | integer | Facoltativo secondo categoria; > 0 |
| corrente_distanza_metri | numeric(12,3) | Facoltativo secondo categoria; > 0 |

Sono dieci colonne distinte: cinque con prefisso ai_ e cinque con prefisso corrente_. Non sono valori JSON. I valori ai_ vengono fissati alla creazione della voce; quelli corrente_ iniziano uguali e possono essere modificati.

Unicità (user_id, allenamento_id, posizione) tra record attivi.

Dopo la creazione, esercizio_id e allenamento_id sono riferimenti stabili. Per sostituire un esercizio o trasferire una voce a un altro allenamento si crea una nuova riga e si disattiva la precedente con deleted_at. Questa regola applicata da subito protegge anche le sessioni iniziate offline e non ancora sincronizzate. I risultati passati continuano a risalire alla vecchia riga, comprese quelle disattivate. Serie, ripetizioni, carico e altri valori correnti possono invece cambiare senza modificare i risultati registrati.

## 8. sessioni

Una riga per ogni allenamento avviato, anche se non viene terminato.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| allenamento_id | uuid | FK → allenamenti |
| scheda_revisione | integer | > 0; revisione alla partenza |
| scheda_nome_snapshot | text | Nome della scheda alla partenza |
| allenamento_nome_snapshot | text | Nome dell’allenamento alla partenza |
| iniziata_at | timestamptz | Data e ora effettive di avvio |
| terminata_at | timestamptz | Facoltativa; se presente ≥ iniziata_at |
| fuso_orario | text | Nome IANA, per esempio Europe/Rome |

Stato, durata e percentuale non sono colonne duplicate:
- terminata_at presente → conclusa; durata = fine − inizio;
- senza fine e nello stesso giorno locale dell’avvio → in corso;
- senza fine dal giorno successivo → incompleta;
- percentuale = esercizi completati / esercizi previsti nella sessione.

Per la prima versione un allenamento deve avere almeno un esercizio prima di poter essere avviato.

## 9. esercizi_sessione

All’avvio creare una riga per ogni esercizio previsto e precompilare i campi effettivo_ con i valori correnti del piano. Finché stato non è completato, questi valori sono una bozza e non entrano nei grafici. L’utente può correggerli e confermarli; non conserviamo un secondo gruppo previsto_.

L’esercizio si ricava tramite esercizio_allenamento_id → esercizi_allenamento.esercizio_id. Non duplicare questo ID né nome, istruzioni, note, categoria o convenzioni. Il dettaglio mostra i testi correnti, senza ricostruire quelli letti quel giorno.

| Colonna specifica | Tipo | Vincoli / significato |
| --- | --- | --- |
| sessione_id | uuid | FK → sessioni |
| esercizio_allenamento_id | uuid | FK → esercizi_allenamento; voce da cui deriva |
| posizione | integer | > 0 |
| stato | text | CHECK: da_eseguire, completato, saltato; default da_eseguire |
| completato_at | timestamptz | Obbligatorio solo quando stato = completato |
| effettivo_serie | integer | Facoltativo secondo categoria; > 0; riepilogo registrato |
| effettivo_ripetizioni | integer | Facoltativo secondo categoria; > 0, per serie |
| effettivo_carico_kg | numeric(10,3) | Facoltativo secondo categoria; ≥ 0 |
| effettivo_durata_secondi | integer | Facoltativo secondo categoria; > 0 |
| effettivo_distanza_metri | numeric(12,3) | Facoltativo secondo categoria; > 0 |

UNIQUE(user_id, sessione_id, posizione) e UNIQUE(user_id, sessione_id, esercizio_allenamento_id). Controllare che la voce di piano appartenga all’allenamento della sessione. La posizione resta quella copiata all’avvio; un riordino successivo del piano non cambia la sessione.

La durata è per serie nelle categorie durata/durata_carico e totale nella categoria distanza_durata. Il significato è fissato dalla categoria e dalla convenzione immutabili del catalogo.

## Campi richiesti per categoria

Queste regole valgono per ciascun gruppo ai_, corrente_ ed effettivo_:

| Categoria | Colonne valorizzate (senza prefisso) | Altre colonne del gruppo |
| --- | --- | --- |
| ripetizioni | serie, ripetizioni | NULL |
| ripetizioni_carico | serie, ripetizioni, carico_kg | NULL |
| durata | serie, durata_secondi | NULL |
| durata_carico | serie, durata_secondi, carico_kg | NULL |
| distanza_durata | distanza_metri, durata_secondi | NULL |

Per risultati non ancora completati sono ammessi valori parziali; passando a completato devono essere presenti tutti i campi richiesti. Un esercizio saltato ha i valori effettivi NULL. Ai fini del conteggio, saltato non equivale a completato.

Le regole sulla categoria collegata e sulla coerenza tra tabelle si applicano con trigger o funzioni di scrittura; i CHECK semplici verificano positività e valori ammessi. Il JSON viene validato anche prima del caricamento.

## Tabella tecnica: operazioni_sync

Serve solo a riconoscere un invio già completato quando si ritenta dopo un errore di rete. Non contiene il profilo dell’utente.

| Colonna | Tipo | Vincoli / significato |
| --- | --- | --- |
| user_id | uuid | FK → auth.users(id), parte della PK |
| operation_id | uuid | Altra parte della PK; assegnato al gruppo prima dell’invio |
| payload_hash | text | Impronta del contenuto per impedire riuso dell’ID con dati diversi |
| risultato | jsonb | ID e versioni confermate, per restituire lo stesso esito |
| applicata_at | timestamptz | Ora del salvataggio server |

Le modifiche del gruppo e la ricevuta vengono salvate nella stessa transazione. Questa tabella non usa le colonne comuni delle nove tabelle applicative. La coda delle modifiche ancora da inviare è locale sul telefono.

## Scritture e protezione dello storico

- Caricare una nuova scheda con allenamenti ed esercizi in una transazione.
- Creare sessione e righe precompilate degli esercizi insieme nel salvataggio locale; inviarle insieme quando necessario.
- Concludere una sessione salvando fine e risultati localmente, quindi inviare automaticamente il gruppo completo.
- Aggiornare con confronto della row_version attesa e incremento server; un conflitto annulla il gruppo interessato.
- Le modifiche al piano usano anche la revisione della scheda per evitare modifiche concorrenti incoerenti su più tabelle.
- Se il server conferma un invio ma sono già presenti nuove modifiche locali, eliminare dalla coda solo la versione confermata.
- Le nuove impostazioni di un piano non riscrivono i valori già precompilati in una sessione né i risultati passati. Nessun confronto storico tra previsto ed effettivo: ai_ e corrente_ restano nel piano.
- Video e strumenti si leggono dal catalogo corrente; non ne viene ricostruita una cronologia.

## Accesso in Supabase

Supabase Auth identifica il proprietario tramite auth.users(id); non occorre una tabella profiles con dati personali. Abilitare Row Level Security e permessi appropriati sulle tabelle esposte, limitando l’accesso ai dati del proprietario. Anche le funzioni di salvataggio devono applicare questi controlli. Nessuna chiave amministrativa nel telefono.

Queste convenzioni si basano sulla documentazione ufficiale di [Supabase Auth](https://supabase.com/docs/guides/auth/managing-user-data) e [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Il metodo concreto di accesso dell’app e dello script AI sarà definito nell’implementazione.

Supabase Auth gestisce il login e assegna l’ID dell’account. user_id collega ogni record al proprietario. I permessi consentono determinate operazioni sulle tabelle; la Row Level Security limita tali operazioni alle righe dell’utente autenticato. La chiave pubblicabile dell’app non sostituisce il login; una chiave amministrativa aggira questi limiti e non va distribuita al telefono. Non serve una tabella profiles perché non raccogliamo un profilo personale aggiuntivo.

Indicizzare le FK e user_id; in particolare sessioni(user_id, iniziata_at), esercizi_allenamento(user_id, esercizio_id) ed esercizi_sessione(user_id, esercizio_allenamento_id). Lo storico usa una join, includendo le voci di piano disattivate.

## Questioni importanti aperte

Nessuna sul modello dati. Le scelte operative per il primo rilascio sono censite nell’indice.

## Esito e dettagli delegati

Supabase/PostgreSQL è la base concordata per la progettazione. Lo schema, con le semplificazioni approvate il 29/10/2026, è risolto. Nomi definitivi di vincoli, indici e funzioni sono dettagli delegati all’assistente.

## Registro delle decisioni

- 28/10/2026: proposta iniziale formulata come T2 e trasferita nella specifica 011.
- 28/10/2026: su richiesta dell’utente, riscritta come schema SQL esplicito per Supabase e allineata alle specifiche 010, 012, 013 e 014 approvate.


- 29/10/2026: approvato lo schema semplificato: rimosse le 12 colonne ridondanti o non necessarie da esercizi_sessione; valori di sessione precompilati e confermati, senza storico previsto/effettivo. Consolidata la sostituzione delle voci di piano tramite nuova riga e disattivazione della precedente.


## Estensione recuperi approvata il 01/11/2026

La [019](019_contatore_serie_e_recuperi.md) aggiunge a esercizi_allenamento quattro colonne integer nullable con CHECK >= 0: ai_recupero_serie_secondi, ai_recupero_esercizio_secondi, corrente_recupero_serie_secondi, corrente_recupero_esercizio_secondi. 0 disattiva, NULL preserva le righe precedenti non impostate. I valori AI iniziano uguali ai correnti e rimangono immutabili; solo i due correnti sono modificabili con revisione del piano. Nessun counter, scadenza o dato per singola serie in tabelle remote o esercizi_sessione. Migrazione locale `20261101124720_recuperi_esercizi.sql`; applicazione cloud registrata nel piano, non implicata da questa specifica.

## Riscaldamenti — 02/11/2026

La [020](020_riscaldamenti_riutilizzabili.md) estende allenamenti con tipo (allenamento/riscaldamento, default allenamento) e riscaldamento_id facoltativo, FK composta su proprietario/scheda/blocco e controllo tipo senza catene. Voci dei blocchi nella stessa esercizi_allenamento; ogni sessione principale produce risultati specifici per riscaldamento e parte principale, senza copie delle misure previste. Sessioni autonome di riscaldamento vietate. Annullamento [021](021_impostazioni_e_navigazione_esecuzione.md) tramite tombstone; preferenze e avanzamento di navigazione solo locali.

## Proposta futura — 04/11/2026

Colonna nullable `proposta_futura jsonb` sulla voce stabile del piano, validata dal trigger e dall’helper privato `valida_proposta_futura`. Conserva misure proposte e base, flag, identità proposta e sessioni origine/rinvio. Nessuna duplicazione di risultati e nessun dato temporale di singole serie remoto. Modifiche manuali con revisione e conflitti ordinari; 022 per ambito e azioni. Cinque migrazioni nel registro dopo 20261104155916.
