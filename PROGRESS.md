# Current checkpoint

UI and reservation-defense consolidation is active; documentation PR33 remains paused. Dated evidence belongs to [Journey](docs/journey.md).

## Publish UI and reservation defenses first

- Repository: SoccerBotStudioSG; branch `fix/hero-session-copy` based on`8385c4f`; consolidated into existing PR32. Owner now authorizes merge after exact-head CI and staging/health pass; no direct main push or provider/settings activation.
- Candidate: five-session new-checkout cap; one strike per proven unpaid checkout; customer strike2+ blocks1 hour/reset on verified payment; shared-IP strike2+ within24 hours blocks1 hour/no paid reset. Atomic first-write checks cover both dispatch paths.
- UI: confirmation shares logo-blue headings, compact shell/card/action spacing and a full-width primary rebooking button; centred mobile step labels; equal6px Back clearance; standardized action spacing reduced35%; persistent popup scroll indicators; name-only trainer options; logo-blue booking headings; ended-video downward cue.
- Calendar: backend already keeps valid snapshots during warming and swaps complete generation-matched results. Browser now requests a replacement at active-month expiry, retains the date grid, excludes expired offers and shows the standard spinner inside the calendar for0.5 seconds. No indefinite stale-cache authority.
- Local evidence: full code gate267 cases passed before the latest spinner/confirmation polish; subsequent calendar/popup28, confirmation44 and client-cooldown30 checks passed. Final code gate pending at this checkpoint. Worker source/types passed.
- Backend evidence: first sustained run184/203; corrected new-cap and missing-migration fixtures. Subsequent full run489/492 passed; the remaining three fixture failures now pass focused verification after adding synthetic pepper and explicit pre-0006 historical state. Full final-head CI remains required.
- Next: final source/type/test and documentation checks; review diff; commit/push PR32; verify exact-head frontend/backend/live-email CI and actual staging revision/health; merge and verify independent main CI/deployment. Browser and physical acceptance belong to owner/CI.
- Last previously verified staging source in retained checkpoint:`db5e724`; base8385c4f CI passed, but current candidate is not yet staged or accepted.

## Documentation branch

- PR33 `docs/test-guides-and-reference-cleanup`, head`abbf9f2b146e2b6ca31f6373ad9d53e070e95b13`, remains paused; no broad refactor/CI.
- Authorized queued business rule for that branch only: SimplyBook client AND provider email reminders3 days and24 hours before. Timing selection is not enabled/saved/delivery proof; no provider configuration changes authorized here.
- Retain per-document numbered menus, bullets except opening explanation, no journals outside Journey, in-place reconciliation and diagrams unless stale. Preserve prior information-loss audit evidence.

## Acceptance boundaries

- Current changes require exact-candidate CI and staging before owner testing; prior green runs do not certify this candidate.
- No assistant browser, bookings, payments, cancellation, notification sends or provider settings changes.
- Domain/WAF and production activation remain deferred; application IP admission is not WAF coverage.
