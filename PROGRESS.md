# Current checkpoint

Observed 5 November 2026. Historical evidence belongs in [Journey](docs/journey.md).

## Active campaign — testFull-2 recovery

Branch `fix/testfull2-recovery`, base `c2b7c1c` (PR27). Owner now authorizes combining fixes, pushing CI and marking ready for staging; no merge/production deployment or provider writes in this task. Preserve the prior production activation receipt in provider configuration/Journey. Official app links supplied by owner.

Outcome: recover old-confirmation navigation, provider-return continuation, status feedback, structured summary, rejected-checkout restoration and delayed provider availability without fabricated free slots. Persist targeted date reads at the original hold deadline and bounded retries, independent of browser life. Strictly validate expired HitPay requests containing unstarted payment-method entries; retain paid/unknown/late-payment guards.

Evidence: testFull-2 HAR and owner read-only HitPay response established expired request with `requires_payment_method`, not an empty payment list. SimplyBook due15:02/cancellation observed15:11 is provider delay; official support reports a similar extra delay but no guaranteed scheduler cadence. The recovered Nov6 slot proves eventual availability, not immediate release. Raw HAR/customer/provider payloads remain outside source.

Work block: first implementation/focused-check block covers UI, unpaid proof and durable probes; next bounded block (six iterations/90 minutes maximum) covers complete verification, reconciliation and publication. Focused failures retained in /tmp/testfull2-* logs: obsolete navigation assertions, invalid summary fixture total, missing synthetic DO inspection setting and restoration fixture mode. Fix fixture causes without weakening financial guards. Full local code wrapper passed252 tests,184 tooling checks,31 installer tests, audit/lint/types/build/export. Full Worker wrapper passed482 cases. Final defensive invalidation ordering passed both affected cache regressions and Worker types; source/format/diff checks follow publication preparation. Exact-head CI and owner/CI browser execution remain pending, as do staging/provider acceptance.

Next: commit/push this reviewed candidate, create draft PR, mark ready for staging as requested and retain exact-head CI/deployment receipts in the PR. Do not claim staging deployed without exact revision/health evidence.
