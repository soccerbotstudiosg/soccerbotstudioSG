# Current checkpoint

## Outcome and authority

PR55 (`fix/booking-heading-layout`) removes the premature Guest badge from initial choices/Guest→Back and standardizes mobile booking headings. Owner authorized staging then production. Booking, payment, conflict/expiry, provider settings and dependencies are unchanged. Production remains PR54 merge8e842fa.

## Evidence and current repair

Full unit305/305, focused account/async/parity59/59 and direct-checkout51/51 passed. Original failures and corrections are retained in Journey. CI42955586485 on759fd9c passed frontend, Worker verification and three browser shards; backend shard1 failed a synthetic evidence timing fixture, leaving backend/live-email aggregation skipped. The trace returned stale evidence rather than the scenario's expected paid-invalid evidence.

The browser test now synchronizes its first confirmation read with saved synthetic evidence and checks the exact paid-invalid reason. Production checking rules are untouched. Formatting, ESLint, fresh TypeScript and source/integrity checks pass. Test inventory remains unchanged by this repair. No assistant browser execution or live provider effects.

## Next action

Publish the consolidated test correction to PR55, verify all exact-head gates, then actual staging and production under existing authorization. CI browser proof and physical phone appearance remain pending. Journey owns retained run/artifact evidence; booking scenarios and UAT already describe the entry/header changes.
