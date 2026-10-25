import type { Locale } from './locale'
import type { PracticeQuestion } from './api'
export function localizedProblem(problem: PracticeQuestion, locale: Locale) {
  const translated = problem.localizations?.[locale]
  return {
    question: translated?.question ?? problem.question,
    explanation: translated?.explanation ?? problem.explanation,
    fallback: locale !== 'en' && !translated,
  }
}
