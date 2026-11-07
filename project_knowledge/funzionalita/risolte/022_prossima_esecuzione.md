# 022 — Promemoria e valori per la prossima esecuzione

- Stato: completata
- Priorità: P1
- Significato: requisiti definiti; implementazione e prove nella 0.6.0, con collaudo UI all’utente nel piano.
- Ultima revisione: 04/11/2026
- [Indice](../../specifica_funzionalita_app.md)

## Richiesta confermata

Da ogni esercizio, durante la sessione, impostare un promemoria per aumentare la difficoltà oppure preparare valori futuri di serie, ripetizioni, carico, durata/distanza, secondo categoria. Menu ⋯ con nome compatto scelto dall’assistente, per esempio Prossima volta.

La proposta non altera la sessione corrente né i risultati storici. Alla successiva esecuzione interessata, quando l’utente arriva a quell’esercizio (non durante una semplice anteprima futura), mostrare una modale con i cambiamenti leggibili, per esempio Carico 6 → 8 kg e Serie 2 → 3. Tre azioni: applicare/confermare, rimandare alla prossima esecuzione, annullare la proposta. Per il solo flag mostrare il promemoria senza inventare valori. Le etichette definitive e i dettagli visivi sono delegati all’assistente.

Conferma esplicita necessaria: mai applicare un aumento in silenzio, mai considerarlo un risultato eseguito. Conservare le proposte nell’uso offline e rispettare isolamento proprietario, versioni e reinvii. L’originale AI rimane immutabile. Per voci riutilizzate (riscaldamento o esercizio in più allenamenti) rendere esplicito l’ambito della proposta e mantenere i riferimenti stabili. Persistenza e invii secondo il modello seguente, coerentemente con 011–013.

## Registro

- 04/11/2026: richiesta approvata dall’utente per sviluppo un fix alla volta. Nessuna domanda personale necessaria per iniziare; prima si corregge il lampeggio periodico, poi si procede con timer e nuova esecuzione.

## Modello implementato

`esercizi_allenamento.proposta_futura` è JSONB nullable, validato da helper privato: ID proposta, sessione origine, eventuale sessione rinviata, flag promemoria, misure prima e misure future (null per solo flag). Categoria e misure controllate, nessun dato libero aggiuntivo; helper non esposto ai client. La proposta è per quella voce stabile del piano, non per ogni uso globale dell’esercizio nel catalogo. Se la voce appartiene a un riscaldamento condiviso, vale negli allenamenti che lo richiamano; ambito spiegato nella modale.

Salvataggio e risoluzione sono modifiche del piano con incremento/coalescenza della revisione e coda manuale. Payload già tentati restano congelati, nuove proposte dipendono dai precedenti tramite la stessa riga. Conflitti gestiti dal confronto esistente. Nessuna nuova tabella esposta o cambio del contratto AI v3.

La modale compare per una sessione diversa dall’origine/rinvio, su una voce iniziata e ancora da eseguire, dopo la chiusura di eventuali timer/dettagli. Applica aggiorna il piano corrente e i valori ancora non confermati della sessione, poi cancella la proposta; l’originale AI e le sessioni precedenti restano intatti. Nel caso promemoria, Modifica ora lo consuma e permette di cambiare i valori nel form. Rimanda conserva la proposta e registra la sessione corrente per non riaprirla durante lo stesso allenamento, anche dopo sincronizzazione/riapertura. Annulla proposta la cancella senza cambiare i valori. Nessuna conferma del risultato né aumento applicato automaticamente. La revisione d’origine della sessione rimane quella dell’avvio; è immutabile come nelle altre modifiche in corso.
