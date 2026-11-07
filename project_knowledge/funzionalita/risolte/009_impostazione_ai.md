# 009 — Impostazione iniziale suggerita dall’AI

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 30/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Conservare la proposta iniziale dell’AI e distinguerla dall’evoluzione delle impostazioni e dai risultati.
- Per ogni esercizio inserito in un allenamento salvare serie, ripetizioni, durata o carico inizialmente suggeriti, secondo la categoria.
- Conservare separatamente proposta originale, impostazione pianificata corrente e risultato effettivo della singola esecuzione.
- Mantenere consultabile la proposta originale anche dopo modifiche dell’utente.
- Consentire di aggiornare l’impostazione corrente nel tempo.
- Raccogliere il contesto personale e sportivo necessario attraverso la conversazione con l’AI durante la creazione della scheda.
- Non richiedere nell’app un questionario strutturato di altezza, peso, esperienza o limitazioni.
- L’AI formula suggerimenti prudenti sulla base del contesto disponibile; l’utente può modificarli.

## Esito della revisione delle note

La nota delega alla conversazione la raccolta dei dati personali. Il requisito applicativo riguarda principalmente la separazione e la conservazione dei tre insiemi di valori.

## Dettagli delegati all’assistente

Revisione 0.2.4: durante l’esecuzione il menu ⋯ → Suggerito dall’AI apre una modale con la sola proposta originale. La modifica dell’impostazione corrente si trova in Menu → Progressi → dettaglio esercizio → Modifica piano corrente, con scelta della scheda/allenamento se l’esercizio è presente in più voci, salvataggio esplicito e Annulla. Salvare i risultati della sessione non sovrascrive automaticamente né l’originale né il piano corrente.

La separazione dei tre insiemi non richiede uno storico delle impostazioni previste per ciascun giorno: ai_ e corrente_ restano nel piano; nella sessione c’è un solo insieme di valori, precompilato e poi confermato come effettivo. Non è previsto il confronto storico tra obiettivo del giorno e risultato.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.


- 29/10/2026: approvata l’assenza di un secondo gruppo previsto_ nella sessione; la distinzione tra originale AI, piano corrente e risultati resta preservata.

