# Current checkpoint

Observed 5 November 2026. History belongs to [Journey](docs/journey.md).

## Round-four booking presentation and recovery

Branch `fix/booking-round-four`, [PR30](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/30), based on production618a014. Owner authorizes fixes, logic/regression audit, CI/staging, then production. No assistant browser or real booking/payment/cancellation operations.

Implemented: compact priced session card expands to original full-width options; simplified player/trainer presentation and consistent totals; transient expiry notice; incomplete booking assistance instead of payment spinner; known-paid invalid result retains warning. Same-start incomplete recovery uses fresh studio capacity classification while prepared checkouts retain their original no-read/no-write response. New immutable recovery buffer is8+1+3; invoice/payment guard, existing attempts and cache probes remain unchanged.

Local first-candidate verification passed484 Worker cases and complete code gate (254 unit/service,184 tooling, installer checks, build/export). CI42060147079 exposed obsolete browser assertions and a prepared-checkout classification regression, repaired in47df8fe. Second CI42062521297 passed frontend, every browser shard and all Worker groups/runtime. Final release probes failed because their separate explicit migration fixture omitted0038. The current repair adds0038 and enforces complete/unique migration coverage. Exact failed artifact13432791392 passed isolated replay with the repaired checker; missing0038 mutation fails correctly;40 related tooling cases passed. Only release tooling/docs changed after successful application/browser checks. Original failures and local receipt limitations are retained in Journey.

Next: push consolidated release-fixture repair, verify all exact-head CI gates and actual staging deployment/health. Keep tested source unchanged during checks. No current PR staging or production deployment yet; production remains618a014 with previously enabled sandbox settings.

Production decision pending: owner reports cancellation emails22:51/23:01. The second booking was created22:56:21 with invoice due22:58:20; this does not establish an extra ten-minute base. Two-minute provider invoices cannot safely support eight minutes to pay. Asked owner to restore SimplyBook timeout to10 minutes or keep2 and hold production. No answer yet. Incomplete creation without association still requires assistance; do not claim automatic recovery is implemented or remove the invoice guard based on the hypothesis.
