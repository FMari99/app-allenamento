# 021 — Impostazioni, navigazione e annullamento dell’esecuzione

- Stato: completata
- Priorità: P1
- Significato: definizione risolta; prove e pubblicazione nel piano.
- Ultima revisione: 04/11/2026
- [Indice](../../specifica_funzionalita_app.md)

## Interfaccia e impostazioni

Menu ⋯ → Impostazioni apre una modale; la stessa configurazione è accessibile da Menu → Impostazioni. Preferenze locali persistenti per archivio/dispositivo, non dati del piano e non sincronizzate. Salva esplicito e Annulla; uscita con modifiche non salvate bloccata.

- Schermata intera attiva per default: nasconde i tre pulsanti inferiori Home/Calendario/Menu e recupera lo spazio. Non forza la Fullscreen API del browser. Il menu ⋯ resta accessibile e contiene Torna alla Home, che conserva la sessione.
- Frecce di navigazione attive per default: sotto Salta/Completato, entrambi al 50% della larghezza, compaiono ← e → con indicazione della posizione/stato. Le frecce sfogliano senza confermare, saltare, iniziare esercizi futuri o cambiare timer. Nessun pulsante Precedente nella riga principale.
- Suono a fine recupero disattivato per default: segnale selezionabile generato localmente con Web Audio. Attivazione tramite gesto dell’utente; segnale solo al passaggio da timer attivo a terminato, con app visibile e audio disponibile. Non riprodurre timer già scaduti alla riapertura; nessuna garanzia a schermo bloccato/in background e nessuna notifica remota. Salta recupero non suona.

Le frecce possono mostrare anche esercizi futuri, in anteprima: campi, contatore e azioni Salta/Completato non disponibili finché la sessione non li raggiunge in ordine. Dettagli dell’esercizio consultabili. Il blocco è verificato anche nel dominio, non soltanto nei bottoni. Tornare al corrente è sempre possibile, anche disattivando le frecce mentre si guarda un’altra posizione. Gli esercizi già iniziati rimangono consultabili/modificabili; le correzioni non fanno ripartire il recupero del corrente. Stato di avanzamento locale conservato alla riapertura; i risultati sincronizzati permettono di ricostruire il punto raggiunto su altro dispositivo.

## Recupero a tutto schermo e scelta suono — 02/11/2026

Quando parte un recupero, una modale nativa a tutto schermo copre l’esecuzione e rende inattivi i comandi sottostanti, anche se la preferenza di navigazione immersiva è disabilitata. Sfondo verde acceso, tempo rimanente e anello che si riempie fino alla scadenza; pulsante Salta recupero. Alla scadenza lo sfondo diventa rosso, compare il tempo trascorso oltre la scadenza (`+mm:ss`) e il pulsante Riprendi allenamento. Colore accompagnato da testi e numeri; nessuna conclusione/convalida automatica. Il segnale scelto suona una volta soltanto, se abilitato e disponibile; niente replay di vecchi timer alla riapertura. Recupero e tempo extra usano la stessa scadenza assoluta persistente.

Salta recupero e Riprendi allenamento chiudono la schermata e conservano il conteggio. Un recupero dopo esercizio già svolto/saltato non riparte premendo successivamente Completato; Annulla ultima serie permette di ripetere la serie e il relativo recupero. Chiusura del browser non azzera il countdown o il tempo extra.

Se il suono è abilitato, Impostazioni mostra Scegli suono. Si apre una seconda modale sopra le impostazioni, con quattro varianti acute: Doppio bip, Trillo, Campanello, Triplo segnale. Toccare una voce riproduce l’anteprima senza sovrapporla a quella precedente. Seleziona aggiorna la scelta nel modulo e chiude soltanto la seconda modale; Salva nelle impostazioni rende persistente l’intera configurazione. Annulla chiude senza modificare la scelta precedente; chiudere ferma l’anteprima. Ripristino del focus al selettore; nessun asset audio o servizio esterno necessario.

## Annullamento

Menu ⋯ → Annulla sessione è disponibile soltanto per sessioni aperte e chiede una conferma esplicita. La sessione, i risultati, i contatori e il timer vengono rimossi dall’esperienza d’uso e si torna Home. Nessuna influenza sulla rotazione, sul calendario o sui progressi; nessun cambiamento a scheda/catalogo. Non è un completamento parziale e non è recuperabile dall’interfaccia.

La cancellazione usa tombstone secondo il protocollo offline esistente: sessione e tutti i suoi risultati nello stesso gruppo automatico. Le copie già sincronizzate scompaiono dagli altri dispositivi al successivo download. Offline la cancellazione resta pendente. Payload già tentati e ricevute restano immutati; un successore dipendente applica la cancellazione dopo la conferma del precedente. L’autorizzazione comprende il recupero degli invii precedenti della sola sessione annullata, mai modifiche estranee. Eventuali conflitti restano espliciti. Le tombstone tecniche non sono una sessione visibile né nuove statistiche.

