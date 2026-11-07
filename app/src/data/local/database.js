// Le transazioni locali devono includere insieme dati e coda.
// Database separabile per proprietario quando sarà collegato l'accesso (F2/F4).
const stores = ['records', 'outbox', 'metadata']
export function openDatabase(ownerId) {
  if (!ownerId) throw new Error('Proprietario locale richiesto')
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`allenamento-v1-${ownerId}`, 1)
    request.onupgradeneeded = () => {
      for (const name of stores) request.result.createObjectStore(name, { keyPath: 'id' })
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Chiudi le altre finestre dell’app e riprova'))
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}
export function saveLocally(database, records, group = null) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['records', 'outbox'], 'readwrite')
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('Salvataggio annullato'))
    transaction.onerror = () => {} // onabort è la conferma del rollback
    try {
      for (const record of records) transaction.objectStore('records').put(record)
      if (group) transaction.objectStore('outbox').put(group)
    } catch (error) {
      transaction.abort()
      reject(error)
    }
  })
}

export function loadSnapshot(database) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(['records', 'outbox', 'metadata'], 'readonly')
    const records = tx.objectStore('records').getAll()
    const outbox = tx.objectStore('outbox').getAll()
    const metadata = tx.objectStore('metadata').get('snapshot')
    tx.oncomplete = () => resolve({ records: records.result, outbox: outbox.result, metadata: metadata.result })
    tx.onabort = () => reject(tx.error ?? new Error('Lettura locale non riuscita'))
  })
}

// Dati, coda e posizione dell'interfaccia condividono lo stesso commit.
// Il confronto di revisione evita sovrascritture da altre finestre.
export function commitSnapshot(database, snapshot, expectedRevision) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(['records', 'outbox', 'metadata'], 'readwrite')
    let reason
    tx.oncomplete = () => resolve(expectedRevision + 1)
    tx.onabort = () => reject(reason ?? tx.error ?? new Error('Salvataggio locale annullato'))
    tx.onerror = () => {}
    const revision = tx.objectStore('metadata').get('snapshot')
    revision.onsuccess = () => {
      try {
        if ((revision.result?.revision ?? 0) !== expectedRevision) throw new Error('I dati sono cambiati in un’altra finestra. Ricarica per riprendere la copia salvata.')
        const records = tx.objectStore('records')
        const outbox = tx.objectStore('outbox')
        records.clear()
        outbox.clear()
        for (const [table, rows] of Object.entries(snapshot.data)) {
          for (const row of rows) records.put({ id: `${table}:${row.id}`, table, data: row })
        }
        for (const group of snapshot.outbox) outbox.put(group)
        tx.objectStore('metadata').put({ id: 'snapshot', revision: expectedRevision + 1, ui: snapshot.ui, sync: snapshot.sync ?? {}, local: snapshot.local ?? { sets: {} } })
      } catch (error) {
        reason = error
        tx.abort()
      }
    }
  })
}
