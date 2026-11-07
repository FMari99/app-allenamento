# 003 — Proposta automatica del prossimo allenamento

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 30/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Proporre il prossimo allenamento di una scheda mantenendo la possibilità di sceglierlo manualmente.
- Conservare l’ordine degli allenamenti della scheda.
- Considerare l’ultima sessione eseguita della scheda; se è aperta, proporre lo stesso allenamento con Riprendi e Termina.
- Dopo una sessione conclusa proporre il successivo nell’ordine; dopo l’ultimo ricominciare dal primo.
- Consentire sempre una scelta manuale.

## Esito della revisione delle note

La rotazione ciclica è conservata, con precedenza alla ripresa dell’ultima sessione non conclusa della scheda.

## Dettagli delegati all’assistente

Decisione utente del 30/10/2026: Home mostra un solo allenamento alla volta, navigabile con frecce cicliche. Se l’ultima sessione della scheda non è conclusa, mostrare lo stesso allenamento con Riprendi e Termina integrati, senza un elenco separato. Dopo Termina passare subito al successivo. Alla prima esecuzione proporre il primo.

Il nome della scheda è sempre un pulsante di selezione, anche se esiste una sola scheda. Apre «Seleziona scheda» con tutte le schede attive del proprietario ordinate per ultima esecuzione; entrando in Home, selezionare la più recente. Le schede mai eseguite seguono quelle utilizzate, dalla creazione più recente. La scelta manuale resta attiva durante la consultazione della Home. Per sessioni concluse usare la fine effettiva; per quelle aperte l’ultima conferma o l’avvio. Correggere risultati di una sessione già chiusa non cambia l’ordine delle schede.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.


- 30/10/2026: consolidate selezione mobile delle schede per uso recente, visualizzazione singola degli allenamenti e ripresa/chiusura integrata nella Home.
