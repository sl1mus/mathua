# Localization boundaries

Language is presentation, not a new mathematical problem.

## Implemented slice

The browser uses one English/Russian build. The deployment locale supplies the server-rendering and hydration snapshot. After hydration an explicit `mathua.locale` browser preference wins over the browser language. Selecting a language updates subscribed components in place, persists the choice and synchronizes tabs. It does not reload routes or key the lesson by locale. Account-level synchronization is not implemented yet.

The initial exercise coverage is the addition generator used by `arith.add.single`, `arith.add.double`, `arith.add.carry` and `arith.add.triple`. This is not a translated arithmetic course: knowledge-point introductions, lessons, most exercise types and server messages remain English.

## Problem contract

`generator.Problem.Localizations` contains authored question/explanation pairs. Each pair uses operands and results from the same generation call. It has no answer override. The registry normalizes math text and keeps the English pair consistent with the final explanation policy.

The practice API returns these pairs alongside the canonical question, answer and explanation. The learning host selects a presentation at render time. Grading requests, anchors, exclusions, attempt records and mastery evidence continue to use the canonical question. A language change does not fetch another task, clear an answer, reset timing or create another attempt. Unsupported Russian exercises visibly fall back to English.

Only numeric addition is covered by this first slice. Choice localization needs stable option identifiers before translated options are enabled. Decimal-comma parsing, diagnostic localization, account preferences and translation coverage gates remain follow-up work. Do not describe these as implemented.

## Translation policy

Author and review templates before release. Do not machine-translate a live exercise. Preserve mathematical notation, operands, units and answer semantics. A complete Russian course requires translated statements, hints, explanations and lessons, with original attribution and license obligations preserved.
