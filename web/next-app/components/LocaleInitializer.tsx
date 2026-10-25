'use client'
import { useEffect } from 'react'
import { useLocale } from '../hooks/useLocale'
import { initializeLocale, onLocaleStorage } from '../lib/locale'
export default function LocaleInitializer() {
  const locale = useLocale()
  useEffect(() => {
    initializeLocale()
    window.addEventListener('storage', onLocaleStorage)
    return () => window.removeEventListener('storage', onLocaleStorage)
  }, [])
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return null
}
