'use client'
import { useLocale } from '../hooks/useLocale'
import { setLocale } from '../lib/locale'
export default function LanguageSwitcher() {
  const locale = useLocale()
  return (
    <select aria-label="Language / Язык" value={locale}
      onChange={event => setLocale(event.target.value === 'ru' ? 'ru' : 'en')}
      className="min-h-[44px] max-w-[112px] border border-mathua-border bg-mathua-bg px-2 font-mono text-xs text-mathua-primary">
      <option value="ru" lang="ru">Русский</option>
      <option value="en" lang="en">English</option>
    </select>
  )
}
