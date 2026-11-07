import { createClient } from '@supabase/supabase-js'
import { getRemoteConfig } from './config.js'
import { tables, emptyData } from '../../domain/session.js'
let client
export function getClient() {
  if (!client) {
    const { url, key } = getRemoteConfig()
    client = createClient(url, key, { auth: { detectSessionInUrl: false, storageKey: 'allenamento-auth-v1' }, global: { fetch: (url, options) => fetch(url, { ...options, signal: options?.signal ?? AbortSignal.timeout(20000) }) } })
  }
  return client
}
function check({ data, error, status }) {
  if (error) { error.status = status; throw error }
  return data
}
export function remoteFor(ownerId) {
  const client = getClient()
  async function verifyOwner() {
    const { data, error } = await client.auth.getSession()
    if (error || data.session?.user.id !== ownerId) throw new Error('Accedi di nuovo al tuo account; i dati locali sono conservati.')
  }
  return {
    async send(payload) { await verifyOwner(); return check(await client.rpc('salva_gruppo', payload).retry(false)) },
    async inspect(records) {
      return Promise.all(records.map(async record => ({ table: record.table, id: record.data.id, local: record.data, remote: await this.row(record.table, record.data.id) })))
    },
    async row(table, id) { await verifyOwner(); return check(await client.from(table).select('*').eq('id', id).eq('user_id', ownerId).maybeSingle()) },
    async download() {
      await verifyOwner()
      async function readAll() {
        const result = emptyData()
        for (const table of tables) {
          let after = null
          while (true) {
            let query = client.from(table).select('*').eq('user_id', ownerId).order('id').limit(500)
            if (after) query = query.gt('id', after)
            const page = check(await query)
            result[table].push(...page)
            if (page.length < 500) break
            after = page.at(-1).id
          }
        }
        return result
      }
      // Due letture uguali evitano di applicare relazioni di una scheda cambiata a metà download.
      const fingerprint = data => JSON.stringify(tables.map(t => data[t].map(r => [r.id, r.row_version])))
      let previous = await readAll()
      for (let attempt = 0; attempt < 2; attempt++) {
        const next = await readAll()
        if (fingerprint(previous) === fingerprint(next)) return next
        previous = next
      }
      throw new Error('I dati online stanno cambiando. Nessun download applicato: riprova fra poco.')
    },
  }
}
