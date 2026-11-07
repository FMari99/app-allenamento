# 010 — Categorie di esercizio e dati obbligatori

- Stato: completata
- Priorità: P1
- Ultima revisione: 28/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Requisiti consolidati

Decisioni approvate dall’utente.

Classificare gli esercizi in base ai dati registrati, mantenendo poche categorie.

| Categoria | Esempi | Campi richiesti nel riepilogo |
| --- | --- | --- |
| Ripetizioni | Piegamenti, squat a corpo libero | Serie, ripetizioni per serie |
| Ripetizioni con carico | Curl con manubri, panca | Serie, ripetizioni per serie, carico in kg |
| Durata | Plank, tenuta isometrica | Serie, durata per serie in secondi |
| Durata con carico | Tenuta con peso | Serie, durata per serie in secondi, carico in kg |
| Distanza e durata | Corsa, camminata, ciclismo | Distanza in metri, durata totale in secondi |

- I dati effettivi sono un riepilogo per esercizio, come deciso nella funzionalità 002, senza serie individuali.
- Serie e ripetizioni sono interi positivi; durate e distanze sono positive; il carico è non negativo e può avere decimali.
- Un dato non registrato resta assente, non diventa zero. Un esercizio saltato non richiede valori effettivi.
- Nel catalogo indicare la convenzione del carico (peso totale o per singolo attrezzo) e delle ripetizioni (totali o per lato), quando necessaria, per confrontare valori omogenei.
- Categoria e identificativo sono proprietà dell’esercizio; i valori sono proprietà del piano o dell’esecuzione.
- Varianti con significato diverso hanno ID diversi; non cambiare retroattivamente l’unità di misura dello storico.

## Questioni importanti aperte

Nessuna.

## Esito della revisione

Specifica risolta sulla base delle indicazioni e dell’approvazione dell’utente.

## Dettagli delegati all’assistente

I dettagli secondari saranno definiti in fase di implementazione, rispettando le decisioni consolidate.

## Registro delle decisioni

- 28/10/2026: formulata la proposta iniziale come questione T1.
- 28/10/2026: trasferita integralmente nella specifica 010, con gestione unificata nell’indice delle funzionalità. Stato e priorità invariati.


- 28/10/2026: proposta approvata dall’utente; specifica completata.

