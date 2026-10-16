# Practice staging candidate — HOLD

Latest execution attempt: [staging run evidence](../../minaara-webapp/docs/practice-staging-run-2026-10-15.md).
No native check ran: staging identity/SQL audit and usable native tooling were
unavailable. Every device row remains unverified. The earlier run forbade gate opening and stopped before the audit. Its results
remain unchanged. The proposed future
[isolated staging test window](../../minaara-webapp/docs/practice-isolated-staging-window.md)
resolves how to test successful submissions under a separate execution approval.
This documentation task authorizes no hosted action; deployed closure is unverified.

Reviewed 15 October 2026. No client release or hosted migration performed.
The shared release checklist, exact database/web/phone ordering, rollback steps,
actual-schema audit and full API/device matrix are maintained in:

[Web practice staging release checklist](../../minaara-webapp/docs/practice-staging-release.md)

Phone-specific findings and checks:

- Existing account writes are fail-closed: `src/data.ts` calls only the RPC and
  checks the active account before accepting a response. The generated adapter
  matches the web contract. `app/session.tsx` uses returned correctness/review
  time and freezes the request until success or leaving the screen.
- Guest preview uses local `nextMetric` and `previewMetrics`; it never calls the
  account RPC. Queue size remains six. Appearance/navigation were not redesigned.
- The **old** phone version's attempt INSERT is denied after cutover. Its retry
  repeats that denied request; it needs the updated build. The new build reads a closed-by-default backend
  practice gate, but an immutable old binary cannot be made to read that gate or
  new update/error copy. Direct-write denial is the enforceable protection for
  old installs. A store update alone does not retire them.
- Pending IDs/payloads now persist in project/account-scoped SecureStore records via
  `src/pending-attempt.ts` / `pending-attempt-storage.ts` (localStorage for the
  web export). Only IDs, choice/rating and elapsed time are stored; no token,
  full content or metric. Read-back must succeed before any network submission.
  At next practice entry, restore and confirm the exact pending answer before
  starting another. Even a committed/lost response replays without counting twice.
  Failed/corrupt reads block new sends; failed RPC/clear retains recovery data.
  Logout/account switching does not delete or move it. Another account cannot
  load it. Uninstall/data clearing can still lose it. This is answer recovery,
  not full queue restoration or an automatic write on launch.
- Errors now distinguish expired authentication (sign in), conflict/invalid
  pending data (retain for support; no normal retry), unavailable service (try
  later) and ambiguous network errors (retry same ID). A disk failure says not
  sent; a failed clear after confirmation says confirmed but cleanup incomplete.
  No failure is displayed as Saved. Actual native sign-in recovery is unverified.
- `app/_layout.tsx` invalidates curriculum on native foreground; `src/data.ts`
  invalidates after a confirmed save. Verify actual refetch before asserting
  cross-device parity. This is not realtime/background synchronization.
- Run the shared HTTP harness against already-migrated, confirmed staging only.
  It uses public key/user JWTs, never a service key; it cannot verify native
  token refresh, secure session restoration or rendered navigation.

Mandatory device checks, **all UNVERIFIED here**: new/existing account paths,
correct/incorrect MCQs, both self-ratings and review times; stable retry and
conflict; simultaneous browser/phone submissions; expired access with refresh,
expired refresh, sign-out/account switch; guest/no account writes; web→phone
foreground refresh and phone→web reload; offline-before-send, dropped response
after commit, force-stop/restart during submission; unsupported old phone.
Use the shared matrix's exact actions, expected outcomes and evidence fields.

Tooling evidence: `xcrun --find simctl` fails; adb and EAS CLI are absent;
`app.json` has no linked EAS project ID and there is no eas.json. No connected
remote simulator tool is exposed. expo-overview, expo-data-fetching and
eas-simulator skills are not installed. Project/account access to EAS Simulator
is **unknown**, not assumed denied. Once connected, use a staging-configured
remote simulator/development build and run the same matrix; do not publish it.

The configured Supabase hostname still fails DNS outside the sandbox; actual
activity schema, Auth/PostgREST, token refresh and all device checks remain
release blockers. Local exports from the implementation pass remain build
evidence, not device-test evidence. See the shared checklist for this review's
rerun test results. Keep the required migration and compatible RPC available
when rolling a phone UI back; never re-enable direct metric writes for old apps.


## Continuation checks and rollout constraints — HOLD

The shared migration was amended locally before any deployment: it starts a
private singleton gate CLOSED, exposes authenticated read-only availability,
allows only committed receipt recovery while paused, and reserves quiz activity
insertions/edits for the trusted submission owner. Clients cannot open this gate.
Missing gate/API fails closed. The web rejects legacy and intermediate flat-RPC
payloads using `clientContract:2` before returning structured failures.

