
# minaara-phoneapp

MINAARA’s first Expo / React Native phone build. This is a working Al-Fatihah
development slice, **not a complete or release-ready Quran app**.

## Preview

```sh
cd /Users/aabidanas/Documents/MINAARA/minaara-phoneapp
npm ci
npm run dev
```

Open [the local preview](http://localhost:8083). Choose **Explore preview** to
try the app without creating an account. Onboarding, Home, Study, Map, Review,
briefing/source disclosure, saved filtering, and light/dark settings are wired.

For a physical phone, use an Expo Go version compatible with SDK 57, or a
development build. Keep the Mac and phone on the same Wi-Fi network. If the web
preview is already using port 8083, start a second Metro session:

```sh
npm start -- --port 8084
```

Scan that terminal’s QR code with Expo Go (Android) or the Camera app (iPhone).
If Expo Go reports an SDK mismatch, use a matching development build rather
than upgrading individual native libraries at random.

```sh
npm run typecheck
npm test
npm run build:web
npx expo install --check
# JS/native asset bundling only — not an IPA/APK or a simulator test:
npx expo export --platform ios --platform android
```

## Backend and accounts

`.env.local` uses only the existing web backend’s **public URL and anon key**.
It is ignored by Git. No server key is put in the app. To configure another
checkout, fill in the two fields from `.env.example`, or, with the sibling web
repo present, run `npm run backend:configure`. Existing configuration is preserved.

Account mode uses the existing Supabase auth and RLS-protected curriculum tables.
It loads Al-Fatihah briefings, concepts, recorded domain membership, questions,
and the signed-in user’s metrics. Password sign-in and email-confirmed sign-up
use the same account as the web app. Confirmation email delivery, production
redirects, the web password-recovery route, and authenticated reads/writes still
require a real-account QA pass; no account was created during development.

Native session tokens use SecureStore with chunked values. Browser preview
sessions use browser storage; never put privileged credentials in `EXPO_PUBLIC_*`.
Server data is cached with TanStack Query and cleared when the user changes.

Preview activity is stored **only on this device**, separately from account
progress, and is never silently uploaded when signing in. Saved briefings and
the last-opened briefing are device-local, including in account mode. Authenticated
offline caching across restarts is not implemented.

Signed-in practice uses the same authenticated Supabase RPC as the web. Stored
questions determine grading; attempt, BKT, scheduling and activity commit
atomically with stable attempt IDs for retries. Account-scoped pending requests
are persisted/read back before send and recovered at the next practice entry.
The backend practice gate starts closed; guest preview remains local. Guest preview alone uses local
BKT/scheduling. The required migration is implemented but not deployed; live
Auth/PostgREST and native-device verification remain release gates. See
[the account submission notes](docs/practice-submission.md).

## Brand and content

The Lanterned Margin follows the authenticated web app: chalk, garnet and
charcoal; Outfit for reading/controls, Cormorant Garamond for display headings,
and Cinzel for the MINAARA wordmark. Reading cards and controls use radius 12,
with circular nodes/pills and a 4-point spacing grid. Home uses the existing
minaret rather than a separate decorative thread. The existing dark adaptation
is retained. `src/design-tokens.ts` owns native roles and derives light tints
from the generated palette. Fonts are packaged TTF files, not network fonts.

The 15 October alignment plan and verification boundaries are recorded in
[`docs/mobile-alignment-plan.md`](docs/mobile-alignment-plan.md). That visual
pass does not change queue selection, submissions, content or sync behavior.

`npm run brand:sync` mechanically snapshots the sibling web repo’s palette,
existing minaret vector, existing social PNGs, and pure learning-engine files.
These snapshots are committed so this app can build without sibling repos.
The web repo remains the brand source of truth. Edit it there, then sync.

The guest curriculum in `src/generated/preview.json` is imported **verbatim**
from the existing `20260419143000_curate_fatihah_active_recall.sql` development
seed. `npm run preview:sync` refreshes that snapshot; it does not run SQL, change
the backend, approve content, or invent quotations. The UI labels the seed as
development content awaiting editorial review. No verified source attribution
is invented for the seed. In account mode, source attribution is displayed as
stored, not independently verified.

The map shows at most five visible nodes: Al-Fatihah, three existing concepts,
and a recorded curriculum domain. Edges come only from stored surah/domain
membership, never inferred theological relationships. Additional depth opens in
a routed context sheet; a list alternative supports accessibility and larger
native text sizes. Known short labels derive from existing section titles;
unknown content receives a neutral numbered concept label.

Source and deeper-reading disclosures are closed by default. Extended reading
is matched by the exact stored study scope and shown only when it exists.
Publish religious content only after qualified editorial/source review.

## Implementation guide

- `app/`: Expo Router screens. Native tabs on iOS/Android; standard JS tabs for web.
- `src/ui.tsx`, `src/theme.ts`: typography, semantic light/dark tokens, shared controls.
- `src/map-model.ts`: bounded map and explicitly composed curved routes.
- `src/data.ts`: curriculum queries and retryable account saves.
- `src/learning/`: snapshots of the web scheduler/BKT plus phone orchestration.
- `src/store.ts`: persisted device preferences, saved items, preview metrics.
- `src/auth-storage.ts`: native secure session adapter.
- `tests/learning.test.ts`: scheduler, seed shape, map bounds, and relationship tests.

## Verification and release boundaries

Development checks completed on 2026-10-04:

- TypeScript, six automated learning/map tests, SDK dependency alignment.
- Browser export and iOS/Android Hermes JS/asset exports.
- Phone-sized browser checks: entry/signup validation, Home, map/context,
  briefing/save/source disclosure, recall/review completion, guided-answer
  feedback, selected-answer accessibility, empty search, saved filtering,
  and dark Home/Study/Settings.

No Xcode or `simctl` is installed on this Mac, and no connected native device
was available. **Appllama’s required simulator/full-motion QA remains pending**:
safe areas, Dynamic Type XL, native tabs/sheets/keyboard, edge/hardware back,
Reduce Motion, secure session persistence, interrupted gestures, and release
performance. Bundling and browser screenshots do not verify those behaviors.

Appllama MCP research is not connected. Public references were consulted, with
a visual pass on [Readwise Reader’s mobile presentation](https://readwise.io/read)
and public [Tarteel product references](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396).
This is not the skill’s complete multi-screen research/simulator certification.
The skill guided native navigation, platform controls, accessible targets,
progressive disclosure, restrained motion, and the explicit pending-QA boundary.

Dependency audit after the compatible UUID fix: **22 findings (19 high, 3
moderate)**, propagated from upstream `braces`, `node-forge`, and
`decode-uri-component` advisories. No patched releases of the first two were
available in the checked registry. The decoder’s 0.5 update breaks Expo’s
CommonJS `query-string` caller, so it was not forced into the app. Re-audit and
resolve these before publishing; do not run `npm audit fix --force` (it proposes
an incompatible Expo downgrade).

App Store/Play Store identities, signing, deployment, a complete Quran curriculum,
editorial approval, and native/live-account certification are not part of this
development build.
