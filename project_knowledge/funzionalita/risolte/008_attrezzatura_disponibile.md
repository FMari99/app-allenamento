# 008 — Profilo dell’attrezzatura disponibile

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 10/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Fornire all’AI l’attrezzatura disponibile per generare schede compatibili.
- Salvare una lista personale modificabile di strumenti usando lo stesso catalogo della specifica 007.
- Rendere disponibile la lista all’AI durante la creazione della scheda.
- L’assenza di strumenti necessari esclude normalmente l’esercizio; l’assenza di strumenti utili non lo esclude.
- L’utente può indicare in conversazione eccezioni o attrezzatura accessibile altrove.
- Ogni strumento ha note libere facoltative, vuote per default: carichi, ubicazione (anche al parco), spazio e altri vincoli pratici. Pulsante Note apre una modale ampia con textarea e Salva/Annulla; nessun questionario o modello strutturato aggiuntivo.
- Dall’app aggiungere strumenti, modificarne il nome e le note, rimuoverli con conferma e indicarne la disponibilità. Uno strumento appena aggiunto parte disponibile. Il singolo cambio checkbox è una modifica confermata; nome/note richiedono Salva nella modale.
- Ogni modifica confermata si salva localmente e forma un gruppo automatico per il cloud; offline resta in coda con retry a rete disponibile e app attiva. Le bozze non confermate non vengono inviate.
- Per creare nuove schede l’AI riceve solo strumenti presenti e disponibili con relative note, tramite export `--ai`. Togliere la spunta influenza soltanto questo contesto, senza cambiare le schede già create né impedire l’esecuzione.
- Rimuovere uno strumento lo fa scomparire dal catalogo attivo, dall’inventario, dalle indicazioni di attrezzatura degli esercizi e dal contesto AI. Internamente si conservano tombstone sincronizzabili e si disattivano i legami, preservando schede, esercizi e risultati. Nessuna sostituzione automatica, né avvisi di incompatibilità/blocchi sulle schede esistenti: eventuali adeguamenti si discutono con l’assistente per una nuova scheda.
- Esempio concordato: anche senza sbarra a casa, l’AI può includere trazioni se l’utente indica che può usare quella al parco vicino, spiegando in chat come organizzare la sessione.

## Esito della revisione delle note

La nota risolve il confine tra dati strutturati nell’app e contesto gestito in conversazione.

## Dettagli delegati all’assistente

Le note sullo strumento sono persistenti; altre eccezioni date in chat valgono per la generazione interessata e non modificano automaticamente l’inventario salvato. Salvataggio esplicito nelle modali e conferma prima di scartare bozze. Stesso catalogo con ID stabili; nomi attivi unici. L’export completo resta disponibile per backup/validazione, quello AI filtra l’attrezzatura e omette le ricevute tecniche.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.
- 10/11/2026: approvati gestione strumenti dall’app, note libere, inventario destinato alle future schede e divieto di sostituzioni automatiche. Scelte operative: salvataggi confermati in gruppi automatici, rimozione logica con sparizione completa dall’esperienza attiva.

