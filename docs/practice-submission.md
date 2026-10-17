# Account practice submission

15 October 2026: account answers now call Supabase
`submit_practice_attempt_v1`, exactly as the web does. This requires the new
web-owned migration; it has **not** been deployed.

The complete wire contract, SQL behavior, errors, security model and manual
rollout gates live in
[`minaara-webapp/docs/practice-submission-contract.md`](../../minaara-webapp/docs/practice-submission-contract.md).
The canonical migration is
`minaara-webapp/supabase/migrations/20261015120000_authoritative_practice_submission.sql`.

- `src/generated/practice-submission.ts`: exact canonical TypeScript adapter and
  request/result definitions. With both repos as siblings, run
  `npm run contract:sync`, then `npm run contract:check` to detect drift. Runtime
  builds use the committed snapshot and do not require the web repository.
- `src/data.ts`: sends only stable attempt ID, expected authenticated user,
  question/concept IDs, selected option or recall rating and elapsed time.
  It never submits correctness, metrics or client timestamps. Refetches current
  account metrics rather than replacing them with a historical retry receipt.
- `app/session.tsx`: freezes the pending request across retries, renders returned
  correctness/choices/review time, prevents advance until save confirmation and
  exits on account changes. It retains the six-question native queue and native
  navigation. A durable account-scoped pending request now survives restart; it is confirmed
  before a new answer can be sent. SecureStore device validation remains pending.
- `app/_layout.tsx`: invalidates curriculum queries when the native app becomes
  active, so returning from another device's work refetches account progress.
  This is foreground refresh, not live background streaming.
- Guest preview still grades and schedules locally using `src/learning/progress.ts`
  and `src/store.ts`. No preview-to-account upload. Saved briefings remain local
  and separate from saved ayat. No curriculum or appearance changes in this pass.

Verification: TypeScript, ten phone tests, exact contract parity and web/iOS/Android JavaScript/assets exports
pass. These are not native binaries or device-runtime tests. The shared database migration passes nine PostgreSQL integration tests,
including grading, concurrent first saves, conflicting IDs, idempotent retries,
RLS/write-grant denial, rollback, legacy-ID rejection and 50 BKT/schedule parity
combinations. Those tests mock auth.uid in an isolated local database; they do
not exercise Supabase Auth or PostgREST. See the web contract for reproduction.

The hosted Supabase hostname fails DNS resolution even outside the sandbox.
Real sign-in, expired-token refresh, an authenticated RPC and retry through
PostgREST, deployed legacy activity schema/grants/triggers and cross-device
rendered progress remain release gates. Native simulator/device save interruption,
foreground refresh and account-switch QA remain unverified. Local exports do
not establish native runtime behavior. Old app versions' direct writes will be
denied after the migration, so coordinate rollout/minimum versions before release.


Release-candidate review: [staging review and device checklist](practice-staging-checklist.md). Review findings and current
release gates supersede any implication that local test passes certify a hosted release.


Continuation: availability is now read through authenticated `get_practice_gate_v1`.
The migration defaults CLOSED. Pending committed receipts can recover while
paused; unsaved pending answers wait safely. `src/pending-attempt.ts` and
`src/pending-attempt-storage.ts` await device storage/read-back before network,
retain failures and clear only after an authoritative matching result. Auth,
conflict, invalid, unavailable and transient failures have separate guidance.
See the updated staging checklist; release remains HOLD.
