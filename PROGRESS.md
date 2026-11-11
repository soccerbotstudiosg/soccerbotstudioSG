# Current checkpoint

## Active outcome

11 November 2026: remove premature Guest status from initial booking choices, including return after Continue as Guest. Preserve Guest on later steps and verified email/Sign out on entry. Consolidate deliberate two-line booking headings through700px with a shared title/identity grid and unchanged desktop wording. Owner authorized staging followed by production on11 November2026. Publish on `fix/booking-heading-layout`, verify exact-head CI and actual staging/health before merge, then verify main CI and production release.

## Baseline

PR54 was merged as `8e842fa96d5b1dd13c0771cf3e5ce424c32209d1`; main verification42839661572 and production deployment42841569967 passed. Production migration0043 applied and approved sandbox settings remained enabled; identity email delivery remained disabled. Local task branch is based on merged main `8e842fa`; its tree matched the previous PR54 head before the follow-up changes.

## Change and evidence

AccountStep explicitly suppresses inherited heading status for unverified booking choices. Verified email keeps its existing entry status/actions. The return-path regression and all12 existing account lifecycle cases pass (13 total); focused ESLint passes. The new regression fails against the original AccountStep, proving it detects the premature badge. An initial new-test trailing-slash expectation failed and was corrected to the existing Link-normalized path, with no route change. Browser expectations now require no initial badge and retain control-size checks while allowing the verified status to add height. Owner/CI browser verification remains pending.

## Scope

Booking scenarios and physical UAT describe the new entry rule; Journey retains delivery and local evidence. Provider/API contracts, payment/recovery logic, storage, quota settings and dependencies are unchanged. No live provider transactions or browser execution. Next: complete source/inventory checks, publish PR, verify staging, then production under the current authorization.

Heading follow-up: shared BookingHeading now owns two line segments for all booking-step titles, replacing the calendar-only break rule. Added CI-owned browser coverage for375/430/700/1280px, fixed mobile type/line geometry, Guest badge styling/non-overlap and Back. Browser execution remains pending; no assistant browser run.

Latest heading verification:59/59 focused account/async/parity tests, TypeScript, focused ESLint and whitespace checks passed. CI browser geometry and physical phone review remain pending.

Publication checkpoint: all305 unit/component cases pass across27 files with strict inventory validation. Preserved initial300/305 failure in Journey: five existing recovery checks needed accessible-heading selectors after text was split into spans; logic/effect assertions unchanged. Source/inventory checks passed. Staging and production pending the authorized CI/release sequence.

PR55 follow-up: CI42955220588 on da50c07 failed at test TypeScript because `exact` was incorrectly supplied to Testing Library role queries. Removed only the unsupported option; string names already match exactly. Fresh npm run typecheck and51 direct-checkout cases passed. Prior source failure retained in Journey. Follow-up exact-head CI and actual staging pending; production unchanged.
