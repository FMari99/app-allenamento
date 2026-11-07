Il codice manuale va generato sul PC. Il problema concreto è che qui hai `codex-cli 0.114.0` installato tramite Snap: quella versione non possiede ancora il comando di pairing.

Fai così:

1. Prima chiudi davvero l’app desktop — non solo la finestra — e riaprila. Poi vai in **Impostazioni → Connessioni → Controlla questo PC → Aggiungi**. OpenAI consiglia esplicitamente il riavvio dell’app quando “Aggiungi/Riprova” restituisce errore. [Guida ufficiale alle connessioni remote](https://learn.chatgpt.com/docs/remote-connections)

2. Se fallisce ancora, aggiorna la CLI dal terminale con l’installer ufficiale:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Poi chiudi e riapri il terminale e verifica:

```bash
codex --version
codex remote-control --help
```

3. Genera il codice manuale:

```bash
codex remote-control start
codex remote-control pair
```

Il secondo comando stampa un `manualPairingCode` temporaneo: è esattamente quello da inserire nell’app Android in **Abbina manualmente**. [Riferimento ufficiale del comando](https://learn.chatgpt.com/docs/cli/reference)

Se dopo l’aggiornamento `codex remote-control` continua a non esistere, esegui direttamente la nuova installazione ignorando quella Snap:

```bash
~/.local/bin/codex remote-control start
~/.local/bin/codex remote-control pair
```

Telefono e PC devono inoltre essere collegati allo stesso account ChatGPT e allo stesso workspace; se è un workspace aziendale, l’amministratore deve aver abilitato Remote Control. Android è supportato. Non continuare a martellare “Riprova”: con la CLI attuale non arriverai al codice manuale.