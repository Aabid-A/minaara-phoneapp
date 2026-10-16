# Mobile alignment: verified baseline and implementation plan

Reviewed 15 October 2026. Existing Expo app retained; no new app or navigation
framework. Baselines: phone `3d7fc13`, authenticated web `3d2f0ce`.

## Verified baseline

No AGENTS.md, CLAUDE.md, PRODUCT.md or DESIGN.md was found in either app repo or
their applicable parent directories. Read the phone README/parity register and
web brand/typography/refinement documents. Current code wins where older prose
disagrees. Impeccable supplies audit/refinement guidance; the native app skill
supplies platform controls, navigation and verification guidance. No Appllama
MCP tools are exposed. No change of visual direction calls for frontend-design.

| Area | Verified code and consequence |
| --- | --- |
| Identity | Web `brand/palette.json`, `app/fonts.ts`, `app/learning.css`: garnet/chalk/charcoal, Outfit reading/controls, Cormorant display, Cinzel wordmark, shared minaret; 12px current control/surface radius, 180ms interaction timing. |
| Native | `src/theme.ts`, `src/ui.tsx`, `app/_layout.tsx`: native stacks/tabs, platform icons/Switch, safe areas, local dark palette. Initially only Outfit, 20px cards, and independent Home colours. |
| Recommendations | Web `app/(app)/dashboard/page.tsx` uses history/available questions/due concepts. Native `app/(tabs)/home/index.tsx` resumes a local briefing. Leave recommendation behavior pending release priority. |
| Practice | Web `lib/actions/active-recall.ts` ranks candidates by mode/type/focus/progress; `lib/learning-journey.ts` caps short sessions at five. Native `app/session.tsx` takes up to six candidates and computes results locally. Do not imply parity. |
| Submission | Web validates a stored question and returns `{success,isCorrect,nextReviewAt}` from a Next server action. Native `src/data.ts` performs retryable attempt insertion and metric upsert separately. Neither is an atomic transaction; the server action is not a mobile HTTP API. |
| Storage | `src/store.ts`: preview metrics, saved briefing IDs, appearance and reading position are device-local. Web saved ayat are separate records in `saved_ayahs`; notebook data is browser-local. No saved-item sync is introduced. |
| Backend | Both local configs contain the same public Supabase URL and an anon key. Host health probe failed DNS resolution both inside and outside the sandbox. Live auth, reads, writes and deployed migrations remain unverified. No account created or progress written. |
| Content | `src/generated/preview.json` has three development briefings, three concepts, six questions. Existing preview warnings and stored attribution are preserved. Web Mushaf bundle/starting-page coverage is incomplete; no reader expansion. |
| Native tooling | `xcrun --find simctl` fails; developer directory is CommandLineTools. No adb/emulator found. Native simulator/device validation is blocked here. Browser checks and asset exports do not establish native behavior. |

## Shared rules for this reversible pass

- Preserve the existing light/dark semantics and native navigation. Source light
  colours and identity surfaces from the committed shared palette; retain the
  existing accessible lighter dark accent rather than inventing a dark redesign.
- Load packaged Cormorant Garamond 500 and Cinzel 500 alongside Outfit. Use
  Cormorant for display/editorial headings, Cinzel only for MINAARA, Outfit for
  reading, instructions and controls. Preserve system text scaling.
- Align reading cards with the web's 12px radius, keep continuous native corners,
  44pt icon targets, 52pt primary actions, 4pt spacing and wrapping labels.
- Use the actual minaret for a selected Home brand moment. Reading remains on
  neutral surfaces; no new ornamental artwork, scrolling text effects or motion.
- Keep preview/account separation, sources, local-save labels, question selection,
  attempt submission and content unchanged until their contracts are resolved.

## Complete journey plan

The table names future behavior changes explicitly. They are not all implemented
by this visual pass. Product choices and live-backend dependencies gate the
corresponding rows; elapsed time does not supply approval.

