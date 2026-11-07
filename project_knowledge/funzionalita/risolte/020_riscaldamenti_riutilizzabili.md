# 020 — Riscaldamenti riutilizzabili

- Stato: completata
- Priorità: P1
- Significato: definizione risolta; implementazione e prove nel piano.
- Ultima revisione: 02/11/2026
- [Indice](../../specifica_funzionalita_app.md)

## Regole confermate

Una scheda può avere più blocchi di riscaldamento, definiti una sola volta dall’AI. Ogni allenamento può richiamare un blocco oppure non averne. Esempio: allenamenti A/B condividono il primo blocco; C usa il secondo. Non duplicare le voci di un blocco in ogni allenamento. Riutilizzo all’interno della scheda; catalogo degli esercizi condiviso anche tra schede.

I riscaldamenti precedono gli esercizi principali nella stessa sessione, con valori, conferma/salto, contatore e recuperi ordinari. Non sono allenamenti autonomi nella Home o nella rotazione. Ogni sessione registra risultati distinti, riferiti alle stesse voci stabili del blocco. Ordine dei risultati continuo tra riscaldamento e parte principale. Le sessioni iniziate prima di aggiungere un blocco demo non ricevono righe retroattive.

## Modello e creazione tramite AI

Contratto v3: `scheda.riscaldamenti` contiene blocchi `{id,nome,note,esercizi}`. Ogni allenamento può indicare `riscaldamento_id`; ometterlo se non previsto. Valori e recuperi rispettano categorie e contratto v2. Le v1/v2 restano accettate senza cambiare i vecchi payload.

Nel database si riutilizza la struttura `allenamenti`: `tipo` distingue allenamento/riscaldamento; `riscaldamento_id` lega l’allenamento a un blocco dello stesso proprietario e della stessa scheda. Vincolo composto e trigger vietano riferimenti estranei, a un allenamento normale e catene di riscaldamento. Tipo e collegamento sono strutturali e immutabili: le revisioni strutturali producono una nuova scheda, come già previsto. Non occorrono nuove tabelle esposte né copie di descrizioni nelle sessioni.

Cambiare valori o recuperi correnti di una voce del blocco modifica la proposta corrente per tutti gli allenamenti della scheda che lo richiamano. Incrementare la revisione di quella scheda e accodare l’invio manuale. L’originale AI resta immutabile e i risultati storici non cambiano.

## Registro

- 02/11/2026: richiesta dell’utente; approvata esecuzione senza ulteriori decisioni personali. Scelta implementativa: riuso nella scheda, blocchi tipizzati nella struttura esistente e risultati nella sessione principale.