## Registro

- 02/11/2026: richieste dell’utente consolidate; impostazioni locali, default e limiti del suono scelti dall’assistente. Il divieto di eseguire anteprime future supera il vecchio comportamento che permetteva di andare all’ultimo esercizio e concludere saltando bozze mai raggiunte.

- 02/11/2026: l’utente sostituisce il pannello recupero con schermata piena, colore verde/rosso e tempo oltre scadenza; aggiunge scelta suono con seconda modale e anteprima.

## Revisione implementata il 04/11/2026 — stato delle verifiche nel piano

- Esercizi a durata: timer integrato con avvio esplicito e breve preparazione per posizionarsi. Switch ben visibile per abilitare la sequenza automatica lavoro/recupero tra serie, evitando la conferma di ripresa a ogni pausa. Scelte di UX e dettagli temporali delegati all’assistente; l’automatismo deve rimanere riconoscibile e controllabile e non contabilizzare tempo trascorso con app chiusa come prestazione confermata senza una regola esplicita.
- Timer di lavoro e recupero: pulsante Ricomincia, riduzione a una barra fissa per consultare gli esercizi, ritorno alla schermata piena. Indicare Prossima serie n di m oppure Prossimo esercizio con nome. Riavviare un timer non duplica le serie o i risultati.
- Per esercizi con una sola serie non mostrare il contatore ridondante; mantenere accessibile l’azione utile a eseguirli/confermarli.
- Attrezzatura visibile nella pagina solo quando associata all’esercizio, sopra i valori: una riga a tutta larghezza con nomi, troncamento ove necessario e Vedi tutto che apre l’elenco completo.
- Ultima Serie fatta equivale a Completato: conferma dei valori e passaggio al prossimo esercizio dopo il recupero; niente doppia conferma. Preservare conclusione atomica e autorizzazioni della coda. Verificare anche ultimo esercizio della sessione e azioni anticipate sul timer.
- Promemoria/aumenti per la prossima esecuzione nella [022](022_prossima_esecuzione.md).

L’utente ha chiarito che “un fix alla volta” significa implementare in sequenza, senza fermarsi tra interventi. Lampeggio affrontato nella 0.5.1 e tutti gli altri punti inclusi nella 0.6.0; prove visive sul telefono ancora all’utente, secondo il piano.

## Regole operative della sequenza

Preparazione iniziale 5 secondi, configurabile 0–30 nelle impostazioni locali. Avvia timer esplicito per durata, durata con carico e distanza/durata. Switch Sequenza automatica in primo piano per esercizi con più serie: default spento, applicato anche alla fase corrente. La scadenza del lavoro in automatico conta una serie e avvia il recupero; la fine del recupero tra serie avvia nuova preparazione/lavoro. Senza automatismo, la scadenza del lavoro richiede Serie completata. Interrompi serie prima della fine non conta nulla. Recuperi a zero possono essere saltati automaticamente. Nessun avvio automatico di un nuovo esercizio: il recupero dopo l’ultima serie rimane un confine esplicito.

Una sola fase attiva nella stessa struttura locale persistente del timer. Ricomincia ricrea la scadenza senza duplicare conteggi; per lavoro ripropone la preparazione. Riduci mantiene il timer in barra fissa superiore con espansione, riavvio e azione della fase; si possono sfogliare esercizi e dettagli. Le azioni principali e i valori rimangono bloccati durante il timer, fino alla conclusione/interruzione, evitando doppie conferme. Testo Serie n/m o Prossimo esercizio sempre visibile nella schermata piena e nella barra. Dopo l’ultima Serie fatta l’underlay è già sul successivo; nessuna conferma Completato aggiuntiva.

Il coordinatore avanza soltanto in esecuzione con app visibile, una fase per commit e al massimo entro 2,5 secondi dalla scadenza osservata. Non recupera catene di serie durante sospensioni: un timer rimasto scaduto richiede un gesto esplicito; per lavoro Serie completata conferma l’esecuzione, mentre Ricomincia permette di rifarla. Scadenze assolute persistenti e controlli atomici su ID impediscono doppi avanzamenti. Nessuna garanzia audio/background aggiuntiva.

### Rifiniture 0.6.1

Senza attrezzatura associata non mostrare il riquadro nella pagina esercizio. Nel timer a tutto schermo dare risalto al prossimo esercizio con riquadro dedicato, nome grande e attrezzatura/carico da preparare tra parentesi. Usare le associazioni attive del catalogo e il carico della prossima voce di sessione, senza inventare attrezzi, carichi o significati per singolo manubrio. Omettere carico nullo/zero; mantenere l’informazione anche nella barra ridotta.
