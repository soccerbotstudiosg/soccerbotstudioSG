# Current checkpoint

## Current change

Branch `fix/calendar-cue-position`, based on PR44 main `548a7d5`. Owner requested a centred studio-style arrow that persists through manual mobile scrolling, approved explicit next-step action labels, and requested basic validation for all booking details. Implemented fixed shared-style cue, approved labels, contact field validation on blur and email validation before challenge dispatch. Also added confirmation email guidance and removed a demonstrated separate-receipt wait after confirmed status with matched details. The reported live8–9-second latency is not fully attributed without request timing.

## Verification and delivery

All268 final component/service cases and the strict zero-skip inventory receipt passed; all34 focused confirmation cases also passed after removing the demonstrated receipt wait. Lint, TypeScript and source integrity passed. Existing component/browser cases updated without intentional inventory changes. Publish a draft candidate after checks; this new slice has not been authorized for a new production release. Owner/CI operates browser tests. PR44 release receipts and limitations are reconciled in Journey.

## Remaining scope

CI and device acceptance remain pending. Unknown SimplyBook no-creation reconciliation, Grafana activation/contact point, analytics/Search Console/OpenGraph and paused docs PR33 remain separate.
