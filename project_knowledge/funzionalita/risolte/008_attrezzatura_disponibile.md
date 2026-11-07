# 008 — Profilo dell’attrezzatura disponibile

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Fornire all’AI l’attrezzatura disponibile per generare schede compatibili.
- Salvare una lista personale modificabile di strumenti usando lo stesso catalogo della specifica 007.
- Rendere disponibile la lista all’AI durante la creazione della scheda.
- L’assenza di strumenti necessari esclude normalmente l’esercizio; l’assenza di strumenti utili non lo esclude.
- L’utente può indicare in conversazione eccezioni o attrezzatura accessibile altrove.
- Luoghi, spostamenti, spazio e rumore si gestiscono in linguaggio naturale durante la creazione della scheda, senza campi o regole dedicate nell’app.
- Esempio concordato: anche senza sbarra a casa, l’AI può includere trazioni se l’utente indica che può usare quella al parco vicino, spiegando in chat come organizzare la sessione.

## Esito della revisione delle note

La nota risolve il confine tra dati strutturati nell’app e contesto gestito in conversazione.

## Dettagli delegati all’assistente

Scelta autonoma: selezione semplice da un elenco di strumenti. Le eccezioni date in chat valgono per la generazione interessata e non modificano automaticamente l’inventario salvato.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.

