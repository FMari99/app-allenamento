# 001 — Calendario degli allenamenti

- Stato: completata
- Priorità: P2
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Mostrare i giorni con allenamenti registrati e permettere di consultarne il dettaglio.
- Il calendario evidenzia i giorni con allenamenti e quelli senza.
- Toccando un giorno si apre la lista delle sessioni, con scheda, allenamento e fascia oraria di esecuzione.
- Toccando una sessione si vedono gli esercizi e i valori effettivamente registrati: serie, ripetizioni, carico e durata, ove applicabili.
- Le sessioni incomplete sono riconoscibili secondo la specifica 005.

## Esito della revisione delle note

La nota dell’utente definisce interamente la navigazione giorno → sessione → esercizi.

## Dettagli delegati all’assistente

Implementazione F6: vista mensile con settimane da lunedì, sei righe di giorni, indicatori delle sessioni e selezione giorno → sessione → esercizi. Le sessioni sono attribuite alla data di avvio nel loro fuso salvato.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.

