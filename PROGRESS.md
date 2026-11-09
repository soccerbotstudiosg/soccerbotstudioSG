# Current checkpoint

## Local presentation follow-up

The owner authorized collective draft publication and CI on9 November2026. Mobile calendar rows are reduced from33px to29px; toolbar controls share44px height and focus rings sit inside their borders to avoid neighbouring controls. Source ownership, formatting and diff checks pass. This CSS-only adjustment adds no logic tests; visual acceptance remains owner/CI work.

## Current change

Branch `fix/consistent-conflict-notice`, based on released PR46 main `64da315`. The candidate standardizes conflict/expiry notices with affected-session bullets, persists conflict notice through refresh until first calendar departure, returns eligible owned checkouts to Calendar at their authenticated payment deadline, and supplies bounded detailed HitPay descriptions from trusted snapshots.

Creation recovery now has a separate authenticated terminal `creationResolution: not_created` result. A narrow actual single-book RPC rejection (-32053/-32054) can produce it automatically; a genuinely lost response requires a restricted operator attestation that processing finished with no booking. Empty searches, elapsed time and generic errors remain insufficient. Migration0041 preserves immutable resolution evidence and fences old writes. Frontend clears only the original owned attempt, returns recovery/confirmation routes to Calendar, starts fresh after Home departure, and hides affected windows until fresh availability confirms release.

## Verification and delivery

Owner requested CodeQL52 repair and all-PR cleanup. PR49 now incorporates exact PR47 setup-python7.1.0 and PR48 npm/lock/inventory changes. PR33 is closed as deferred, preserving branch docs/test-guides-and-reference-cleanup and commit abbf9f2; its stale docs must be reconciled before reopening. Dependency originals will be closed as superseded after this combined source is pushed.

Prior source8b39597 passed verification42565529774 and staging42567292336, but the separate CodeQL alert check failed. Do not call it fully green or merge-ready. Alert52 identifies comment removal in scripts/dependency-review.mjs. The repair replaces comments with line boundaries and ignores unclosed-comment tails; closed/nested/split-marker regressions pass. A pre-fix probe accepted an entirely hidden assessment; the repaired parser rejects it. No alert dismissed.

Combined local frontend275/275 plus strict inventory, tooling188/188, types/lint/source/policy and generated-version checks pass. Fresh combined CI/CodeQL and staging are pending. The new body-edit check still needs branch-protection configuration; integration admin access is403. No merge or production deployment performed. Desktop/mobile date selection both auto-scroll and show the fixed centered return arrow; existing browser regressions cover both.

## Recording reconciliation and limits

Captures7/8 show the same two-tab single-session race: winner succeeds, loser does not adopt its payment flow on refresh. Expiry release succeeds; the later retry is blocked by two proven unpaid expiries on the shared IP, until9 November2026 06:42:29 Singapore time. No production data/settings were changed. HAR cannot prove visual notice/loader behavior or multi-session acceptance. Source and evidence owners are reconciled in Journey and booking-flows. Truly unknown provider writes remain protected pending provider/operator verification; the new endpoint does not turn an empty lookup into proof.
