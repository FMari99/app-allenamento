# 012 — Dati sul telefono e nel database

- Stato: completata
- Priorità: P1
- Ultima revisione: 10/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Requisiti consolidati

Decisioni approvate dall’utente.

**Decisione dell’utente:** tutti i dati di allenamento devono poter essere caricati online; nessun dato funzionale è pensato per restare esclusivamente sul telefono.

Comportamento concordato:

- Sul telefono conservare schede scaricate, cataloghi necessari, attrezzatura, impostazioni correnti, sessioni e risultati, così da lavorare offline.
- Sincronizzare gli stessi dati nel database, inclusi video associati, sessioni incomplete e modifiche all’attrezzatura.
- Conservare localmente una coda delle modifiche non ancora inviate; eliminarle dalla coda solo dopo conferma del salvataggio remoto.
- Indicatori di invio, cache e stato temporaneo dell’interfaccia sono dettagli tecnici locali, non dati di allenamento da esportare.
- Calcolare grafici, percentuali e durate dai dati salvati, evitando copie derivate incoerenti.
- Per iniziare scaricare lo storico personale completo; introdurre filtri temporali solo se il volume lo richiede.

## Quando inviare i dati

- Salvare subito sul telefono; inviare automaticamente al termine di un’intera sessione di allenamento, insieme a tutti i risultati della sessione.
- Nel modello attuale la scheda può contenere più allenamenti: qui “intera scheda eseguita” indica la sessione del giorno conclusa, non l’esaurimento dell’intero programma su più giorni.
- Automatizzare l’invio quando l’operazione ha un confine noto: per esempio conferma finale di una modifica multipla dell’attrezzatura. Il gruppo da inviare deve essere esplicito.
- Attrezzatura (10/11/2026): Salva nome/note, aggiunta, eliminazione confermata e singolo cambio checkbox concludono ciascuno un gruppo automatico. Nessun invio delle bozze di una modale.
- Ribadito il 10/11/2026: ogni allenamento concluso deve avviare l’invio automatico della sessione e di tutti i suoi risultati; vale per Completato/Salta finale, ultima serie/timer e Termina da Home. Rete assente: coda persistente e stesso payload al retry, con app attiva.
- Per modifiche isolate o serie di modifiche senza un termine prevedibile, salvare localmente e lasciare all’utente il comando “Sincronizza”. Esempi: link video modificato, correzione di un risultato passato, modifica puntuale dei valori pianificati.
- L’invio automatico riguarda solo il gruppo concluso; non trascina con sé modifiche estranee che aspettano la sincronizzazione manuale.
- Anche le sessioni in corso o incomplete sono sincronizzabili tramite il comando manuale.
- Se manca la connessione, mantenere il gruppo da inviare in coda e ritentare automaticamente quando l’app è attiva e torna la rete. Non è garantito l’invio con l’app chiusa.
- Il download degli aggiornamenti resta su richiesta esplicita dell’utente. L’invio automatico può leggere le sole revisioni necessarie a controllare i conflitti.
- Per affidabilità e conflitti applicare la [specifica 013](013_sincronizzazione.md).

## Questioni importanti aperte

Nessuna.

## Esito della revisione

Specifica risolta sulla base delle indicazioni e dell’approvazione dell’utente.

## Dettagli delegati all’assistente

I dettagli secondari saranno definiti in fase di implementazione, rispettando le decisioni consolidate.

## Registro delle decisioni

- 28/10/2026: formulata la proposta iniziale come questione T3.
- 28/10/2026: trasferita integralmente nella specifica 012, con gestione unificata nell’indice delle funzionalità. Stato e priorità invariati.


- 28/10/2026: approvata la sincronizzazione delle sessioni incomplete e definito l’invio automatico per gruppi conclusi, manuale per modifiche senza un confine prevedibile.

