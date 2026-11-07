# 002 — Storico dei progressi per esercizio

- Stato: completata
- Priorità: P2
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Consultare tutti i risultati di un esercizio, indipendentemente dalla scheda in cui è stato eseguito.
- Registrare un unico riepilogo per ogni esecuzione dell’esercizio: serie, ripetizioni, carico o durata e gli altri campi previsti dalla sua categoria.
- Non registrare le singole serie: variazioni di carico o ripetizioni tra serie non sono coperte nella prima versione.
- Usare un identificativo stabile dell’esercizio per riunire lo storico attraverso schede diverse.
- Dal dettaglio di un esercizio raggiungibile dalle liste dell’app, un pulsante con icona grafico apre la pagina degli storici.
- Ogni esecuzione registrata corrisponde a un punto temporale, anche quando ci sono più esecuzioni nello stesso giorno.
- Mostrare un grafico del carico e, quando applicabile, uno della durata.
- Il grafico di serie e ripetizioni può alternare il prodotto serie × ripetizioni e due curve sovrapposte.
- Nella vista sovrapposta le curve usano scale indipendenti adattate all’altezza disponibile. Etichette e valori mantengono le unità originali e rendono evidente la differenza di scala.
- Consentire di leggere data e valori toccando i punti o trascinando un indicatore verticale lungo il grafico.
- Conservare i valori di base; gli indicatori combinati si calcolano a partire da essi.

## Esito della revisione delle note

La scelta del riepilogo per esercizio risolve la granularità. Anche accesso, grafici e consultazione dei valori sono sufficientemente definiti. Il volume serie × ripetizioni × carico resta un indicatore aggiuntivo possibile, non indispensabile.

## Dettagli delegati all’assistente

Implementazione F6: grafici SVG con asse temporale, cursore verticale selezionabile al tocco o trascinamento e slider accessibile. Ogni esecuzione resta distinta, anche allo stesso istante; lo slider e l’elenco permettono di consultarle tutte. Scala 0–massimo per misura, scale indipendenti dichiarate per serie e ripetizioni. Storico su ID catalogo, esclusi bozze, salti e dati eliminati.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.

