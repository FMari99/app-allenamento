# 005 — Durata e stato dell’allenamento

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 09/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Registrare inizio e fine della sessione, conservando lo stato anche quando l’app viene chiusa.
- All’avvio salvare data e ora di inizio.
- Alla conclusione dell’allenamento salvare automaticamente data e ora di fine.
- Calcolare la durata come differenza tra fine e inizio: comprende recuperi, pause e tempo trascorso con l’app chiusa.
- Salvare progressivamente risultati ed esercizi completati.
- Se l’app viene chiusa e riaperta nello stesso giorno, la sessione resta normalmente in corso e può riprendere.
- Dal giorno successivo, se manca la fine, segnalarla come lasciata a metà e mostrare la percentuale di esercizi completati.
- Non inventare un orario di fine o una durata conclusiva per una sessione incompleta.
- Mostrare lo storico delle durate per allenamenti confrontabili.

### Chiusura di una sessione lasciata a metà (30/10/2026)

- Accanto a Riprendi, nella scheda del relativo allenamento in Home, mostrare Termina.
- Su Termina impostare la fine al massimo `completato_at` dei risultati attivi con stato completato della sessione; non usare la posizione dell’esercizio né l’ultima modifica generica.
- Conservare i risultati confermati; marcare saltate le bozze rimanenti e azzerarne le misure, così non diventano risultati validi.
- Se manca qualsiasi esercizio confermato, disabilitare Termina spiegandone il motivo: non esiste un orario da attribuire senza inventarlo. Il pulsante Riprendi resta disponibile.
- Salvare sessione e risultati nello stesso gruppo concluso autorizzato all’invio automatico; restare in Home e mostrare il successivo allenamento della scheda.

## Esito della revisione delle note

La nota definisce una gestione semplice basata sugli orari, senza timer di pausa.

## Dettagli delegati all’assistente

Scelte autonome: percentuale = esercizi completati / esercizi previsti, arrotondata all’intero; giorno valutato nel fuso della sessione. Anche una sessione che attraversa mezzanotte viene segnalata incompleta finché non è conclusa, come richiesto. Consentire di riprenderla. La normale chiusura dalla schermata di allenamento avviene automaticamente con Completato o Salta sull’ultimo esercizio e usa l’ora dell’azione. La nuova azione Termina nella Home chiude invece una sessione aperta all’orario dell’ultimo esercizio confermato, come richiesto dall’utente il 30/10/2026: non conta il tempo di inattività successivo all’ultima esecuzione. Nell’interfaccia locale si mantiene una sola sessione in corso per il giorno: riprenderla o terminarla prima di avviarne un’altra; le sessioni incomplete rimangono riprendibili.

Lo storico delle durate raggruppa tutte le sessioni concluse dello stesso allenamento, anche di revisioni diverse della scheda (revisione utente del 09/11/2026). Il dettaglio del punto indica la revisione e il testo informa che il contenuto potrebbe essere cambiato; le incomplete sono escluse dal grafico, senza attribuire una fine. Il calendario propone l’allenamento del giorno selezionato, se presente, altrimenti quello eseguito più recentemente. Nessuna scritta «scala 0–n» nel grafico durate. Il valore Durata (min) viene arrotondato all’intero solo nella presentazione, conservando la precisione del calcolo.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.


- 30/10/2026: introdotta su richiesta dell’utente la chiusura da Home all’ultima esecuzione confermata, distinguendola dalla normale conclusione durante l’allenamento.
- 09/11/2026: superato il filtro obbligatorio sulla revisione che separava le esecuzioni A del 4 e del 9 novembre; stesso allenamento in un unico grafico, revisione esplicita, minuti interi e scala rimossa.

## Annullamento 02/11/2026

La [021](021_impostazioni_e_navigazione_esecuzione.md) aggiunge Annulla sessione, distinto da Termina: nessuna sessione visibile né durata/progresso conteggiato, cancellazione sincronizzata con tombstone.
