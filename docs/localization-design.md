# RFC: locale-independent learning with versioned presentation

Status: draft for discussion in [upstream issue #260](https://github.com/chuma-beep/mathua/issues/260). No shared-interface change is approved by this document.

Code baseline: [upstream 05871ef](https://github.com/chuma-beep/mathua/tree/05871ef23a350f0bd42285c815c2120c303a688f), inspected on 2026-10-27. Prototype baseline: [fork 13d096ad](https://github.com/sl1mus/mathua/tree/13d096ad50f1832b43f136dc30f3fa1b28cb3a47). Proposed names and paths below are illustrative, not existing API contracts.

## 1. Scope and invariants

One concept graph supports every locale. Concept IDs, prerequisites, KP ordering, difficulty, grading semantics, diagnostic evidence, XP, FIRe propagation, mastery and review state remain language-independent. A translation is neither another concept nor another distinct mathematical problem.

The first complete localized course is arithmetic. Completeness includes interface copy, all reachable exercise variants, explanations, teaching slices, reference lessons, diagnostic feedback and accessible media descriptions. Until that gate passes, label Russian coverage as partial and disclose English fallback.

No live machine translation is required to serve a lesson. Core learning remains available without an AI provider. This RFC does not redesign FIRe, mastery, scheduling or AI routing.

## 2. Existing components and proposed boundaries

| Existing component | Observation at baseline | Proposed change |
| --- | --- | --- |
| `internal/generator/generator.go` | `Problem` combines prose, answer, facts, difficulty and scaffolds | Add optional stable template/variant metadata for migrated generators. Keep the legacy English fields during migration. |
| `internal/generator/registry.go` | Single and batch paths generate problems. `explain` interpolates solution schemas using facts | Render presentations from the same generated instance. Cover both generation paths. Do not redraw to translate. |
| `internal/solutions/solutions.go`, `data/lessons/solutions/` | Authored schemas assemble explanations from instance facts | Add versioned locale schemas and explicit branch coverage. Preserve the English loader as fallback. |
| `internal/lessons/lesson.go`, `data/lessons/lessons.json`, `data/lessons/kp/` | Lessons map source documents to concepts. KP sections refer to lesson headings | Add a presentation overlay with stable teaching-block IDs. Do not resolve a translated KP by an English heading. |
| `internal/server/server.go` | Practice, study, quiz and diagnostic use different handlers | Apply one locale resolver and presentation envelope to every migrated delivery path. Keep answer material server-side. |
| `internal/engine/engine.go` | Durable study anchors are keyed by question text. `Anchor` holds expected answer, explanation and difficulty | Add instance-ID lookup behind existing anchoring. Retain legacy text lookup for old clients. |
| `web/next-app/lib/api.ts` | Study submissions carry `question` and a retry-stable `submission_id` | Add optional `problem_id`, `answer_locale` and `answer_format`. Preserve retry idempotency. |
| `LearnStepper.tsx`, study page, quiz hosts and `DiagnosticFlow.tsx` | Each surface owns answer state | Re-render copy without remounting the question host, resetting its timer or fetching another problem. |
| `internal/grader/router.go`, numeric, tuple, choice and symbolic graders | Grading dispatch already distinguishes answer types | Normalize only an explicitly declared input format before the existing grader. Keep the legacy English path unchanged. |
| `internal/diagnostic/report.go` and result components | Evidence states and reporting are evolving | Translate stable feedback codes and parameters. Do not infer evidence from translated labels. |
| `internal/scheduler/`, `internal/fsrs/`, mastery and FIRe code | Upstream already has FSRS fields and an FSRS package alongside SM-2 state | Add no locale fields or localization imports to learning algorithms. Preserve the upstream migration independently. |
| `internal/ai/provider.go` | A provider interface and separate failover infrastructure already exist | Reuse that boundary for optional assistance. Do not create a competing provider abstraction. |

A production merge needs a fresh upstream comparison. The fork prototype is not a substitute for the recent upstream engine, auth, diagnostic or idempotency changes.

## 3. Frontend internationalization and preference

Use semantic message IDs such as `learning.checkAnswer`, with separate English and Russian catalogs. Do not use English prose as the durable translation key. Catalog validation checks key parity, parameter types and plural forms. Use locale-aware formatting for interface numbers and dates, independently from mathematical input parsing.

Keep the current route structure initially. The selector changes presentation in place. A React locale provider/store must not key the application or learning host by locale.

Preference order after hydration: explicit saved browser preference, supported browser language, deployment default. Persist an explicit selection and synchronize browser tabs. For static export, render and hydrate using the same deployment default, then resolve the browser preference. Update the document language and mark fallback blocks with their actual language. No server-wide mutable locale is allowed.

Account preference synchronization is a separate optional API change. If added later, a deliberate selection in the current session wins over an older account value. Guest-to-account migration must not move learning evidence.

The prototype demonstrates in-place switching and browser persistence. Its English-key dictionary is temporary and will be replaced incrementally with semantic IDs.

## 4. Versioned curriculum overlays

Keep prerequisites, grading types and concept identity in the existing canonical definitions. Store translated presentation outside those definitions. Proposed layout:

```text
data/locales/en/concepts/<concept_id>.json
data/locales/ru/concepts/<concept_id>.json
data/locales/<locale>/templates/<template_id>.json
data/locales/<locale>/lessons/<document_id>.md
data/locales/<locale>/manifest.json
web/next-app/messages/<locale>.json
```

Each content unit declares `schema_version`, `content_id`, `locale`, `source_revision` and `translation_revision`. A concept overlay contains labels and references to stable KP/block IDs, not a second concept definition. A template variant has its own stable ID and declared placeholder contract.

A manifest records review status, validation status and provenance per unit. These are separate axes: a human review does not imply machine validation. Availability is derived from both, the source revision and the required-content inventory.

Use a content digest of normalized source content and its dependency contract rather than the entire repository commit as `source_revision`. A template depends on parameter names/types, branch IDs, option IDs, grading contract revision and relevant solution schema. A lesson depends on its blocks, captions and referenced assets. An unrelated code change does not invalidate every translation.

Source changes mark dependent translations stale. Adding a variant or teaching block makes affected coverage incomplete. A deliberate compatibility decision can preserve review status, but must be recorded and revalidated. Never silently serve stale content as validated Russian.

Example template unit, with illustrative revisions:

```json
{
  "schema_version": 1,
  "content_id": "arith.add.numeric.direct",
  "concept_id": "arith.add.single",
  "locale": "ru",
  "source_revision": "sha256:<source-contract-digest>",
  "translation_revision": "ru-1",
  "statement": "Вычислите: \\( [[a]] + [[b]] = ? \\)",
  "explanation": "Сложим [[a]] и [[b]]: \\( [[a]] + [[b]] = [[answer]] \\).",
  "parameter_contract": {"a": "integer", "b": "integer", "answer": "integer"}
}
```

The example is valid JSON. Placeholder values are typed instance facts, not executable template expressions.

Template rendering interpolates already computed facts. It does not evaluate translator-authored expressions or recompute answers. Branch-sensitive examples such as rational inequalities require distinct variants or explicit branch selectors. Upstream's correction for issue #267 illustrates why placeholder presence alone is insufficient.

Imported lessons retain source URLs, attribution, applicable license identifiers, modification notices and asset provenance. Translations inherit the applicable source-content obligations. Shared source documents are translated once and referenced by multiple concepts. Source-license review is a release gate, not an assumption that the repository's code license covers every lesson.

## 5. Mathematical identity and localized presentation

Distinguish three identities:

- `template_id` plus `variant_id` and a generator contract revision identify the authored mathematical form.
- `problem_id` is an opaque server-issued identifier for one served instance, scoped to its learner/session and canonical grading anchor.
- `variety_key` represents the same mathematical content across presentations. It excludes locale, translated strings, presentation revision and the random delivery ID.

The variety key uses canonical typed parameters and stable option semantics under the existing variety policy. Re-serving identical mathematics with a different delivery ID must not inflate diversity. Difficulty changes count only where the existing mathematical variety policy supports them.

The server anchor retains expected answer, grading type, difficulty, KP reference, canonical choice mapping and parameter/contract revision. It also retains the facts and content revision needed to render the same served instance later. A public DTO does not expose the expected answer or internal answer-bearing facts for unanswered tasks.

Conceptual interfaces, subject to review:

```text
Generate(context) -> CanonicalProblem
Present(CanonicalProblem, locale, contentRevision) -> Presentation
ResolveServedInstance(student, problemID) -> CanonicalProblem + grading anchor
NormalizeAnswer(raw, answerLocale, declaredFormat, answerContract) -> CanonicalAnswer | InputError
Grade(anchor, CanonicalAnswer) -> existing grading result
```

A presentation carries requested/effective locale, content revision, statement, stable-ID choice labels and fallback reason. Feedback is delivered after submission. A presentation lookup never calls the generator or scheduler.

Choice IDs and stored option order remain fixed during a language switch. Submit the selected option ID, not its translated label. Map it to the existing canonical expected value server-side. Legacy text-embedded choices remain English until their identity contract is migrated.

The precise presentation transport is an open decision: a small bundle of available locales per instance or an authenticated presentation lookup by `problem_id`. Either preserves the instance and keeps answers private. All HTTP and client cache keys include effective locale and content revision where presentation differs. Personalized payloads remain private and are not shared through a public cache.

## 6. Switching with an answer already entered

Preserve the exact draft, selected option ID, host identity, elapsed-time origin, problem ID and submission ID. Do not submit, redraw or record an attempt because the selector changed.

Record the draft's input locale and representation when entry begins. Switching the interface alone does not reinterpret an existing `1,5` as another number or rewrite the draft. Keep that draft's parsing locale until it is cleared. Explain this beside the input where needed. MathLive canonical LaTeX uses its declared format, not the interface locale. Server-side parsing remains authoritative.

Switching while a submission is in flight preserves the request and its idempotency key. Render the eventual verdict in the current interface language using stable feedback codes. Do not submit again to obtain a translated verdict. Existing grading-unavailable outcomes remain infrastructure errors, not learner mistakes.

Expired anchors return the established expiry behavior. Do not create a new question as a side effect of a presentation lookup. The learner explicitly continues to a newly served instance.

## 7. Locale-aware answer parsing without weaker grading

Add an input-boundary adapter rather than locale-dependent engine rules. Proposed request fields are additive and validated against the served answer contract:

```text
problem_id: opaque instance identifier
answer: raw input
answer_locale: en | ru
answer_format: plain_numeric | mathlive_latex | option_id | typed_text
submission_id: the same value for a retry of one submission
```

For legacy clients with no new fields, retain existing English behavior and text anchors. A migrated server rejects a conflicting `question`/`problem_id` pair. Never accept an expected answer supplied by the client.

For Russian plain numeric input, accept a decimal comma only in a scalar grammar that declares it. Interpret `1,5` as a decimal there. Reject grouping and mixed separators in the initial grammar. In tuples, sets, intervals and matrices, commas already carry structural meaning. Use format-specific parsers and explicit separators rather than global comma replacement. Test canonical LaTeX fractions and mixed numbers separately.

Units use reviewed aliases mapped to canonical unit IDs. Text answers use per-template accepted aliases or stable semantic IDs, never arbitrary machine translation. Unsupported textual formats retain an explicit fallback rather than guessed equivalence.

Normalization preserves existing precision, tolerances and mathematical equivalence. Invalid or ambiguous syntax returns a localized input error before grading or evidence mutation. A valid mathematical answer still follows the existing correct/incorrect path.

## 8. Learning engine and optional AI

No locale enters FIRe graph traversal, mastery thresholds, scheduler selection, review intervals or XP policy. Locale is optional presentation metadata, never part of a learning-state key. Do not store parallel Russian and English progress rows. This holds for current SM-2 paths, upstream FSRS work and future scheduler changes.

Optional AI explanations reuse `internal/ai.Provider` and existing failover policy. The application-level request can include requested language and the minimal authorized mathematical context. Provider IDs, models and routing configuration stay out of curriculum assets and learning records.

Validate structure, required mathematical facts and output safety before display. These checks do not prove arbitrary generated prose correct. Label optional generated assistance distinctly and fall back to the authored explanation on timeout, invalid output or unavailable providers. Do not use optional AI output for grading, evidence, coverage certification or automatic publication of a translation. Offline AI-assisted drafts require the same human review and validation as other translations.

## 9. Coverage and validation gates

Build the denominator from registered canonical concepts, reachable generator variants, lesson/KP mappings, feedback codes and asset dependencies. Do not hardcode the curriculum size. This permits the expansion target discussed in issue #260 without duplicating concepts.

A locale/course manifest enumerates the scope it claims to cover. Report missing, translated, reviewed, validated and stale units separately. Fully available means every required unit is current, reviewed and validated, including accessibility copy and the course's diagnostic paths. English fallback never counts as coverage.

Proposed automated checks:

- Schema validity, known IDs, duplicate IDs and placeholder/type parity.
- Source/dependency digests, removed targets, missing branches and stale translations.
- Math delimiter parsing, referenced assets, stable choice-ID parity and provenance completeness.
- Generated fixtures covering each declared branch, checking localized operands and solutions against the same canonical answer.
- Counterexamples for sign changes, undefined denominators, negative values and ambiguous answer syntax.
- EN/RU answer normalization with correct, incorrect and invalid examples for each supported answer format.
- UI tests for draft preservation, pending submissions, tab synchronization, hydration and language attributes.
- Server tests for anchor ownership, expiry, restarts, retries and equivalent input producing identical learning updates across locales.
- Learning invariance tests: language changes create no attempt, XP, diversity, mastery, FIRe or scheduling update.

Automated tests cannot certify linguistic quality or prove all prose mathematically correct. Require a named reviewer and mathematical review for each release unit. Preserve existing English regression suites and upstream invariants.

## 10. Incremental migration and reviewable PRs

1. **Design only:** agree on identity, content contracts, draft parsing behavior, fallback policy and availability gates.
2. **Interface infrastructure:** semantic English catalogs, Russian UI catalog, preference persistence and in-place switching. No curriculum or engine rewrite.
3. **Content schema and checks:** overlays, source digests, provenance and a coverage report. Existing English loaders remain authoritative.
4. **Instance identity:** additive anchor metadata and presentation lookup, first for numeric addition. Preserve legacy clients and retry idempotency. Include storage migrations and both SQLite/Postgres paths where persistence changes.
5. **Answer boundary:** explicit formats and locale parsing with parity tests. Stable choice IDs precede translated choices.
6. **Arithmetic vertical slice:** statements, all variants, authored solutions, KP slices, reference lessons, media and diagnostic feedback. Include learn, study, review and quiz delivery. Mark the course fully available only after its gate passes.
7. **Expansion:** migrate additional concepts and locales by the same inventory. AI assistance and account preference synchronization can ship independently.

Each implementation PR is rebased on the agreed upstream baseline and contains its own English regression evidence. Do not merge the fork's deployment configuration or unrelated grading fixes as part of localization. Keep the fork available as an exploratory demonstration.

Migrate additive anchor/storage fields first, then clients. Old in-flight English sessions remain gradeable until normal expiry. Rollback disables the new presentation path while preserving canonical attempts and review state. Revision retention must keep content needed by live anchors available until expiry. Newly stale content cannot receive a fresh validated-course claim.

## 11. Decisions requested from the maintainer

- Confirm stable template/variant IDs and additive server-issued instance IDs as the migration boundary.
- Choose a locale bundle or an authenticated per-instance presentation endpoint.
- Confirm semantic frontend catalogs and versioned curriculum overlays.
- Confirm that existing drafts keep their input locale until cleared.
- Agree on named review ownership, availability gates and source-revision policy.
- Choose the first arithmetic scope from the current canonical inventory and approve the PR sequence.

This RFC proposes these decisions. It does not claim that the prototype implements them all.

## Code references at the inspected baseline

- [Canonical problem and generator contract](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/generator/generator.go).
- [Registry explanation assembly](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/generator/registry.go).
- [Durable grading anchors](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/engine/engine.go).
- [Frontend submission identity and retries](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/web/next-app/lib/api.ts).
- [Lesson and KP loader](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/lessons/lesson.go).
- [Provider interface](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/ai/provider.go).
- [Scheduler state including FSRS fields](https://github.com/chuma-beep/mathua/blob/05871ef23a350f0bd42285c815c2120c303a688f/internal/scheduler/scheduler.go).

