# 019 — Contatore locale delle serie e recuperi

- Stato: completata
- Priorità: P1
- Significato: definizione approvata; lo stato di implementazione e delle prove è nel piano.
- Ultima revisione: 01/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Requisiti consolidati

L’utente ha approvato la proposta il 01/11/2026, richiedendo UX e stile di alto livello, uso adattivo dello spazio e configurazione dei tempi nel menu ⋯.

### Label e disposizione

Campi con label evidenti, icona e colore coerenti per misura: verde Serie, blu Ripetizioni, viola Carico, ambra Durata, turchese Distanza. Il colore non sostituisce il testo. Serie sempre a sinistra, ripetizioni o durata per serie a destra; carico sotto. Distanza e durata totale affiancate senza contatore. Numero grande, unità separata. Adattare spazi e dimensioni a categoria e altezza dello schermo; non riempire lo spazio con testo accessorio o elementi decorativi inutili.

### Recuperi nel piano

Due tempi indipendenti, eventualmente uguali: tra serie e dopo esercizio. Sono proprietà della voce stabile di piano, non del catalogo globale: originale AI e valore corrente separati, come per le altre misure. Secondi interi non negativi; 0 disattiva. Nessuna duplicazione in esercizi_sessione. Originale AI immutabile; modifica corrente con revisione scheda e coda manuale.

L’AI indica entrambi nel contratto v2 (`recuperi.tra_serie_secondi`, `recuperi.dopo_esercizio_secondi`). Attività senza serie: tra_serie_secondi=0. I file v1 precedenti e i relativi payload restano riutilizzabili senza rigenerarli. Non attribuire valori personali arbitrari alle vecchie righe. L’utente riferisce che non esistono ancora schede personali; le demo usano soltanto tempi brevi dichiaratamente fittizi (10 e 15 secondi).

Nell’esecuzione non mostrare una riga permanente con i due tempi. Menu ⋯ → Modifica timer apre una modale; accetta mm:ss o secondi, Salva/Annulla. La modifica vale per i prossimi recuperi; un countdown già avviato conserva la scadenza. Il suggerimento originale AI comprende anche i recuperi.

### Contatore locale

Per ogni esercizio con serie, indicare X/N e Serie fatta. Ogni pressione aumenta X e avvia il recupero tra serie; sull’ultima serie avvia quello dopo esercizio, salvo l’ultimo esercizio della sessione. Durante un recupero attivo non permettere un’altra serie senza attendere o saltare il recupero. Annulla ultima serie corregge il conteggio e annulla il timer avviato da quell’azione se ancora presente. Non superare il numero di serie indicato.

Contatore e countdown sono solo locali, persistenti in IndexedDB per sessione/esercizio, separati dalle righe funzionali e dalla coda: non inviarli a Supabase. La chiusura/riapertura deve ripristinarli. Il contatore è facoltativo e non cambia silenziosamente il numero di serie. Le serie intermedie non convalidano il risultato complessivo; dal 04/11/2026, segnare l’ultima serie equivale invece alla conferma Completato e avanza al successivo, mantenendo il recupero tra esercizi. Completato rimane la conferma alternativa: se è stato usato il contatore e i due numeri differiscono, mostrare la differenza e chiedere quale valore confermare.

### Timer e navigazione

Un solo recupero visibile per volta. Scadenza assoluta, non decrementi affidati alla permanenza della pagina. Il recupero dopo esercizio continua sul successivo senza ripartire; la conferma dell’esercizio non riavvia un recupero già partito dalla sua ultima serie. Se il contatore non è usato, Completato può avviare il recupero dopo esercizio.

Salta esercizio interrompe il timer relativo alla sorgente o alla destinazione saltata. La conclusione della sessione interrompe ogni suo recupero. Nessun recupero dopo l’ultimo esercizio; con una sola serie si passa direttamente al recupero dopo esercizio. Distanza/durata non hanno contatore. Il cronometro globale rimane indipendente.

Alla scadenza mostrare Recupero terminato nella schermata rossa con tempo extra e Riprendi allenamento, senza avvio o convalida automatici. La schermata piena verde/rossa è definita nella 021. Salta recupero permette di proseguire prima. Non garantire notifiche, suoni o esecuzione in background con app chiusa o telefono bloccato.

## Esito

Specifiche approvate, nessuna decisione sostanziale aperta. La modifica non introduce un dettaglio remoto delle singole serie né nuove statistiche.

## Registro delle decisioni

- 01/11/2026: approvati due recuperi persistenti, counter solo locale e distinzione dalla convalida finale; preferita configurazione nel menu e visualizzazione del solo timer in esecuzione.

## Estensione 02/11/2026

La [021](021_impostazioni_e_navigazione_esecuzione.md) aggiunge un segnale sonoro facoltativo a fine recupero e le impostazioni locali. Resta senza garanzie in background o a schermo bloccato. Il contatore è bloccato nelle anteprime degli esercizi non ancora iniziati; le correzioni ai precedenti non riavviano il recupero corrente.

## Revisione implementata 04/11/2026

Ultima serie confermata con valori effettivi validati e avanzamento atomico; il recupero rimane visibile prima della ripresa sul successivo. Sull’ultimo esercizio la sessione si conclude senza recupero finale. Per una sola serie niente contatore ridondante: Completato o timer di lavoro. I timer di durata permettono preparazione e sequenza automatica esplicita, con regole nella 021.
