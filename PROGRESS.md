# Current checkpoint

Observed5 November2026, Singapore. Historical evidence belongs in [Journey](docs/journey.md).

## Current task — Security documentation and regression evidence

Extend PR26 on `fix/calendar-cache-diagnostics`, starting from `b2ba89bdc4f645b309ff597d20012ddf5061dbdb`. Consolidate the calendar repair with standardized security documentation and bounded diagnostic security tests. No provider/account changes, merge or production deployment are part of this follow-up. One bounded review block (up to six iterations/90 minutes); local non-browser checks and exact-head CI are separate evidence.

- The original PR26 head passed all13 CI jobs41948740595 plus CodeQL41948738456. Staging deployment41949885632 actually deployed that revision; public health matched, November calendar returned200, all three months were persisted by warming, and the customer request had matching cache hit/serve logs. Production remains on PR25 merge `5f179a0`.
- New local changes split controls into `docs/security/security-infrastructure.md` and assessments into `docs/security/false-positives.md`, retaining unresolved advisory and external-acceptance limits. Updated incoming links, document ownership and nested-document formatting coverage.
- Added two cache logging regressions. The original object spread failed the sensitive-canary/identity assertion; explicit runtime allowlisting passes the focused cases. The Worker inventory is477 (groups118/195/164); existing guard rejection tests pass. Fresh npm audit reports zero vulnerabilities; GitHub alert closure remains unverified. No scanner suppression or alert dismissal. Final contracts wrapper passed118/118 with complete inventory/receipt checks. All14 verify:code gates passed, including250 frontend and183 tooling tests plus the production build/export. These receipts precede this final documentation-only checkpoint; CI for the new head is pending.
- Staging SimplyBook has no booking capacity. Owner trials use the production sandbox after authorized release/configuration checks. Grafana expansion, identity-email/Resend enquiry setup and large-function refactoring remain deferred. Existing owner A–D evidence and failed traces remain retained.

## Immediate remaining tasks

1. Publish the locally verified consolidated update on PR26. New source requires new exact-head CI and staging evidence; the earlier staged head does not accept this follow-up. Owner staging acceptance and merge authorization remain required.
2. After production release is separately authorized, verify settings, the calendar response/cache traces and the [A–D continuation](docs/uat/simulated-user.md#5-november-ad-continuation). Owner performs browser/payment tests. Confirm the account-wide booking limit before capacity acceptance; do not infer cancellation from a zero timer.
3. Retain HAR/screen recordings, exact timings and invoice comparison. Paid unresolved outcomes retain their original attempt; no repeated payment. Preserve historical overlapping bookings.
4. Keep the unverified GitHub legacy minimatch alert state and external security/quality proof explicit in [assessments](docs/security/false-positives.md). Provider journeys, operator MFA, edge configuration, ingestion/alerts and populated recovery cannot be certified by synthetic source tests.
