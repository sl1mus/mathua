'use client'
import { useSyncExternalStore } from 'react'
import { defaultLocale, getLocale, subscribeLocale } from '../lib/locale'
export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, () => defaultLocale)
}
