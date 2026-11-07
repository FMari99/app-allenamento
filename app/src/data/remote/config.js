export function getRemoteConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase non ancora configurato')
  if (!url.startsWith('https://')) throw new Error('L’indirizzo Supabase deve usare HTTPS')
  return { url: url.replace(/\/$/, ''), key }
}
