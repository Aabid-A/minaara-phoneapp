# Phone / web feature parity

15 October visual alignment: the phone now follows the web's editorial font
roles and 12px reading surfaces, with shared-colour Home/minaret treatment.
A subsequent data pass implements shared authoritative account grading and
submission locally, pending migration and live QA. The newer web Home
recommendations, five-question short sessions and saved-answer completion
summary have not been ported. See
[`mobile-alignment-plan.md`](mobile-alignment-plan.md) for dependencies and gates.

Compared with the sibling `minaara-webapp` on 2026-10-04. The phone build is
an Al-Fatihah development slice, not a feature-complete port. Sharing accounts,
content tables, and learning mathematics does not mean every web workflow exists
on the phone. The broader web curriculum also contains scaffolding; this is not
a claim that either build offers a complete Quran curriculum.

| Area | Phone status |
| --- | --- |
| Welcome and account access | Guest preview and password sign-in/sign-up wired; live-account QA pending. |
| Study | Al-Fatihah briefings, optional sources/deeper reading, and device-local saved briefings. |
| MINAARA Map | Focused five-node map with recorded membership edges; not the full web map or progress-state presentation. |
| Practice | Recall cards/MCQs use the web’s authoritative RPC with stable retries; migration and live verification pending. |
| Learning engine | Account BKT/scheduling now runs in the shared database transaction; preview uses the web math locally. Native selection remains simpler. |
| Due review | Due recall cards; advanced format/focus/new/incorrect question-bank filters are not ported. |
| Progress | Basic home/review metrics; detailed concept progress, accuracy, history, and activity views are not ported. |
| Saved ayat | Not ported. Saved briefings are not ayah bookmarks and do not implement Quran Foundation synchronization. |
| Research notebook | Not ported. |
| Quran / ayah reader | Dedicated web study/lesson reading experience is not ported. |
| Library / textbooks | Wider library and standalone textbook browsing are not ported. |
| Preferences | Device-local appearance preferences; no claim of cross-device preference/bookmark sync. |

## Remaining learner-facing work

1. Port the web question selection, review modes, and progress/history views.
2. Add the ayah reader, saved ayat, and authorized bookmark synchronization.
3. Add notebook and broader library/textbook workflows.
4. Bring map progress/status presentation across without increasing visual density.
5. Verify real-account behavior, concurrent progress writes, and native device flows.

Admin/content authoring can remain web-only; learner parity does not require
putting editorial administration into the phone app. Editorial approval, native
QA, dependency remediation, and store release work remain separate requirements.

Web comparison anchors: `lib/app-navigation.ts`, `app/(app)/performance/page.tsx`,
`app/(app)/saved/page.tsx`, `app/(app)/research/page.tsx`,
`app/(app)/question-bank/page.tsx`, and `app/(app)/textbooks/essential/page.tsx`.


Account submission implementation and remaining rollout gates:
[practice-submission.md](practice-submission.md). Local PostgreSQL concurrency
and rollback checks pass; this does not establish deployed backend parity.
