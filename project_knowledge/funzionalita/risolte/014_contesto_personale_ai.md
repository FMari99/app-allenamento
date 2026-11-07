# 014 — Informazioni personali fornite all’AI

- Stato: completata
- Priorità: P1
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Requisiti consolidati

Decisioni approvate dall’utente.

**Decisione dell’utente:** raccogliere contesto personale e vincoli pratici in conversazione, evitando di codificare nell’app questionari o regole per ogni situazione.

Comportamento concordato:

- In fase di creazione della scheda, discutere obiettivi, esperienza, disponibilità di tempo, frequenza desiderata, attrezzatura ed eventuali vincoli rilevanti.
- Usare altezza, peso e altri dettagli solo quando pertinenti e forniti dall’utente, senza campi obbligatori nell’app.
- Dare allo strumento AI accesso al catalogo, all’attrezzatura e, quando utile alla richiesta, allo storico dei risultati per formulare la scheda.
- Tradurre le conclusioni nei dati della scheda e in brevi istruzioni operative, senza copiare automaticamente l’intera conversazione nel database.
- Non creare inizialmente un profilo personale persistente aggiuntivo: il contesto non contenuto nelle schede o nello storico viene fornito in conversazione.

## Questioni importanti aperte

Nessuna.

## Esito della revisione

Specifica risolta sulla base delle indicazioni e dell’approvazione dell’utente.

## Dettagli delegati all’assistente

I dettagli secondari saranno definiti in fase di implementazione, rispettando le decisioni consolidate.

## Registro delle decisioni

- 28/10/2026: formulata la proposta iniziale come questione T5.
- 28/10/2026: trasferita integralmente nella specifica 014, con gestione unificata nell’indice delle funzionalità. Stato e priorità invariati.


- 28/10/2026: proposta approvata dall’utente; specifica completata.

