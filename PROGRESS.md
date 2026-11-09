# Current checkpoint

## Local presentation follow-up

The owner authorized collective draft publication and CI on9 November2026. Mobile calendar rows are reduced from33px to29px; toolbar controls share44px height and focus rings sit inside their borders to avoid neighbouring controls. Source ownership, formatting and diff checks pass. This CSS-only adjustment adds no logic tests; visual acceptance remains owner/CI work.

## Current change

Branch `fix/consistent-conflict-notice`, based on released PR46 main `64da315`. The candidate standardizes conflict/expiry notices with affected-session bullets, persists conflict notice through refresh until first calendar departure, returns eligible owned checkouts to Calendar at their authenticated payment deadline, and supplies bounded detailed HitPay descriptions from trusted snapshots.

Creation recovery now has a separate authenticated terminal `creationResolution: not_created` result. A narrow actual single-book RPC rejection (-32053/-32054) can produce it automatically; a genuinely lost response requires a restricted operator attestation that processing finished with no booking. Empty searches, elapsed time and generic errors remain insufficient. Migration0041 preserves immutable resolution evidence and fences old writes. Frontend clears only the original owned attempt, returns recovery/confirmation routes to Calendar, starts fresh after Home departure, and hides affected windows until fresh availability confirms release.

## Verification and delivery

Final frontend275/275 and strict execution inventory pass, including actual payment/confirmation routes, refresh, Home/re-entry and silent affected-window suppression/release. Scoped lint, frontend/Worker types, source ownership and formatting pass. Provider86/86 and runtime50/50 passed; final targeted resolution/replay/replacement and operator matrix3/3 passed. A fullunit timeout under concurrent work was preserved; the unchanged calendar case and final serial suite pass without raised timeouts. Final authenticated stale-access insertion-race and hot-path checks2/2 also pass; the direct path remains7 coordinator+1 HTTP D1 executions (the added read is retained HitPay display metadata), with no extra provider calls. CI will execute the full496 Worker inventory and authored browser route regression. No assistant browser execution, live booking or operator resolution occurred. Draft PR49 is published. Its first CI run42546722111 exposed a deferred-recovery fixture ordering failure: migration0041 needs recovery_work. Both deferred fixtures now apply0041 after0006; foundation5/5 and focused synthetic recovery1/1 pass, with lint/source checks passing. Follow-up run42547031897 passed frontend/contracts/recovery but exposed an obsolete batch D1-count expectation and a missing Origin header in the new browser operator fixture. The exact batch budget is now13/17/19 for2/4/5 sessions (one added metadata read); all six cold/warm scenarios pass. Browser fixture now sends the required same-origin header; server guards remain intact. Final-head CI remains pending; nothing is staged/deployed.

## Recording reconciliation and limits

Captures7/8 show the same two-tab single-session race: winner succeeds, loser does not adopt its payment flow on refresh. Expiry release succeeds; the later retry is blocked by two proven unpaid expiries on the shared IP, until9 November2026 06:42:29 Singapore time. No production data/settings were changed. HAR cannot prove visual notice/loader behavior or multi-session acceptance. Source and evidence owners are reconciled in Journey and booking-flows. Truly unknown provider writes remain protected pending provider/operator verification; the new endpoint does not turn an empty lookup into proof.
