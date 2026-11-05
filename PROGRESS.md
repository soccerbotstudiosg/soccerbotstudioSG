# Current checkpoint

Observed 5 November 2026. History belongs to [Journey](docs/journey.md).

## Active work — round-four booking UI and recovery audit

PR29 merged as618a014; main CI42041579247 and production deployment42043167302 passed. Sandbox booking, HitPay checkout/webhook/recovery, trusted provider reads, live readback and warming were restored and independently read back. Production source remains618a014 until this candidate is verified.

Local branch `fix/booking-round-four`, base618a014. Owner authorizes local fixes, logic/regression audit, push/staging, then production deployment. Preserve all changes. No assistant browser or provider booking/payment/cancellation operations.

Round-four HAR: the original unpaid booking was created around22:34 SGT and its slot was observed returning around22:54. A subsequent booking created22:56:21 had invoice due22:58:20. Retained server diagnostics identify `native_checkout_expiry_unverified`; a session was created, no completed association or HitPay hold followed. The second tab received checkout_already_active against that incomplete same-start attempt. Two-minute due evidence does not establish an additional guaranteed ten-minute payment window. Owner is testing that hypothesis; the three-minute minimum and authoritative invoice deadline guard remain intact pending evidence.

Candidate: restore full-width session configuration after compact card click; simplify pricing/player/trainer presentation; standardize totals and H1 colours; clear stale expiry notice after new edits. Same-start incomplete attempts receive fresh capacity classification without new writes. Protected context distinguishes incomplete creation from payment checking. Additive migration0038 retains a separate three-minute recovery buffer only on new attempts (8pay +1check +3recover); actual provider hold/payment deadline is unchanged.

Local verification complete: verify:worker484/484; verify:code254 component/service cases,184 tooling checks, installer suites, formatting/lint/types/audit, build and11-route export. Both regression mutations fail at the intended assertions (incomplete same-start conflict and known-paid invalid booking); restored code passes. All27 changed-document Mermaid diagrams parse. First failed receipts and fixture/count repairs are retained in Journey and /tmp/round4-* logs. Source unchanged after the complete passes; only this delivery checkpoint was reconciled. Next: commit/push, draft PR, exact-head CI and authorized staging. Browser acceptance remains CI/owner-operated.

Material release blocker: two-minute provider invoices cannot support the chosen eight-minute payment window; incomplete creation has no automatic release path. UI now states studio assistance is needed rather than promising ongoing recovery. Owner clarification pending: restore SimplyBook timeout to10 minutes, or retain2 and hold production. Continue independent audit, code verification and CI/staging preparation. Do not claim the incomplete recovery defect is solved. Production remains618a014.