The known old phone waits for its writes, so denial prevents Saved/advance.
Its installed code cannot receive a gate, recovery outbox or new message without
an actual update. Other arbitrary old optimistic UIs cannot be controlled;
server rejection cannot undo text already rendered. Keep direct writes denied,
retire unsupported builds and test the real cutoff. Do not promise force-updates.

New test coverage includes failed persistence/read-back (zero sends), restart
before commit, restart after commit/lost response (one count), retained auth/
conflict failures, cross-account isolation, corrupt storage and failed clear.
The shared contract tests cover closed/missing services and serializable error
categories. Local PostgreSQL tests cover gate/write denial, receipt recovery
while closed and reserved quiz INSERT/UPDATE with ordinary lesson logging
still permitted. See the shared checklist's latest evidence counts.

Device checks must now assert actual SecureStore recovery of the same request
before a new question can be submitted, including after login. They must no
longer treat process-death data loss as an accepted implemented behavior. Test
locked-device storage, force-stop, kill after commit before UI feedback, failed
clear, logout and different-account entry. Those checks, hosted schema/permissions,
hosted submission/retry and cross-device refresh are still **UNVERIFIED**. A future isolated test-window enablement requires its own approval and controls;
it is not opening practice for users or a production change. Client release
requires separate authorization after sign-off.


### Latest local continuation evidence — HOLD

- Both TypeScript checks: PASS. Contract snapshot parity: PASS. Web ESLint on
  changed submission/gate/activity files: PASS. Both diff whitespace checks: PASS.
- Web pure/unit regression suite: **28 PASS** (contract/error/legacy marker,
  activity allowlist, learning engine and journey). Isolated PostgreSQL suite:
  **12 PASS** (grading, races, idempotency, rollback, gate defaults/ownership,
  paused receipt recovery, reserved quiz activity and schema audit). Total 40.
- Phone: **20 PASS**, including six durable-pending tests for failure before
  send, interrupted/restarted requests before/after commit, account isolation,
  corrupted storage and failed cleanup. These inject a storage interface; they
  do not certify native SecureStore durability or rendered UX.
- Production web build and phone web/iOS/Android JS/assets exports: PASS. Exports are not native binaries or device tests.
- Hosted health probe again fails DNS (curl exit 6 outside sandbox). Deployed
  activity schema/permissions, hosted submission/retry, cross-device refresh,
  immutable old-build behavior and native device behavior remain UNVERIFIED.
- No hosted migration, remote gate change, publication or client release.


## Future native test window — procedure resolved, HOLD

The gate cannot select named accounts: when enabled it accepts all authenticated
learners in its project. Do not use a shared project or assume `minaara-web` is
staging. Follow the [canonical isolated-window runbook](../../minaara-webapp/docs/practice-isolated-staging-window.md)
for the exact commands, access inventory, audit comparison, stop/closure steps
and minimum fixtures. Do not bypass the gate or weaken production RLS/grants.

Before any window, verify only the two approved synthetic accounts exist,
public/anonymous enrollment is disabled, and current/old phone builds and browser
profiles all target the separately confirmed staging URL/key. An old production
binary with a fixed backend cannot be safely retargeted by assumption; provide
an existing staging-capable old artifact or label an old-source QA rebuild and
its limits. Preserve an actual cached old staging web page before web cutover.

Native checks require a real simulator/device or connected EAS Simulator, secure
sign-in/refresh access for both users, a genuinely expired access token, and a
controllable proxy/network. A web export and the HTTP discarded-response test
are insufficient. Run new/existing submissions and review times, both ratings,
identical/conflicting retries, two-device concurrency, expired/refresh failures,
guest/signed-out, failed persistence, interrupted requests/force-stop recovery,
account switch, both directions of progress refresh and the old-build cases.
Capture request IDs, UTC/build hashes, before/after metrics and receipts, native
screenshots and sanitized network traces per row.

The operator may temporarily enable only the confirmed isolated staging project
for that approved test window, with a deadline and independent close supervisor.
No user-facing rollout or production opening is implied. Close on failure,
missing equipment, unperformable required check or deadline; require SQL + fresh
API + paused native UI evidence and new-ID PT503 with unchanged counts afterward.
A committed identical receipt may still replay after closure without a count.
Retain pending/receipt evidence before signing out or resetting anything. Keep
HOLD if closure or any matrix row is unverified. No hosted action was taken while
writing these instructions.
