# Current checkpoint

## Active outcome

Consolidate booking presentation fixes on `fix/booking-loader-and-code-exit`, based on production/main f39f5e7a1ba2f904ceadc5fa3124a0c94e938b8a. Owner authorized ready PR, CI and staging only. Production remains unchanged.

## Candidate and acceptance

Single message-free entry/step loader; no signed-in choice-card flash; explicit empty cached days without lingering session loader; one-line mobile verified email; Get Verification Code form label. Existing leave-booking warning remains; no code-specific warning, invalidation, API/schema change or limit change. Codes keep independent120-second validity. See booking scenarios and technical behavior owners.

## Verification and next action

Local `npm run verify:code` passed (source/policy/audit/tooling/installer/format/lint/types/unit inventory/build/export); retained focused failures and cause are in Journey. Push ready PR, require all exact-head frontend/backend/live-email CI gates and actual staging deployment/health. Browser and physical-device execution remains owner/CI-only. No merge/production authorization. Test inventories remain unchanged because existing cases are strengthened; removed cancellation prototype is excluded. Ordered owner test plan is in docs/uat/simulated-user.md.

## Work block

Continue one bounded publication block with existing checkout and no agents: finish checks, publish, inspect CI failures if any, verify staged revision. Preserve first failures and report concrete blockers; do not weaken gates or change deployment configuration.
