# 015 — Accesso personale all’app e allo script

- Stato: completata
- Priorità: P1
- Ultima revisione: 29/10/2026
- [Indice delle funzionalità](../../specifica_funzionalita_app.md)

## Perché serve
Le regole di proprietà dei dati sono approvate nella 011; il percorso concreto per entrare nell’app e autorizzare lo script è ora approvato. Serve prima dell’integrazione cloud, non blocca interfaccia e salvataggio locale.

## Decisioni consolidate
- Un solo account personale Supabase Auth, con email e password, predisposto durante la configurazione iniziale.
- Nessuna registrazione pubblica nell’app; disabilitare le nuove iscrizioni dopo la predisposizione dell’account.
- Il telefono mantiene la sessione di accesso. Il primo accesso e il primo download richiedono rete; i dati già scaricati restano utilizzabili offline.
- Se l’accesso remoto scade, conservare allenamento e coda locale e chiedere di rientrare prima dell’invio. Non cancellare dati pendenti.
- Lo script locale usa lo stesso account e le stesse regole di accesso, senza richiedere una chiave amministrativa per caricare schede.
- L’utente configura le credenziali localmente tramite un passaggio dedicato; non inserirle nelle chat, nei JSON o nei file versionati. Forma del login dello script e conservazione protetta della sessione sono dettagli implementativi.
- Per la prima versione il ripristino dell’accesso può essere gestito dal proprietario tramite la console Supabase; nessun flusso email personalizzato da costruire.
- Cambio account escluso dalla prima versione; la disconnessione non deve perdere modifiche locali non inviate.

## Questioni importanti aperte

Nessuna. Le risposte dell’utente sono integrate nelle decisioni consolidate.

## Dettagli delegati
Layout del login, gestione messaggi e configurazione locale dello script. La disponibilità di un progetto Supabase e dell’account è un prerequisito operativo per la prova online, non serve comunicarne ora le credenziali.

## Verifica prevista
Login e riapertura; accesso offline dopo un download; sessione scaduta con dati pendenti; impossibilità di leggere o scrivere record di altri utenti.

## Riferimento
[Autenticazione con password Supabase](https://supabase.com/docs/guides/auth/passwords), consultata il 29/10/2026.

## Registro delle decisioni

- 29/10/2026: individuata nella verifica delle lacune prima dello sviluppo; proposta da consolidare, non ancora approvata.


- 29/10/2026: l’utente approva la proposta con la nota «approvo»; specifica risolta.

