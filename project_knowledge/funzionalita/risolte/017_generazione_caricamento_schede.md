# 017 — Generazione, validazione e caricamento delle schede

- Stato: completata
- Priorità: P1
- Ultima revisione: 30/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Perché serve
Il ciclo AI → JSON → script → database è centrale, e il confine tra operazioni affidate all’assistente e modifiche disponibili nell’app è ora approvato.

## Decisioni consolidate
- L’AI opera dall’ambiente locale dell’assistente già usato dall’utente. Nessuna API LLM a pagamento integrata nell’app e nessuna chat AI dentro l’app.
- Uno script Python esporta su richiesta catalogo, attrezzatura e storico sincronizzato in un JSON di contesto. L’AI lo legge prima di generare una scheda.
- Dal 10/11/2026 usare `export --ai` per la generazione: strumenti attivi e disponibili con note libere, associazioni filtrate e ID degli esercizi incompatibili per strumenti necessari non disponibili. Nessuna sostituzione delle schede esistenti; nessun recupero di attrezzi dalle vecchie ricevute. Export completo senza flag mantenuto per backup, validazione e verifica post-upload.
- I risultati non ancora inviati dal telefono non sono disponibili all’AI: prima di chiedere una scheda basata sui progressi, l’utente sincronizza.
- Una skill del progetto descrive schema JSON, categorie, convenzioni e uso dello script. La realizzazione della skill fa parte dello sviluppo, non di questa revisione.
- Lo script parte anche da un database vuoto: il JSON può proporre esercizi e strumenti nuovi oltre a referenziare ID esistenti.
- Prima del salvataggio lo script valida struttura, categorie, valori, riferimenti e duplicati e presenta un riepilogo di nuove voci e scheda. Il caricamento avviene quando richiesto dall’utente, senza un’ulteriore conferma obbligatoria se già autorizzato.
- Pubblicare catalogo necessario, associazioni e scheda in un’unica transazione. Ripetere lo stesso invio non crea duplicati.
- Nella prima versione l’AI crea nuove schede; per una revisione strutturale di una scheda già utilizzata crea una nuova scheda, riutilizzando il catalogo. Le vecchie schede e sessioni rimangono consultabili.
- Dal telefono si possono scegliere le schede, eseguirle, modificare i valori correnti, registrare/correggere risultati, gestire inventario e link video. Nessun editor completo per assemblare o riordinare schede nella prima consegna.
- Il contratto iniziale è `schemas/scheda-v1.schema.json` (formato_versione 1); validazione locale con `python3 tools/workouts/validate.py file.json` e `--catalogo` per il riuso. La conversione alla RPC è in `tools/workouts/payload.py`. F3 completata il 30/10/2026: `python3 -m tools.workouts.cli export`, `prepare` e `upload` sono implementati e verificati sul servizio reale; skill in `skills/crea-scheda-allenamento/SKILL.md`. Il README documenta comandi, diario privato e limiti delle letture paginate, coerenti con la 011.
- Le regole della 011 sulla disattivazione e sostituzione delle voci restano valide per ogni futura modifica strutturale.

## Questioni importanti aperte

Nessuna. Le risposte dell’utente sono integrate nelle decisioni consolidate.

## Dettagli delegati
Dati dimostrativi fittizi per i test, gestione delle cartelle locali e formato dei messaggi di validazione. Il contenuto della prima scheda personale sarà generato quando l’utente fornirà il contesto; non blocca lo sviluppo con dati di prova.

## Verifica prevista
Partenza da catalogo vuoto, riuso di un esercizio esistente, rifiuto di un file non valido senza scritture parziali, reinvio senza duplicazioni, download manuale della scheda dal telefono.

## Registro delle decisioni

- 29/10/2026: individuata nella verifica delle lacune prima dello sviluppo; proposta da consolidare, non ancora approvata.


- 29/10/2026: l’utente approva la proposta con la nota «approvo»; specifica risolta.


- 30/10/2026: F3 implementata e verificata con dati fittizi poi rimossi: catalogo vuoto/popolato, riuso, relazioni, rollback, invii ripetuti e risposta persa dopo commit reale. Nessuna modifica ai requisiti; prova del download sul telefono rimane in F5.
