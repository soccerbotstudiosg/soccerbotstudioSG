# Current checkpoint

## Active outcome

Owner authorized a new ready PR, CI and staging for once-per-fresh-entry identity checks and a single JSON calendar-window request. Branch `fix/identity-once-per-booking` starts at production/main f5a58fe7c12639260a526ceedde0249053fca228 (PR62). Prior release evidence is in Journey/PR62. No follow-up merge authorization.

## Scope and acceptance

Retain current guest/verified/signed-out presentation throughout internal navigation. Fresh entry resets the readiness marker; protected operations retain server authentication. One `/api/calendar/snapshot` download on site arrival supplies the booking window and original freshness deadlines; switching fresh months requires no extra request. Missing/expired/failed data never proves availability. Conflict, payment and expiry recovery remain separate and authoritative.

## Evidence and next action

Complete code verification passed 320 unit tests, strict inventory and production export; Worker types, four inventory guards, 207 sustained Worker tests and baseline/fault load smoke passed. Subsequent UI changes collapse Review Turnstile spacing when hidden and use regular-weight footer headings. Both widget lifecycle tests, affected lint and source ownership checks passed; final type check is included before publication. First failures and diagnoses remain in Journey. Publish the consolidated ready PR and verify all exact-head CI gates plus actual staging/health. CI, staging and owner visual/provider acceptance remain pending. No follow-up merge or production authorization.

## Work block

One checkout, no agents. Continue the authorized implementation/publication block, preserving first failures. Test inventory adds two frontend cases; Worker inventory remains unchanged because the existing warming scenario is strengthened. Keep unrelated configuration, dependencies and production untouched.
