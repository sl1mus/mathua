import { useState } from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { initializeLocale, setLocale, getLocale } from '../lib/locale'
import { useLocale } from '../hooks/useLocale'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { localizedProblem } from '../lib/localizedProblem'
import { HeroSection } from '../app/home/sections'

const problem = {
 question: '2 + 3 = ?', answer: '5', explanation: '2 + 3 = 5',
 localizations: { ru: { question: 'Вычислите: 2 + 3 = ?', explanation: 'Сложим: 2 + 3 = 5' } },
}
function AnswerHost() {
 const locale = useLocale()
 const [answer, updateAnswer] = useState('')
 const rendered = localizedProblem(problem, locale)
 return <><LanguageSwitcher /><p>{rendered.question}</p><input aria-label="answer" value={answer} onChange={event => updateAnswer(event.target.value)} /><p>{rendered.explanation}</p></>
}
beforeEach(() => { localStorage.clear(); setLocale('en', false) })
afterEach(() => { setLocale('en', false); localStorage.clear() })
describe('runtime language selection', () => {
 it('preserves the answer field and canonical problem while switching both ways', () => {
  render(<AnswerHost />)
  const field=screen.getByLabelText('answer')
  fireEvent.change(field,{target:{value:'5'}})
  fireEvent.change(screen.getByLabelText('Language / Язык'),{target:{value:'ru'}})
  expect(screen.getByText('Вычислите: 2 + 3 = ?')).toBeInTheDocument()
  expect(screen.getByLabelText('answer')).toBe(field)
  expect(field).toHaveValue('5')
  expect(localStorage.getItem('mathua.locale')).toBe('ru')
  expect(problem.question).toBe('2 + 3 = ?')
  expect(problem.answer).toBe('5')
  fireEvent.change(screen.getByLabelText('Language / Язык'),{target:{value:'en'}})
  expect(screen.getByText('2 + 3 = ?')).toBeInTheDocument()
  expect(field).toHaveValue('5')
 })
 it('rerenders existing interface copy without remounting the page', () => {
  render(<><LanguageSwitcher /><HeroSection onGetStarted={() => {}} /></>)
  fireEvent.change(screen.getByLabelText('Language / Язык'),{target:{value:'ru'}})
  expect(screen.getByRole('button',{name:'Начать учиться'})).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Language / Язык'),{target:{value:'en'}})
  expect(screen.getByRole('button',{name:'Get started'})).toBeInTheDocument()
 })
 it('honors explicit saved preference before browser detection', () => {
  localStorage.setItem('mathua.locale','ru')
  act(() => initializeLocale())
  expect(getLocale()).toBe('ru')
 })
 it('marks untranslated problems instead of silently claiming full coverage', () => {
  const original={question:'original',answer:'1',explanation:'working'}
  expect(localizedProblem(original,'ru')).toEqual({question:'original',explanation:'working',fallback:true})
  expect(localizedProblem(original,'en').fallback).toBe(false)
 })
})
