import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeroSection, StatesSection, CoverageSection } from '../app/home/sections'
import { desktopLinks, overflowLinks } from '../lib/nav'
import { conceptCount } from '../app/home/data'

// Run separately with NEXT_PUBLIC_LOCALE=ru. English contract tests keep their locale.
describe.runIf(process.env.NEXT_PUBLIC_LOCALE === 'ru')('Russian landing and navigation', () => {
  it('offers a Russian primary action that starts the lesson flow', () => {
    const start = vi.fn()
    render(<HeroSection onGetStarted={start} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Математика с опорой на понимание')
    fireEvent.click(screen.getByRole('button', { name: 'Начать учиться' }))
    expect(start).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Код на GitHub' })).toBeInTheDocument()
  })

  it('translates curriculum labels without changing generated counts', () => {
    render(<CoverageSection />)
    expect(screen.getByText('Арифметика')).toBeInTheDocument()
    expect(screen.getByText('Комплексные числа')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent(String(conceptCount))
  })

  it('describes mastery and retention without the obsolete streak formula', () => {
    render(<StatesSection />)
    expect(screen.getByText('ОСВОЕНО')).toBeInTheDocument()
    expect(screen.getByText('ПОРА ПОВТОРИТЬ')).toBeInTheDocument()
    expect(screen.queryByText(/10 correct in a row/)).toBeNull()
  })

  it('keeps routes and role gating while translating navigation labels', () => {
    expect(desktopLinks(false).find(link => link.href === '/learn')?.label).toBe('Учиться')
    expect(desktopLinks(false).find(link => link.href === '/login')?.label).toBe('Войти')
    expect(overflowLinks(true, false).some(link => link.href === '/admin')).toBe(false)
    expect(overflowLinks(true, true).find(link => link.href === '/admin')?.label).toBe('Управление')
  })
})
