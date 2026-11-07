# 016 — Prima versione mobile e pubblicazione

- Stato: completata
- Priorità: P1
- Ultima revisione: 29/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Perché serve
Dispositivo di riferimento: Android con Chrome. L’utente preferisce evitare una pubblicazione web non necessaria, ma accetta la pubblicazione se più semplice o comoda; non pone un vincolo di riservatezza sul codice. Per la prima versione si sceglie la PWA su GitHub Pages, in virtù di questa autorizzazione condizionata.

## Decisioni consolidate
- Stack approvato nella [018](../risolte/018_architettura_app.md): PWA con Vue 3 + Vite, installabile dal browser; nessuna pubblicazione negli store. Destinazione: Android/Chrome, distribuzione HTTPS tramite GitHub Pages.
- IndexedDB per dati locali e coda; service worker per rendere disponibili offline i file dell’app. Primo caricamento e download dei dati richiedono rete.
- Preparare l’app per schermi piccoli e provarla sul telefono Android dell’utente con Chrome.
- Hosting statico HTTPS su GitHub Pages: usando GitHub Free questo richiede un repository pubblico. Pubblicare solo il codice dell’app e dati fittizi, mai credenziali, esportazioni personali o schede reali.
- Per gli aggiornamenti dell’app evitare ricaricamenti forzati durante una sessione. Non cancellare il database locale per aggiornare l’interfaccia.
- Mostrare chiaramente gli invii pendenti; l’app continua a registrare offline quando il servizio remoto non è disponibile.
- Il piano gratuito Supabase può essere sospeso per scarsa attività: in quel caso l’utente ripristina il progetto dalla console e poi sincronizza. Non introdurre richieste artificiali periodiche né passare automaticamente a un piano a pagamento.

## Valutazione della nota dell’utente

La preferenza è per una distribuzione personale semplice, non per rendere segreto il codice. Per la prima versione manteniamo GitHub Pages: ospita file statici; il codice dell’interfaccia viene eseguito dal browser sul telefono, senza un server applicativo da gestire.

L’URL e l’interfaccia di accesso saranno comunque pubblicamente raggiungibili. Pubblicare il frontend non rende pubblici gli allenamenti: niente registrazione aperta, login personale e controlli di accesso Supabase secondo 015 e 011. Un URL poco diffuso non è una protezione.

Una copia dei file aperta con file:// non equivale a una PWA installabile: l’installazione PWA richiede HTTPS o un ambiente locale di sviluppo e i service worker richiedono un contesto supportato. Un hosting privato HTTPS è possibile, ma aggiungerebbe configurazione non necessaria in questa prima versione.

L’alternativa senza sito pubblico è un APK Android che incorpora la build Vue, per esempio con Capacitor. È fattibile, ma richiede strumenti Android, compilazione, firma e distribuzione degli aggiornamenti. Non è adottata ora; potrà essere valutata in futuro se evitare l’URL pubblico diventerà prioritario.

L’utente apre l’URL in Chrome e installa l’app; dopo il primo caricamento e download, può eseguire allenamenti offline. La rete serve per login, sincronizzazione, aggiornamenti e video esterni. Non promettere disponibilità offline prima della verifica del service worker.

## Questioni importanti aperte

Nessuna. Le risposte dell’utente sono integrate nelle decisioni consolidate.

## Dettagli delegati
Icona provvisoria, nome dell’app, layout e organizzazione del codice. Non occorre acquistare un dominio. Nessuna pubblicazione esterna è eseguita da questa specifica.

## Verifica prevista
Installazione, apertura offline, chiusura/riapertura durante una sessione, invio dopo ritorno della rete e aggiornamento dell’app senza perdita della coda.

## Riferimenti
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): repository pubblici supportati su GitHub Free.
- [Sospensione dei progetti Supabase Free](https://supabase.com/docs/guides/platform/free-project-pausing).
- [Requisiti di installazione PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
- [Service worker e HTTPS](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
- [Ambiente Android per Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup).

Fonti consultate il 29/10/2026; condizioni da ricontrollare al momento della pubblicazione.

## Registro delle decisioni

- 29/10/2026: individuata nella verifica delle lacune prima dello sviluppo; proposta da consolidare, non ancora approvata.
- 29/10/2026: recepita l’approvazione di Vue 3 + Vite; stato ancora in discussione limitatamente alle scelte operative sopra indicate.


- 29/10/2026: confermato Android/Chrome; recepita la preferenza per distribuzione personale e l’assenso alla pubblicazione se più comoda. Scelta la PWA su GitHub Pages per minimizzare configurazione e manutenzione; nessun deploy eseguito.

