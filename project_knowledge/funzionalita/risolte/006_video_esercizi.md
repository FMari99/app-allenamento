# 006 — Video associati agli esercizi

- Stato: completata
- Priorità: P3
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Consentire all’utente di associare un video a un esercizio e ritrovarlo nelle schede future.
- L’AI non cerca né associa contenuti dimostrativi nella prima versione.
- L’utente può inserire, modificare o rimuovere un collegamento video.
- Il collegamento è facoltativo ed è una proprietà dell’esercizio nel catalogo, salvata nel database.
- Tutte le schede che usano quell’esercizio accedono allo stesso collegamento.
- Rendere il video accessibile dalla schermata dell’esercizio.

## Esito della revisione delle note

La scelta dell’utente sostituisce la precedente proposta di selezione automatica o catalogo di video verificati.

## Dettagli delegati all’assistente

Implementazione F6: un solo collegamento HTTP(S) per esercizio del catalogo, apertura esterna, campo con Salva video e Annulla. Campo vuoto salvato rimuove il collegamento; uscita bloccata con modifiche non salvate. I cambi rimangono in coda manuale fino a Sincronizza. Nessun download o riproduttore incorporato, né ricerca AI.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.

