# 013 — Sincronizzazione e gestione dei conflitti

- Stato: completata
- Priorità: P1
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Requisiti consolidati

Decisioni approvate dall’utente.

Comportamento concordato:

- Un comando “Sincronizza” invia tutte le modifiche locali in attesa, incluse sessioni in corso o incomplete, e scarica gli aggiornamenti remoti.
- In aggiunta, l’invio automatico si attiva sui gruppi conclusi definiti nella [specifica 012](012_persistenza_dati.md): fine allenamento o conclusione esplicita di modifiche raggruppate. Le modifiche manuali estranee restano in attesa.
- Mostrare ultimo invio riuscito, modifiche in attesa ed eventuali errori. L’apertura dell’app non scarica aggiornamenti e non invia modifiche in attesa di conferma manuale; può ritentare gruppi già autorizzati all’invio automatico.
- Assegnare ID stabili anche ai dati creati offline: ripetere un invio non deve duplicare sessioni o risultati.
- Confrontare la revisione di partenza con quella remota prima di aggiornare un elemento.
- Unire automaticamente elementi indipendenti, per esempio sessioni con ID diversi.
- Se lo stesso elemento è stato modificato sia localmente sia online, conservare entrambe le versioni e chiedere quale mantenere mostrando la differenza; non sovrascrivere silenziosamente.
- Ogni gruppo coerente (per esempio sessione e risultati) viene salvato in una transazione: tutto o niente. Un errore tra gruppi lascia in coda quelli non confermati.
- Ogni gruppo ha un ID di operazione: se la risposta si perde dopo il salvataggio remoto, il nuovo tentativo viene riconosciuto e non duplica i dati.
- Un conflitto sospende solo il gruppo coinvolto e richiede all’utente la scelta tra le versioni; non viene risolto automaticamente dal nuovo tentativo.
- Per eventuali eliminazioni usare un segnale di cancellazione da sincronizzare, evitando che una copia non aggiornata ricrei l’elemento.
- Il flusso iniziale assume un telefono principale più lo strumento AI; gli stessi controlli proteggono comunque dai conflitti.

## Questioni importanti aperte

Nessuna.

## Esito della revisione

Specifica risolta sulla base delle indicazioni e dell’approvazione dell’utente.

## Dettagli delegati all’assistente

Implementazione F5: un conflitto si risolve per gruppo coerente; la scelta esplicita include le modifiche successive dipendenti ed è indicata nell’interfaccia. Prima della scelta è disponibile l’esportazione delle copie locali e della coda. Conservare locale prepara un nuovo invio manuale con versioni aggiornate; usare online sostituisce i dati coinvolti. Il download non sovrascrive righe pendenti; le conferme aggiornano anche la base delle correzioni successive.

## Registro delle decisioni

- 28/10/2026: formulata la proposta iniziale come questione T4.
- 28/10/2026: trasferita integralmente nella specifica 013, con gestione unificata nell’indice delle funzionalità. Stato e priorità invariati.


- 28/10/2026: approvate le misure di affidabilità e gestione conflitti; allineati gli invii automatici alla specifica 012.