| Step / existing files | Preserve / proposed implementation | Required data contract | Simulator/device verification |
| --- | --- | --- | --- |
| Entry — `app/index.tsx`, `app/auth.tsx`, `app/_layout.tsx`, `src/session.ts`, `src/auth-storage.ts` | Preserve guarded stacks, native auth modal, labels/autofill, SecureStore and pending-request protection. Preserve guest entry during this pass; release inclusion awaits owner. Add confirmation/recovery deep links only after backend redirects and recovery flow exist. | Supabase session/user; signup confirmation response; configured callback scheme and redirect allowlist. Recovery currently links to an unavailable web flow. | Cold start, sign-in/out, confirmation/recovery, offline/error and keyboard; back must not reopen completed sign-in. Real test account required. |
| Home — `app/(tabs)/home/index.tsx`, `src/data.ts`, `src/types.ts` | Restyle existing resume action now. After priority decision, align recommendations with web using real attempts/question availability/due state, never fixture totals. | Native currently has curriculum/metrics, not attempt history. A mobile snapshot needs attempts, due/availability, milestone inputs and explicit unavailable states. | First visit, returning, no questions, due review, query error; correct destination; both themes and large text. |
| Reading — `app/(tabs)/study/index.tsx`, `app/briefing/[id].tsx`, `src/ui.tsx` | Preserve list/search, local saved briefings, exact source/deeper-reading disclosures and context links. Refine typography/spacing. Do not substitute briefings for Quran text or expand Mushaf coverage. | Existing Block/Concept/Question IDs, layer, ayah_range, attribution; explicit missing source/extended block. | Open/close, long text, source disclosure, local save/filter, empty search, restoration and back path; VoiceOver/TalkBack and large text. |
| Practice — `app/session.tsx`, `src/review-session.ts`, `src/learning/progress.ts`, `src/data.ts` | Preserve stable queue, save locks, feedback and retry payload now. Port web queue behavior only after session/priority scope is settled. Production account parity needs one authenticated, server-validated submission operation. | Proposed mobile contract: request `{attemptId,questionId,conceptId,selectedOptionId?,cardRating?,timeSpentMs?}`; verified response `{isCorrect,nextReviewAt,metric}` with idempotency/atomic-save guarantees. This endpoint does not exist yet. Queue contract must declare mode/type/focus/limit. | Reveal/rate card, select/check MCQ, rapid taps, interrupted save, partial failure/retry, stale/concurrent device metric; no false success or duplicate attempt. |
| Completion — `app/session-complete.tsx`, `src/review-session.ts` | Preserve replace navigation and explicit exits. Once saved-answer contract is resolved, adapt web `summarizeSession`: unique saved answers/concepts, review needs and next review, with explicit device/account wording. | Save-confirmed answer records only; do not count a failed response or infer account persistence. | Successful queue end, empty/missing session, failed last save, background/restore, back cannot re-enter a completed queue. |
| Return — `app/session-complete.tsx`, `app/(tabs)/home/index.tsx`, `app/(tabs)/review/index.tsx`, `src/query-client.ts` | Preserve dismiss-to-tab behavior and cache invalidation. Add refreshed Home recommendation only when chosen priority and snapshot contract permit it. | Confirmed local preview metrics or refreshed account snapshot; no preview-to-account migration. Saved-ayah and saved-briefing sync remain separate decisions/contracts. | Finish/return/restart, correct active tab, fresh metrics, sign-out/account switch; no preview leakage. |

## Product decisions pending

Recommendations sent to the owner: reading first with practice next/map support;
separate labelled guest preview; initially verify account practice/progress before
adding cross-device saved data; Al-Fatihah only. Follow the authenticated web
identity closely, inferred from the explicit brief; no deliberate redesign.

## Validation record

- `npm run typecheck`: pass, including the final presentation-only corrections.
- `npm test`: all six existing learning/map tests pass. Learning math, queue,
  storage, submission, auth and navigation files are unchanged.
- `npm run build:web`: pass; packaged Cinzel/Cormorant TTFs appear in the export.
- iOS and Android Hermes JS+asset exports: pass, including final source. These
  are not native binaries or simulator executions.
- Actual theme-pair contrast checks: all twelve selected body, supporting,
  action, identity and selected-state pairs exceed 4.5:1. White/garnet 8.82,
  identity supporting/garnet 7.26. This is not a full accessibility certification.
- Browser review of the real exported app: light/dark at normal scale, 390px
  and 320px; no page-level horizontal overflow in inspected Home/reading views.
  Cormorant loaded on actual display text; Cinzel loaded on the brand. The
  completed guest path included Home → briefing → source disclosure → recall
  answer → device-local save → completion → Review. Fresh-origin entry also
  opened signup and entered preview without submitting account information.
- One correction batch moved briefing context/completion state beneath their
  headings. Final entry/dark reading were confirmed; no new styling loop.
- Large-text native validation **not completed**: no simulator/device is
  available. Attempted browser zoom shortcuts did not change the effective
  viewport/text scale, so they are not counted as a large-text pass. Native
  text scaling remains enabled; wrapping controls were improved in code.
- Browser console on the fresh preview: no errors reported during inspection.
  Restored the original preview's Light preference after dark-mode testing.
- `git diff --check`: pass. Shared palette/BKT/scheduler snapshots still match
  the web; the web repository is unchanged. No account or production write.
- The dependency install reports 22 audit findings (19 high/3 moderate), matching
  the prior documented count; dependency remediation was not undertaken here.

Native Dynamic Type, safe areas, system sheets/tabs/keyboard, secure-session
persistence, interrupted gestures and release performance remain unverified until
a simulator/device is available. Backend DNS prevents signed-in confirmation and
persistence checks. No account/backend certification from guest QA.


## Subsequent data-contract implementation — 15 October 2026

The baseline submission row and future practice contract above describe the
pre-implementation state. Account attempts now use the web-owned atomic Supabase
RPC; preview remains local, queue sizes and the visual alignment remain intact.
See [practice-submission.md](practice-submission.md) for changed files, checks,
rollout instructions and the outstanding live-backend/native release gates.
The new contract is implemented locally, not deployed or live-certified.
