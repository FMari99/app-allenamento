# 007 — Attrezzatura necessaria e utile per esercizio

- Stato: completata
- Priorità: P1
- Significato dello stato: specifica risolta; implementazione non attestata.
- Ultima revisione: 10/11/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Obiettivo e requisiti consolidati

Definire l’attrezzatura una sola volta nel catalogo degli esercizi e riutilizzarla nelle schede.
- Mantenere un catalogo strumenti e un catalogo esercizi.
- Collegarli tramite una tabella di associazione che indica il ruolo dello strumento: necessario oppure utile.
- Necessario significa che l’esercizio non è eseguibile senza quello strumento; utile significa facoltativo.
- L’AI può proporre gli strumenti quando crea un esercizio nuovo.
- Quando riusa un esercizio esistente, riusa anche le associazioni senza riscriverle in ogni scheda.
- Mostrare gli strumenti nella scheda e nel dettaglio dell’esercizio.
- Usare nomi coerenti e identificativi stabili per evitare duplicati.

## Esito della revisione delle note

La distinzione necessario/utile guida la generazione delle nuove schede senza escludere esercizi per la mancanza di accessori facoltativi. Non introduce filtri, blocchi o sostituzioni nelle schede già create. Le successive modifiche di disponibilità sono contesto per l’AI; la rimozione dello strumento ne nasconde anche i legami visibili, senza alterare esercizi o risultati (revisione 10/11/2026, specifica 008).

## Dettagli delegati all’assistente

Scelta autonoma: un’associazione unica per coppia esercizio–strumento, con ruolo modificabile. Nella prima versione non serve modellare combinazioni alternative complesse di strumenti.

## Questioni importanti aperte

Nessuna per la definizione funzionale attuale. Le decisioni comuni sono nelle specifiche 010–014, collegate nell’[indice delle funzionalità](../../specifica_funzionalita_app.md).

## Registro delle decisioni

- 28/10/2026: consolidate le note dell’utente e risolta la specifica; i dettagli secondari sono delegati all’assistente.

