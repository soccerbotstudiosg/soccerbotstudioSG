# Current checkpoint

Observed 4 November 2026, Singapore. Historical evidence belongs in [Journey](docs/journey.md#part-2--dated-changes-and-evidence).

## Current state

- PR24 merged as `c76964451034bae7db8699d7786716713ed47b7e`. PR verification41773221143 passed all13 jobs; managed CodeQL analysis completed successfully but has findings, not a clean security acceptance. Main verification41801430789 passed; production release41803079395 was subsequently queued, and its final deployment/configuration needs readback before claiming live readiness.
- Deployment audit found PR20–24 staging jobs skipped because the PRs were draft. Last observed successful staging deployment41461046935 was2 November. Owner requested no workflow changes, will explicitly request staging before future merges, and authorized staging catch-up. Manual staging-target verification41806584127 now passed all13 jobs for current main; the artifact log confirms `RELEASE_TARGET: staging`. Owner has the exact fields for the reserved trusted-main deployment; its outcome remains pending. Connected tools cannot dispatch/set variables; workspace GitHub API access is blocked. Owner has been given the exact revision and steps; no staging catch-up completion is claimed.
- Staging SimplyBook has no booking capacity; owner will reconnect after production launch. This does not prevent code deployment/health checks or establish provider acceptance. Production test settings were enabled before PR24; normal deployment can restore closed defaults. Recheck before testing.

## Active security repair

- Local branch `fix/security-url-and-minimatch`, based on merged main. Replaced51 HitPay URL substring checks with an exact-host test helper in four Worker/browser suites. Both API environments remain recognized so wrong-environment assertions remain meaningful. One tooling regression covers legitimate hosts and spoofed path/query/credentials/suffix URLs. No application/provider transport changes or browser/Worker inventory changes.
- Scoped typescript-estree minimatch override10.2.6→11.0.4; named matching API probes and repository lint pass. Generated dependency inventory updated. Legacy3.1.5 remains reported by the broad advisory; no compatible published backport, and a global override would break callable CommonJS/makeRe consumers. Its source lacks the specific described amplification preprocessor. Keep alert open; see [Security disposition](docs/security.md#minimatch-advisory-disposition-4-november-2026). No suppressed audits or dismissed findings.
- Full local Worker472/472 and code verification pass (183 tooling tests, installer checks, formatting/lint/types, frontend250 tests, production build/export). The first code pass found a missing shared-fixture TypeScript declaration; added the existing-pattern `.d.mts` declaration and reran code verification successfully. Original failure receipts remain retained. Browser/CodeQL acceptance requires the new candidate's CI. User will report remaining CodeQL findings after rescanning; current tools cannot retrieve the complete security-alert list.

## Immediate remaining tasks

1. Publish the verified security candidate as a draft for CI and review its exact-head outcomes. Report the residual minimatch3 alert explicitly. No merge or deployment is authorized for this security repair; staging happens only on explicit owner instruction.
2. Complete the owner-triggered staging catch-up and verify the exact revision and health. Before production tests, inspect production deployment/configuration separately. Never equate green eligibility with deployed staging.
3. Retain recording A as completed with exceptions, not fully accepted. Retest fixed-grid/manual-booking/buffer/shared-capacity behavior after the owner enables account-wide booking limits. Actual interval API shape and provider capacity remain live acceptance gaps. Receive recording A as ZIP for HAR diagnosis; its original exceeds the32MiB download limit.
4. Continue the [owner test sequence](docs/uat/simulated-user.md#4-november-full-owner-test-round), including idle confirmation, timer expiry, back-to-back single/multi and stale-tab checkout. Compare invoice numbers to provider email and capture checkout/confirmation timing.

## Verification limits

No assistant browser, real booking/payment, email, provider-setting or data-cleanup actions. HAR proves network outcomes, not UI paint. Existing historical overlapping bookings are retained. Resend/custom enquiry delivery and identity email remain deferred. Large-function refactor remains advice-only. Future staging requires the owner's explicit instruction; no workflow changes requested.
