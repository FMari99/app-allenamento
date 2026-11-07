---
name: crea-scheda-allenamento
description: Genera, valida e carica nuove schede nell'app personale App allenamento, riutilizzando catalogo e progressi esportati dal progetto. Usa questa skill quando l'utente chiede una scheda o una revisione strutturale per questa app.
---

# Creare una scheda nell'app allenamento

Operare dalla radice di questo progetto, individuabile risalendo due cartelle da questo file. Prima leggere `AGENTS.md` e le specifiche 010, 011, 014 e 017 in `project_knowledge/funzionalita/risolte/`.

## Contesto e catalogo

Esportare i dati remoti con il comando reale:

```sh
python3 -m tools.workouts.cli export --output private/contesto.json
```

Leggere il JSON esportato: catalogo, associazioni strumenti/esercizi, attrezzatura disponibile, schede e storico con riferimenti stabili. Le righe con `deleted_at` valorizzato servono per lo storico: non usarle come riferimenti per nuove schede. L'export contiene solo dati sincronizzati, e le letture paginate non costituiscono uno snapshot transazionale. Se l'utente vuole basarsi sui progressi recenti, ricordare di sincronizzare il telefono se non lo ha già fatto.

Raccogliere in conversazione obiettivi, esperienza, frequenza, tempo, attrezzatura e vincoli pratici ancora mancanti. Nessun profilo personale aggiuntivo persistente; non copiare l'intera conversazione nel database. Non inventare obiettivi personali, disponibilità o attrezzatura. Usare dati fittizi soltanto per prove dichiarate.

## Generazione del JSON

Usare `formato_versione: 3`. Ogni voce deve includere `recuperi: {tra_serie_secondi, dopo_esercizio_secondi}`, secondi interi non negativi proposti dall’assistente in base alla scheda; 0 disattiva. Nelle attività senza serie impostare tra_serie_secondi a 0. Non introdurre dati del contatore locale. Recuperi originali AI e correnti iniziano uguali; la modifica successiva dell’utente non sovrascrive gli originali. Le v1/v2 restano supportate soltanto per file e reinvii precedenti: non modificarne un payload già inviato.

Leggere il contratto reale `schemas/scheda-v3.schema.json` e, se utile, `examples/scheda-riscaldamenti-demo.json`. Generare un file sotto `private/`, per esempio `private/scheda.json`, conforme al contratto: non trascrivere o modificare il contratto per far passare il file.

- Generare UUID canonici minuscoli con la libreria `uuid` del runtime. Conservare gli stessi ID e `operation_id` per tutti i tentativi dello stesso invio.
- Riutilizzare gli ID di esercizi e strumenti esistenti; gli array radice `esercizi` e `strumenti` contengono esclusivamente nuove voci. Gli strumenti devono essere associati al catalogo esercizi con ruolo `necessario` o `utile`.
- Creare sempre una nuova scheda per una revisione strutturale: nuovi ID per scheda, allenamenti e voci, riutilizzando il catalogo. Non sovrascrivere le vecchie schede.
- Misure esatte per categoria: `ripetizioni` → serie/ripetizioni; `ripetizioni_carico` → serie/ripetizioni/carico_kg; `durata` → serie/durata_secondi; `durata_carico` → serie/durata_secondi/carico_kg; `distanza_durata` → distanza_metri/durata_secondi. Non aggiungere misure estranee alla categoria.
- Convenzioni del carico: `totale` o `per_attrezzo` dove richiesto; delle ripetizioni: `totali` o `per_lato` dove richiesto. Riutilizzando un esercizio rispettarne le convenzioni già registrate.
- Non inserire user_id, credenziali, campi tecnici server o video scelti dall'AI. I valori originali AI e correnti sono prodotti dallo script, a partire da `valori`.

### Riscaldamenti riutilizzabili

Definire `scheda.riscaldamenti` (anche vuoto). Ogni blocco ha id, nome, note ed esercizi come un allenamento. L’allenamento normale può indicare `riscaldamento_id`: riferire soltanto un blocco della stessa scheda; omettere il campo se non previsto. Più allenamenti possono usare lo stesso blocco e altri un blocco diverso. Non duplicare le voci del riscaldamento nei singoli allenamenti; riutilizzare anche il catalogo degli esercizi. Ogni esecuzione produce risultati propri nella sessione dell’allenamento, prima delle voci principali. I blocchi non sono allenamenti autonomi nella rotazione. Una modifica corrente di una voce condivisa vale per tutti gli allenamenti che la richiamano. Le revisioni strutturali restano nuove schede con nuovi riferimenti.

## Validazione e caricamento

```sh
python3 -m tools.workouts.cli prepare private/scheda.json --catalogo private/contesto.json
```

Leggere il riepilogo e presentare scheda, nuove voci e riferimenti riutilizzati. Se il caricamento è già autorizzato dalla richiesta, procedere senza riproporre una conferma; se l'utente chiede solo una proposta, fermarsi alla proposta validata.

```sh
python3 -m tools.workouts.cli upload private/scheda.json
```

Lo script valida contro il catalogo reale e salva tramite un'unica RPC atomica. Conserva il payload prima dell'invio in `private/invii/`; se manca la risposta, ritentare lo stesso comando e lo stesso file senza cambiare contenuto o identificativi. Non cancellare il diario per aggirare un errore e non generare una nuova operazione finché non è chiaro l'esito della precedente. Una ripetizione non crea duplicati. Dopo due tentativi falliti fermare gli invii, diagnosticare l'errore e riportare cosa manca.

Se l'accesso è scaduto e il refresh fallisce, chiedere all'utente di eseguire `python3 -m tools.workouts.cli login` nel terminale locale: non chiedere password in chat o inserirle negli argomenti. Usare solo chiave pubblicabile e sessione personale; nessuna chiave amministrativa necessaria.

Dopo il caricamento riesportare e verificare scheda e relazioni. Conservare file personali ed esportazioni sotto `private/`, mai nella build pubblica. Comunicare il risultato e ricordare che la scheda deve essere scaricata manualmente dal telefono quando tale flusso è disponibile.
