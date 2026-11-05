# Current checkpoint

Observed 5 November 2026. Historical evidence belongs in [Journey](docs/journey.md).

## Current task — Checkout release and calendar recovery

Extend PR27 on `fix/booking-price-alignment`, based on main `eb0649475c9fe80a4349d87dc945fccbb7bba06b`; published UI head `e79ecf15ed0b98331991dd0d042273c069dc5a38`. User authorized the complete expiry/cache repair, local verification, CI push and staging readiness. No merge or production deployment is authorized.

Implemented locally: new attempts retain8/9/10-minute payment/checking/hold windows through additive migration0037; old attempts keep their recorded windows. Authenticated expired/canceled requests with explicit empty payment evidence can release after the original hold/checking deadlines, without deleting payment journals. Unprocessed receipts block release; late money remains on its original attempt for review. Release refreshes only affected days in retained backend months; browser retries preserve other months. Warming admits one due month per minute, prioritizing missing months and rotating failed work; valid snapshots retain their original deadline. Existing PR27 presentation changes remain.

## Verification and next actions

Local verification passed: 252 frontend tests, 184 tooling tests, 58 installer tests, all 482 isolated Worker tests, source/policy/format/lint/type checks, zero audit vulnerabilities and production build/export. Focused negative mutation probes demonstrated that terminal-payment proof, warming fairness and browser month retention assertions reject their broken paths. Full evidence and first failures are retained in Journey.

The earlier UI-only CI run41969187614 failed because the typography test still required the approved larger final total to be16px. The assertion now checks the total explicitly at24px while preserving16px body checks. Source, lint, types and formatting pass; browser verification belongs to the new exact-head CI run. Test inventory retains all original entries plus one new frontend case and five Worker cases.

Publish the consolidated candidate on PR27 and verify frontend/backend/live-email CI gates before staging. PR27 is already marked ready, but ready status is not evidence of deployment. Owner staging/device/provider acceptance remains pending; verify the provider's saved10-minute timeout before expiry UAT. No merge or production deployment is authorized. No assistant browser execution or live booking/payment/cancellation occurred.
