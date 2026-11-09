# 004 — Schermata dedicata al singolo esercizio

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 09/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Guidare la sessione mostrando un esercizio alla volta e consentendo la registrazione dei risultati.
- Mostrare nome, istruzioni e impostazione prevista.
- Precompilare i valori della sessione dal piano corrente all’avvio; consentire di modificarli e confermarli come risultati per esercizio. Le bozze non confermate non entrano nello storico dei progressi.
- Consentire di segnare l’esercizio come eseguito.
- Permettere di passare al successivo e tornare al precedente.
- Rendere accessibili attrezzatura, eventuale video, impostazione originale dell’AI e storico dei progressi.

## Esito della revisione delle note

L’utente delega esplicitamente la prima proposta di interfaccia all’assistente, riservandosi di correggerla dopo averla provata.

## Dettagli delegati all’assistente

Decisione utente del 30/10/2026 (0.2.4): schermata unica, senza card. In alto un’unica barra con Esercizio n di m, cronometro live `[ hh:mm:ss ]` dall’avvio e menu ⋯. Sotto: titolo, eventuali istruzioni/note e soli campi delle misure, senza introduzioni su convenzioni, conferme e bozze.

Azioni principali: Precedente, Salta e Completato. Completato valida i valori e passa al prossimo; Salta non considera l’esercizio eseguito, azzera le misure e passa al prossimo. All’ultimo esercizio entrambe le azioni terminano la sessione con ora corrente, tornano Home e mostrano il toast «Allenamento completato 🎉». Eventuali vecchie bozze rimaste nella sessione sono segnate saltate. La normale fine automatica resta distinta dal Termina parziale in Home, che usa l’ultima conferma. Risultati, avanzamento e fine sono persistiti nello stesso commit con la coda; una correzione di una sessione già chiusa non ne modifica l’orario finale e resta manuale. Riprendi apre il primo esercizio da eseguire.

Il menu ⋯ si chiude quando si sceglie una voce e apre una modale: Suggerito dall’AI (sola proposta originale), Attrezzatura, Video (apri/modifica se presente, inserisci se assente) o Risultati precedenti (cinque esecuzioni per pagina, frecce per le pagine). Modifiche al video richiedono Salva o Annulla prima di chiudere la modale. La modifica del piano corrente è spostata nel dettaglio esercizio della pagina Progressi. Le etichette rimosse sono testo dell’interfaccia, non campi funzionali SQL.

## Consultazione e correzione delle sessioni concluse — 09/11/2026

Calendario → Sessione ed esercizi e Storico → Rivedi o correggi risultati aprono la stessa vista di consultazione dei risultati dell’intero allenamento. Salta, Completato, contatori e timer di esecuzione non sono disponibili per sessioni concluse. Chiudi torna alla pagina precedente; Modifica abilita i campi dei risultati confermati.

Un unico Salva salva tutte le correzioni dell’allenamento con un solo commit locale e un gruppo manuale di sincronizzazione. Si abilita soltanto con valori cambiati; modificare e poi ripristinare i valori originali disabilita Salva. Validare tutte le correzioni prima di applicarle. Conservare stato completato/saltato, completato_at e inizio/fine della sessione: una correzione non è una nuova esecuzione. Gli esercizi saltati restano consultabili come tali, senza inventare risultati.

Le bozze di modifica rimangono nel modulo fino a Salva. Chiudi, Indietro del telefono e navigazione verso altre pagine chiedono conferma prima di scartare modifiche non salvate. Rifiutando si rimane nella modifica, con valori intatti. Dopo Salva si torna alla consultazione della sessione; Chiudi conclude la consultazione. Le correzioni restano da inviare manualmente con Sincronizza; preservare payload già tentati e dipendenze.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.


- 29/10/2026: recepito il flusso approvato di precompilazione e conferma senza valori previsti separati.


- 30/10/2026: consolidate schermata unica, azioni con avanzamento/fine automatici, cronometro e dettagli in modali.

## Revisione 02/11/2026

La [021](021_impostazioni_e_navigazione_esecuzione.md) aggiorna il flusso: Salta/Completato a metà larghezza, frecce opzionali sotto, anteprime future bloccate e modalità immersiva configurabile. I riscaldamenti [020](020_riscaldamenti_riutilizzabili.md) precedono gli esercizi nella stessa sessione.
