export type Locale = 'en' | 'ru'
export const defaultLocale: Locale = process.env.NEXT_PUBLIC_LOCALE === 'ru' ? 'ru' : 'en'
const storageKey = 'mathua.locale'
let current: Locale = defaultLocale
const listeners = new Set<() => void>()
export function getLocale(): Locale { return typeof window === 'undefined' ? defaultLocale : current }
export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function setLocale(locale: Locale, persist = true): void {
  if (persist && typeof window !== 'undefined') {
    try { window.localStorage.setItem(storageKey, locale) } catch { /* Storage may be disabled. */ }
  }
  if (current === locale) return
  current = locale
  listeners.forEach(listener => listener())
}
export function initializeLocale(): void {
  let saved: string | null = null
  try { saved = window.localStorage.getItem(storageKey) } catch { /* Use browser preference. */ }
  setLocale(saved === 'ru' || saved === 'en' ? saved : navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en', false)
}
export function onLocaleStorage(event: StorageEvent): void {
  if (event.key === storageKey && (event.newValue === 'en' || event.newValue === 'ru')) setLocale(event.newValue, false)
}
